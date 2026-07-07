import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ===== إعدادات لوحة التحكم =====
let currentSearchQuery = '';
let unsubOrders = null;

// ===== تحويل الأرقام للعربية =====
function toArabicDigits(num) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, d => arabicDigits[d]);
}

// ===== قائمة المنتجات =====
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

// ===== عرض المخزون بالتصميم القديم (متوفر/غير متوفر) =====
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

    const categoryNames = {
        dogs_cats: 'كلاب وقطط',
        birds: 'الطيور',
        farm: 'حيوانات المزرعة'
    };

    let html = '';
    let totalFound = 0;

    Object.keys(productsByCategory).forEach(category => {
        let products = productsByCategory[category];
        if (productsToShow) products = products.filter(p => productsToShow.includes(p));
        if (products.length === 0) return;
        totalFound += products.length;

        html += `<h3 style="color: var(--deep); margin-top: 1.5rem; border-bottom: 1px solid var(--line); padding-bottom: 0.5rem;">${categoryNames[category]}</h3>`;
        html += `<div style="display: grid; gap: 0.8rem; margin-top: 1rem;">`;
        
        products.forEach(product => {
            // في التصميم القديم، المخزون إما true (متوفر) أو false (غير متوفر)
            let isAvailable = stock[product] !== false; 

            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem; background: var(--paper); border: 1px solid var(--line); border-radius: 6px;">
                    <span style="font-weight: 500;">${product}</span>
                    <button class="toggle-stock-btn" 
                            data-product="${product}" 
                            data-status="${isAvailable}" 
                            style="padding: 0.4rem 1rem; border: none; border-radius: 4px; font-family: var(--body); font-weight: 600; cursor: pointer; color: #fff; background-color: ${isAvailable ? 'var(--deep)' : 'var(--clay)'}; transition: opacity 0.2s;">
                        ${isAvailable ? 'متوفر' : 'غير متوفر'}
                    </button>
                </div>
            `;
        });
        html += `</div>`;
    });

    if (totalFound === 0 && productsToShow) {
        html = '<p class="empty-message">لم يتم العثور على منتجات</p>';
    }

    stockContents.innerHTML = html;

    // تفعيل أزرار التبديل الكلاسيكية
    document.querySelectorAll('.toggle-stock-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const product = e.target.dataset.product;
            const currentStatus = e.target.dataset.status === 'true';
            const newStatus = !currentStatus; // التبديل للوضع المعاكس

            try {
                e.target.disabled = true;
                e.target.style.opacity = '0.5';

                const snap = await getDoc(doc(window.db, 'state', 'stock'));
                const currentStock = snap.exists() ? snap.data() : {};
                currentStock[product] = newStatus;

                await setDoc(doc(window.db, 'state', 'stock'), currentStock);
                
                // تحديث شكل الزر فوراً
                e.target.dataset.status = newStatus;
                e.target.textContent = newStatus ? 'متوفر' : 'غير متوفر';
                e.target.style.backgroundColor = newStatus ? 'var(--deep)' : 'var(--clay)';
                e.target.disabled = false;
                e.target.style.opacity = '1';

            } catch (err) {
                console.error("خطأ أثناء الحفظ:", err);
                alert('تعذر الحفظ، حاول مرة أخرى.');
                e.target.disabled = false;
                e.target.style.opacity = '1';
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

// ===== عرض الطلبات المستلمة =====
function renderOrder(order, index, total) {
    const s = order.shippingData || {};
    return `
        <div style="background: var(--paper); padding: 1.2rem; border-radius: 6px; margin-bottom: 1rem; border: 1px solid var(--line);">
            <div style="font-weight: 600; color: var(--deep); margin-bottom: 0.8rem;">الطلب #${toArabicDigits(total - index)}</div>
            <div style="font-size: 0.9rem; color: var(--ink-soft); margin-bottom: 0.5rem;"><strong>الوقت:</strong> ${s.timestamp || '—'}</div>
            <table class="cart-table" style="margin-top: 0.8rem;">
                <tr><td><strong>الاسم:</strong></td><td>${s.fullName || ''}</td></tr>
                <tr><td><strong>الهاتف:</strong></td><td>${s.phone || ''}</td></tr>
                <tr><td><strong>البريد:</strong></td><td>${s.email || ''}</td></tr>
                <tr><td><strong>المدينة:</strong></td><td>${s.city || ''}</td></tr>
                <tr><td><strong>العنوان:</strong></td><td>${s.address || ''}</td></tr>
            </table>
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--line);">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">المنتجات:</div>
                <ul style="margin: 0; padding-right: 1.5rem;">
                    ${(order.items || []).map(item => `<li>${item.name} × ${toArabicDigits(item.qty)} = ${toArabicDigits(item.price * item.qty)} ر.س.</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// ===== الاستماع للطلبات =====
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
        console.error('فشل تحميل الطلبات:', err);
        ordersContents.innerHTML = '<p class="empty-message">تعذر تحميل الطلبات الحالية</p>';
    });
}

// ===== شاشات الدخول واللوحة =====
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

// ===== التهيئة الأساسية =====
function initAdminSystem() {
    onAuthStateChanged(window.auth, (user) => {
        if (user) {
            showDashboard();
        } else {
            showLogin();
        }
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // الإصلاح الجذري لمشكلة الـ Refresh هنا
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
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
                console.error(err);
                errorMsg.textContent = '❌ بيانات الدخول غير صحيحة';
                document.getElementById('password').value = '';
            } finally {
                submitBtn.textContent = 'دخول';
                submitBtn.disabled = false;
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await signOut(window.auth);
        });
    }

    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', async () => {
            if (confirm('هل أنت متأكد من إعادة ضبط المخزون لجميع المنتجات لتكون "متوفرة"؟')) {
                try {
                    await setDoc(doc(window.db, 'state', 'stock'), {});
                    await renderStockItems();
                    alert('✓ تم إعادة ضبط المخزون بنجاح');
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }
}

// التأكد من جاهزية الفايربيز
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