// ===== إعدادات لوحة التحكم =====
let currentSearchQuery = '';
let unsubOrders = null;
let allOrdersCache = [];

// ===== انتظار تهيئة Firebase =====
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.auth && window.db) { resolve(); return; }
        const interval = setInterval(() => {
            if (window.auth && window.db) {
                clearInterval(interval);
                resolve();
            }
        }, 50);
    });
}

// ===== تحويل الأرقام للعربية =====
function toArabicDigits(num) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, d => arabicDigits[d]);
}

// ===== قائمة المنتجات مقسّمة حسب الفئة =====
function getAllProducts() {
    const byCat = getProductsByCategory();
    return [...byCat.dogs, ...byCat.cats, ...byCat.birds, ...byCat.farm].sort();
}

function getProductsByCategory() {
    return {
        dogs: [
            'Bio Alpha', 'Bio BK Choline', 'BioVita', 'Bio Nox', 'Vinocid',
            'Bio Thyme', 'Bio Phospho D', 'Bio Minerals', 'Bio E Selenium 20%', 'Bio AD3E Plus'
        ],
        cats: [
            'Bio Thyme — قطط', 'Bio Phospho D — قطط', 'Bio Minerals — قطط', 'Bio E Selenium 20% — قطط', 'Bio AD3E Plus — قطط',
            'Bio Alpha — قطط', 'Bio BK Choline — قطط', 'BioVita — قطط', 'Bio Nox — قطط', 'Vinocid — قطط'
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

// ===== عرض عناصر المخزون =====
async function renderStockItems(productsToShow = null) {
    const stockContents = document.getElementById('stockContents');
    const productsByCategory = getProductsByCategory();
    const stock = await loadStock();

    const categoryInfo = {
        dogs: { name: '🐕 الكلاب', icon: '🐕' },
        cats: { name: '🐱 القطط', icon: '🐱' },
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
                        const isInStock = stock[product] !== false;
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.7); border-radius: 8px; border: 1px solid rgba(59,92,58,0.1);">
                                <div>
                                    <div style="font-weight: 600; color: var(--ink); font-size: 0.95rem;">${product}</div>
                                    <div style="font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem;">
                                        ${isInStock ? '✓ <span style="color:var(--deep);">متوفر</span>' : '✕ <span style="color:var(--clay);">غير متوفر</span>'}
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
        if (query === '') {
            renderStockItems();
        } else {
            const filtered = getAllProducts().filter(p => p.toLowerCase().includes(query));
            renderStockItems(filtered);
        }
    });
}

// ===== إعداد تبويبات الطلبات =====
function setupOrderTabs() {
    document.querySelectorAll('.order-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.order-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const targetId = tab.dataset.tab === 'pending' ? 'pendingPanel' : 'deliveredPanel';
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// ===== عرض طلب واحد =====
function renderOrder(id, order, index, total, isDelivered) {
    const s = order.shippingData || {};
    const actionBtn = isDelivered
        ? `<button class="order-action-btn order-undo-btn" data-id="${id}" data-action="undo">↩ إعادة للحالية</button>`
        : `<button class="order-action-btn order-deliver-btn" data-id="${id}" data-action="deliver">✓ تم التسليم</button>`;

    return `
        <div class="order-card">
            <div class="order-card__top">
                <div style="font-weight: 600; color: var(--deep);">الطلب #${toArabicDigits(total - index)}</div>
                <div class="order-card__actions">
                    ${actionBtn}
                    <button class="order-action-btn order-delete-btn" data-id="${id}" data-action="delete">🗑 حذف</button>
                </div>
            </div>
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

// ===== ربط أزرار التسليم/التراجع/الحذف =====
function bindOrderActions() {
    document.querySelectorAll('.order-action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            const action = e.currentTarget.dataset.action;
            e.currentTarget.disabled = true;

            const { doc, updateDoc, deleteDoc } = await import(
                "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
            );

            try {
                if (action === 'deliver') {
                    await updateDoc(doc(window.db, 'orders', id), { status: 'delivered' });
                } else if (action === 'undo') {
                    await updateDoc(doc(window.db, 'orders', id), { status: 'pending' });
                } else if (action === 'delete') {
                    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
                        await deleteDoc(doc(window.db, 'orders', id));
                    } else {
                        e.currentTarget.disabled = false;
                    }
                }
            } catch (err) {
                console.error('فشل تنفيذ الإجراء:', err);
                e.currentTarget.disabled = false;
            }
        });
    });
}

// ===== عرض الطلبات في اللوحتين =====
function renderOrderLists() {
    const pendingPanel = document.getElementById('pendingPanel');
    const deliveredPanel = document.getElementById('deliveredPanel');

    const pending = allOrdersCache.filter(o => o.data.status !== 'delivered');
    const delivered = allOrdersCache.filter(o => o.data.status === 'delivered');

    pendingPanel.innerHTML = pending.length === 0
        ? '<p class="empty-message">لا توجد طلبات</p>'
        : pending.map((o, idx) => renderOrder(o.id, o.data, idx, pending.length, false)).join('');

    const deliveredCount = delivered.length;
    const deliveredTotal = delivered.reduce((sum, o) => sum + (o.data.total || 0), 0);

    const statsHtml = `
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
            <div style="flex: 1; min-width: 200px; background: rgba(59,92,58,0.08); border: 1px solid rgba(59,92,58,0.2); border-radius: 10px; padding: 1.2rem; display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 2rem;">📦</span>
                <div>
                    <div style="font-size: 0.85rem; color: var(--ink-soft);">عدد الطلبات المكتملة</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--deep);">${toArabicDigits(deliveredCount)}</div>
                </div>
            </div>
            <div style="flex: 1; min-width: 200px; background: rgba(217,142,59,0.08); border: 1px solid rgba(217,142,59,0.25); border-radius: 10px; padding: 1.2rem; display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 2rem;">💰</span>
                <div>
                    <div style="font-size: 0.85rem; color: var(--ink-soft);">إجمالي مبيعات الطلبات المكتملة</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--amber);">${toArabicDigits(deliveredTotal)} ر.س.</div>
                </div>
            </div>
        </div>
    `;

    deliveredPanel.innerHTML = statsHtml + (delivered.length === 0
        ? '<p class="empty-message">لا توجد طلبات مكتملة</p>'
        : delivered.map((o, idx) => renderOrder(o.id, o.data, idx, delivered.length, true)).join(''));

    bindOrderActions();
}

// ===== الاستماع الحي للطلبات =====
async function listenToOrders() {
    const { collection, query, orderBy, onSnapshot } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );
    const q = query(collection(window.db, 'orders'), orderBy('createdAt', 'desc'));
    if (unsubOrders) unsubOrders();
    unsubOrders = onSnapshot(q, (snapshot) => {
        allOrdersCache = [];
        snapshot.forEach(docSnap => allOrdersCache.push({ id: docSnap.id, data: docSnap.data() }));
        renderOrderLists();
    }, (err) => {
        console.error('فشل تحميل الطلبات:', err);
        document.getElementById('pendingPanel').innerHTML = '<p class="empty-message">تعذر تحميل الطلبات</p>';
    });
}

// ===== عرض/إخفاء الشاشات =====
function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    if (unsubOrders) { unsubOrders(); unsubOrders = null; }
}

async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    setupOrderTabs();
    await renderStockItems();
    setupStockSearch();
    await listenToOrders();
}

// ===== تشغيل كل شيء بعد تحميل Firebase =====
window.addEventListener('load', async () => {
    await waitForFirebase();

    const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    onAuthStateChanged(window.auth, (user) => {
        if (user) { showDashboard(); } else { showLogin(); }
    });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        try {
            const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
            await signInWithEmailAndPassword(window.auth, email, password);
            errorMsg.textContent = '';
        } catch (err) {
            console.error(err);
            errorMsg.textContent = '❌ بيانات الدخول غير صحيحة';
            document.getElementById('password').value = '';
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        const { signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
        await signOut(window.auth);
    });
});