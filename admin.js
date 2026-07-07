import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ===== تحويل الأرقام للعربية =====
function toArabicDigits(num) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, d => arabicDigits[d]);
}

// ===== قائمة المنتجات وأقسامها المعتمدة بموقعك =====
function getProductsByCategory() {
    return {
        dogs_cats: [
            'Bio Alpha', 'Bio BK Choline', 'BioVita', 'Bio Nox', 'Vinocid',
            'Bio Thyme', 'Bio Phospho D', 'Bio Minerals', 'Bio E Selenium 20%', 'Bio AD3E Plus'
        ],
        birds: [
            'Bio Alpha — طيور', 'Bio BK Choline — طيور', 'BioVita — طيور', 'Bio Nox — طيور', 'Vinocid — طيور',
            'Bio Thyme — طيور', 'Bio Phospho D — طيور', 'Bio Minerals — طيور', 'Bio E Selenium 20% — طيور', 'Bio AD3E Plus — طيور'
        ],
        farm: [
            'علاج تطعيمي — حيوانات المزرعة',
            'مضاد طفيليات داخلية وخارجية — أبقار وأغنام',
            'مكمّل معدني للأعلاف — حيوانات المزرعة',
            'محلول إلكتروليت — عجول وأغنام'
        ]
    };
}

function getAllProducts() {
    const byCat = getProductsByCategory();
    return [...byCat.dogs_cats, ...byCat.birds, ...byCat.farm].sort();
}

let currentSearchQuery = '';
let unsubOrders = null;

