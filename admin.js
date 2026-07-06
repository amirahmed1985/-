// ===== إعدادات لوحة التحكم =====
let currentSearchQuery = '';
let unsubOrders = null;

// ===== تحويل الأرقام للعربية =====
function toArabicDigits(num) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, d => arabicDigits[d]);
}

// ===== قائمة المنتجات =====
function getAllProducts() {
    const byCat = getProductsByCategory();
    return [...byCat.dogs_cats, ...byCat.birds, ...byCat.farm].sort();
}

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

// ===== Firestore: تحميل المخزون =====
async function loadStock() {
    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const snap = await getDoc(doc(window.db, 'state', 'stock'));
    return snap.exists() ? snap.data() : {};
}

// ===== Firestore: حفظ المخزون =====
async function saveStock(stock) {
    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    await setDoc(doc(window.db, 'state', 'stock'), stock);
}

// ===== عرض عناصر المخزون مع البحث =====
async function renderStockItems(productsToShow = null) {
    const stockContents = document.getElementById('stockContents');
    const productsByCategory = getProductsByCategory();
    const stock = await loadStock();

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

        if (productsToShow) {
            products = products.filter(p => productsToShow.includes(p));
        }

        if (products.length === 0) return;
        totalFound += products.length;

        html += `
            <div style="background: linear-gradient(135deg, rgba(59, 92, 58, 0.05), rgba(217, 142, 59, 0.05)); border: 2px solid rgba(59, 92, 58, 0.2); border-radius: 12px; padding: 1.5rem; overflow: hidden;">
                <h3 style="font-family: 'El Messiri', sans-serif; color: var(--deep); margin-top: 0; margin-bottom: 1.5rem; font-size: 1.3rem; display: flex; align-items: center; gap: 0.7rem;">
                    <span style="font-size: 1.8rem;">${categoryLabel.icon}</span>
                    ${categoryLabel.name}
                </h3>
                <div style="display: grid; gap: 1rem;">
                    ${products.map(product => {
                        const isInStock = stock[product] !== false;
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.7); border-radius: 8px; border: 1px solid rgba(59, 92, 58, 0.1);">
                                <div>
                                    <div style="font-weight: 600; color: var(--ink); font-size: 0.95rem;">${product}</div>
                                    <div style="font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">
                                        <span style="font-size: 1rem;">${isInStock ? '✓' : '✕'}</span>
                                        ${isInStock ? '<span style="color: var(--deep);">متوفر في المخزون</span>' : '<span style="color: var(--clay);">غير متوفر</span>'}
                                    </div>
                                </div>
                                <button class="stock-toggle-btn" data-product="${product}" style="padding: 0.6rem 1.2rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; background: ${isInStock ? 'var(--deep)' : 'var(--amber)'}; color: var(--paper); white-space: nowrap;">
                                    ${isInStock ? 'وقف البيع' : 'استئناف البيع'}
                                </button>
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

    document.querySelectorAll('.stock-toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.target.disabled = true;
            const product = e.target.dataset.product;
            const newStock = await loadStock();
            newStock[product] = newStock[product] === false ? true : false;
            await saveStock(newStock);
            await renderStockItems(productsToShow);
        });
    });
}

// ===== إعداد البحث =====
function setupStockSearch() {
    const searchInput = document.getElementById('stockSearch');
    if (!searchInput) return;

    searchInput.value = currentSearchQuery;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        currentSearchQuery = query;
        const allProducts = getAllProducts();

        if (query === '') {
            renderStockItems();
        } else {
            const filtered = allProducts.filter(product => product.toLowerCase().includes(query));
            renderStockItems(filtered);
        }
    });
}

// ===== عرض طلب واحد =====
function renderOrder(order, index, total) {
    const s = order.shippingData || {};
    return `
        <div style="background: rgba(59, 92, 58, 0.05); padding: 1.2rem; border-radius: 6px; margin-bottom: 1rem; border: 1px solid rgba(59, 92, 58, 0.1);">
            <div style="font-weight: 600; color: var(--deep); margin-bottom: 0.8rem;">الطلب #${toArabicDigits(total - index)}</div>
            <div style="font-size: 0.9rem; color: var(--ink-soft); margin-bottom: 0.5rem;">
                <strong>الوقت:</strong> ${s.timestamp || '—'}
            </div>
            <table class="cart-table" style="margin-top: 0.8rem;">
                <tr><td><strong>الاسم:</strong></td><td>${s.fullName || ''}</td></tr>
                <tr><td><strong>الهاتف:</strong></td><td>${s.phone || ''}</td></tr>
                <tr><td><strong>البريد:</strong></td><td>${s.email || ''}</td></tr>
                <tr><td><strong>المدينة:</strong></td><td>${s.city || ''}</td></tr>
                <tr><td><strong>العنوان:</strong></td><td>${s.address || ''}</td></tr>
            </table>
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(59, 92, 58, 0.1);">
                <div style="font-weight: 600; margin-bottom: 0.5rem;">المنتجات:</div>
                <ul style="margin: 0; padding-right: 1.5rem;">
                    ${(order.items || []).map(item => `
                        <li>${item.name} × ${toArabicDigits(item.qty)} = ${toArabicDigits(item.price * item.qty)} ر.س.</li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
}

// ===== الاستماع الحي للطلبات من Firestore =====
async function listenToOrders() {
    const { collection, query, orderBy, onSnapshot } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );

    const ordersContents = document.getElementById('ordersContents');
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

        let totalItems = 0;
        let totalPrice = 0;
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
        ordersContents.innerHTML = '<p class="empty-message">تعذر تحميل الطلبات، تحقق من تسجيل الدخول</p>';
    });
}

// ===== عرض شاشة تسجيل الدخول =====
function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    if (unsubOrders) { unsubOrders(); unsubOrders = null; }
}

// ===== عرض لوحة التحكم =====
async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    await renderStockItems();
    setupStockSearch();
    await listenToOrders();
}

// ===== معالجة تسجيل الدخول عبر Firebase Auth =====
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('errorMsg');

    try {
        const { signInWithEmailAndPassword } = await import(
            "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
        );
        await signInWithEmailAndPassword(window.auth, email, password);
        errorMsg.textContent = '';
    } catch (err) {
        console.error(err);
        errorMsg.textContent = '❌ بيانات الدخول غير صحيحة';
        document.getElementById('password').value = '';
    }
});

// ===== تسجيل الخروج =====
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await signOut(window.auth);
});

document.getElementById('clearCartBtn').addEventListener('click', async () => {
    if (confirm('هل أنت متأكد من إعادة ضبط المخزون؟ (الطلبات تُدار من Firestore مباشرة)')) {
        await saveStock({});
        await renderStockItems();
        alert('✓ تم إعادة ضبط المخزون');
    }
});

// ===== مراقبة حالة تسجيل الدخول =====
window.addEventListener('load', async () => {
    const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    onAuthStateChanged(window.auth, (user) => {
        if (user) {
            showDashboard();
        } else {
            showLogin();
        }
    });
});