// ===== Firestore: تحميل وعرض المخزون بالأرقام الرقمية المحدثة =====
async function renderStockItems(productsToShow = null) {
    const stockContents = document.getElementById('stockContents');
    if (!stockContents) return;

    const productsByCategory = getProductsByCategory();
    
    let stock = {};
    try {
        const snap = await getDoc(doc(window.db, 'state', 'stock'));
        stock = snap.exists() ? snap.data() : {};
    } catch (err) {
        console.error("خطأ في جلب بيانات المخزون:", err);
    }

    const categoryInfo = {
        dogs_cats: { name: '🐕 كلاب وقطط', icon: '🐕' },
        birds: { name: '🦜 الطيور', icon: '🦜' },
        farm: { name: '🐄 الحيوانات المزرعية', icon: '🐄' }
    };

    let html = '<div style="display: grid; gap: 2rem;">';
    let totalFound = 0;

    Object.keys(productsByCategory).forEach(category => {
        const categoryLabel = categoryInfo[category];
        let products = productsByCategory[category];
        if (productsToShow) products = products.filter(p => productsToShow.includes(p));
        if (products.length === 0) return;
        totalFound += products.length;

        html += `
            <div style="background: linear-gradient(135deg, rgba(59,92,58,0.05), rgba(217,142,59,0.05)); border: 2px solid rgba(59,92,58,0.2); border-radius: 12px; padding: 1.5rem;">
                <h3 style="font-family: 'El Messiri', sans-serif; color: var(--deep); margin-top: 0; margin-bottom: 1.5rem; font-size: 1.3rem; display: flex; align-items: center; gap: 0.7rem;">
                    <span style="font-size: 1.8rem;">${categoryLabel.icon}</span>
                    ${categoryLabel.name}
                </h3>
                <div style="display: grid; gap: 1rem;">
                    ${products.map(product => {
                        // دعم التوافقية البرمجية مع القيم السابقة (True/False/Numbers)
                        let currentVal = stock[product];
                        if (currentVal === true || currentVal === undefined) currentVal = 10;
                        if (currentVal === false) currentVal = 0;
                        currentVal = Number(currentVal);

                        const inputId = `input-${btoa(encodeURIComponent(product)).replace(/=/g, '')}`;

                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.7); border-radius: 8px; border: 1px solid rgba(59,92,58,0.1);">
                                <span style="font-weight: 600; color: var(--ink); font-size: 0.95rem;">${product}</span>
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    <input type="number" id="${inputId}" value="${currentVal}" min="0" style="width: 80px; padding: 0.4rem; border: 1px solid var(--line); border-radius: 5px; text-align: center; font-family: var(--body);">
                                    <button class="save-stock-btn" data-product="${product}" data-input="${inputId}" style="padding: 0.5rem 1rem; background: var(--deep); color: var(--paper); border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-family: var(--body);">تحديث</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    if (totalFound === 0 && productsToShow) {
        html = '<p class="empty-message">لم يتم العثور على منتجات</p>';
    }

    html += '</div>';
    stockContents.innerHTML = html;

    // تفعيل وظائف حفظ الأرقام في الفايرستور
    document.querySelectorAll('.save-stock-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const product = e.target.dataset.product;
            const inputEl = document.getElementById(e.target.dataset.input);
            const newQty = parseInt(inputEl.value);

            if (isNaN(newQty) || newQty < 0) return;

            try {
                e.target.disabled = true;
                e.target.textContent = '...';

                const snap = await getDoc(doc(window.db, 'state', 'stock'));
                const currentStock = snap.exists() ? snap.data() : {};
                currentStock[product] = newQty;

                await setDoc(doc(window.db, 'state', 'stock'), currentStock);
                alert(`✓ تم تحديث كمية (${product}) إلى: ${newQty}`);
            } catch (err) {
                console.error("خطأ أثناء الحفظ:", err);
                alert('تعذر الحفظ، حاول مرة أخرى.');
            } finally {
                e.target.disabled = false;
                e.target.textContent = 'تحديث';
            }
        });
    });
}

// ===== إعداد شريط البحث للمخزون =====
function setupStockSearch() {
    const searchInput = document.getElementById('stockSearch');
    if (!searchInput) return;
    
    searchInput.value = currentSearchQuery;

    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    newSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        currentSearchQuery = query;
        if (query === '') {
            renderStockItems();
        } else {
            const filtered = getAllProducts().filter(p => p.toLowerCase().includes(query));
            renderStockItems(filtered);
        }
    });
}

// ===== إنشاء قالب الطلب المستلم المستمع للبيانات =====
function renderOrder(order, index, total) {
    const s = order.shippingData || {};
    return `
        <div style="background: rgba(59,92,58,0.05); padding: 1.2rem; border-radius: 6px; margin-bottom: 1rem; border: 1px solid rgba(59,92,58,0.1);">
            <div style="font-weight: 600; color: var(--deep); margin-bottom: 0.8rem;">الطلب #${toArabicDigits(total - index)}</div>
            <div style="font-size: 0.9rem; color: var(--ink-soft); margin-bottom: 0.5rem;"><strong>الوقت:</strong> ${s.timestamp || '—'}</div>
            <table class="cart-table" style="margin-top: 0.8rem;">
                <tr><td><strong>الاسم:</strong></td><td>${s.fullName || ''}</td></tr>
                <tr><td><strong>الهاتف:</strong></td><td>${s.phone || ''}</td></tr>
                <tr><td><strong>البريد:</strong></td><td>${s.email || ''}</td></tr>
                <tr><td><strong>المدينة:</strong></td><td>${s.city || ''}</td></tr>
                <tr><td><strong>العنوان:</strong></td><td>${s.address || ''}</td></tr>
            </table>
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(59,92,58,0.1);">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">المنتجات:</div>
                <ul style="margin: 0; padding-right: 1.5rem;">
                    ${(order.items || []).map(item => `<li>${item.name} × ${toArabicDigits(item.qty)} = ${toArabicDigits(item.price * item.qty)} ر.س.</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// ===== الاستماع الحي والمستمر للطلبات المضافة =====
async function listenToOrders() {
    const ordersContents = document.getElementById('ordersContents');
    if (!ordersContents) return;

    const q = query(collection(window.db, 'orders'), orderBy('createdAt', 'desc'));
    if (unsubOrders) unsubOrders();
    
    unsubOrders = onSnapshot(q, (snapshot) => {
        const orders = [];
        snapshot.forEach(docSnap => orders.push(docSnap.data()));
        if (orders.length === 0) {
            ordersContents.innerHTML = '<p class="empty-message">لا توجد طلبات</p>';
        } else {
            ordersContents.innerHTML = orders.map((order, idx) => renderOrder(order, idx, orders.length)).join('');
        }
        let totalItems = 0, totalPrice = 0;
        orders.forEach(order => {
            (order.items || []).forEach(item => {
                totalItems += item.qty;
                totalPrice += item.price * item.qty;
            });
        });
        document.getElementById('totalItems').textContent = toArabicDigits(totalItems);
        document.getElementById('totalPrice').textContent = `${toArabicDigits(totalPrice)} ر.س.`;
    }, (err) => {
        console.error('فشل تحميل الطلبات الدورية:', err);
        ordersContents.innerHTML = '<p class="empty-message">تعذر تحميل الطلبات الحالية</p>';
    });
}

// ===== وظائف التبديل وعرض الشاشات المقفلة وعكسها =====
function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    if (unsubOrders) { unsubOrders(); unsubOrders = null; }
}

async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    await renderStockItems();
    setupStockSearch();
    await listenToOrders();
}

// ===== تهيئة التطبيق الأساسية عند اكتمال الجاهزية للفايربيز =====
function initAdminSystem() {
    onAuthStateChanged(window.auth, (user) => {
        if (user) {
            showDashboard();
        } else {
            showLogin();
        }
    });

    // تسجيل الدخول مع تأمين الحماية البرمجية المباشرة لمنع التحديث Refresh
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // إيقاف السلوك التلقائي المسبب للتحديث فوراً
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('errorMsg');
            const submitBtn = loginForm.querySelector('.login-btn');

            try {
                submitBtn.textContent = 'جاري الدخول...';
                submitBtn.disabled = true;
                errorMsg.textContent = '';
                
                await signInWithEmailAndPassword(window.auth, email, password);
            } catch (err) {
                console.error("حدث خطأ أثناء محاولة الولوج:", err);
                errorMsg.textContent = '❌ بيانات الدخول غير صحيحة';
                document.getElementById('password').value = '';
            } finally {
                submitBtn.textContent = 'دخول';
                submitBtn.disabled = false;
            }
        });
    }

    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(window.auth);
        });
    }

    // إعادة ضبط البيانات ومسح المخزون
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', async () => {
            if (confirm('هل أنت متأكد من إعادة ضبط وتصفير المخزون بالكامل؟')) {
                try {
                    await setDoc(doc(window.db, 'state', 'stock'), {});
                    await renderStockItems();
                    alert('✓ تم إعادة ضبط المخزون لجميع المنتجات المتاحة');
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }
}

// التأكد الدقيق من تهيئة الكائنات السحابية قبل ربط الأحداث
if (window.auth && window.db) {
    initAdminSystem();
} else {
    const checkFirebaseInstance = setInterval(() => {
        if (window.auth && window.db) {
            clearInterval(checkFirebaseInstance);
            initAdminSystem();
        }
    }, 30);
}