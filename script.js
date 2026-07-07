// ===== متغيرات السلة =====
const CART_KEY = 'qabdat_aldawa_cart';
let cachedStock = {};

// ===== تحويل الأرقام للعربية =====
function toArabicDigits(num) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, d => arabicDigits[d]);
}

// ===== تحميل السلة من التخزين المحلي =====
function loadCart() {
    try {
        const saved = localStorage.getItem(CART_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

// ===== حفظ السلة إلى التخزين المحلي =====
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ===== جلب المخزن الرقمي من Firestore =====
async function loadStockFromFirestore() {
    try {
        const { doc, getDoc } = await import(
            "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
        );
        const snap = await getDoc(doc(window.db, 'state', 'stock'));
        cachedStock = snap.exists() ? snap.data() : {};
    } catch (e) {
        console.error('تعذر تحميل بيانات المخزون:', e);
        cachedStock = {};
    }
    return cachedStock;
}

// ===== تحديث عدد العناصر في الزر =====
function updateCartCount() {
    const cart = loadCart();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) {
        cartCountEl.textContent = toArabicDigits(count);
    }
}

// ===== تحديث عرض السلة والتحكم في الكميات الرقمية =====
function renderCart() {
    const cart = loadCart();
    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');

    if (!cartItemsEl || !cartTotalEl) return;

    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p class="cart-empty">سلتك فارغة</p>';
        cartTotalEl.textContent = '٠ ر.س.';
    } else {
        cartItemsEl.innerHTML = cart.map((item, idx) => `
            <div class="cart-item">
                <div>
                    <p class="cart-item__name">${item.name}</p>
                    <p class="cart-item__price">${toArabicDigits(item.price)} ر.س.</p>
                </div>
                <div class="cart-item__controls">
                    <button class="qty-btn qty-decrease" data-index="${idx}">−</button>
                    <span class="qty-value">${toArabicDigits(item.qty)}</span>
                    <button class="qty-btn qty-increase" data-index="${idx}">+</button>
                    <button class="remove-btn" data-index="${idx}">✕</button>
                </div>
            </div>
        `).join('');

        const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        cartTotalEl.textContent = `${toArabicDigits(total)} ر.س.`;

        // زر زيادة الكمية مع التحقق من الحد الأقصى للمخزن المتاح
        document.querySelectorAll('.qty-increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.target.dataset.index);
                const itemName = cart[idx].name;
                
                // جلب المتاح في المخزن وتحويله لرقم آمن
                let maxAvailable = cachedStock[itemName];
                if (maxAvailable === undefined || maxAvailable === true || maxAvailable === false) maxAvailable = 0;
                maxAvailable = Number(maxAvailable);

                if (cart[idx].qty >= maxAvailable) {
                    alert(`عذراً، لا يمكنك إضافة المزيد. المتاح في المخزن من (${itemName}) هو ${toArabicDigits(maxAvailable)} قطع فقط.`);
                    return;
                }

                cart[idx].qty++;
                saveCart(cart);
                renderCart();
                updateCartCount();
            });
        });

        document.querySelectorAll('.qty-decrease').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.target.dataset.index);
                if (cart[idx].qty > 1) {
                    cart[idx].qty--;
                } else {
                    cart.splice(idx, 1);
                }
                saveCart(cart);
                renderCart();
                updateCartCount();
            });
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.target.dataset.index);
                cart.splice(idx, 1);
                saveCart(cart);
                renderCart();
                updateCartCount();
            });
        });
    }
}

// ===== إضافة العنصر إلى السلة بالاعتماد على التوافر الرقمي =====
function addToCart(name, price, event) {
    let cart = loadCart();
    const existing = cart.find(item => item.name === name);
    const currentCartQty = existing ? existing.qty : 0;

    // فحص المخزن الرقمي المتاح
    let maxAvailable = cachedStock[name];
    if (maxAvailable === undefined || maxAvailable === true || maxAvailable === false) maxAvailable = 0;
    maxAvailable = Number(maxAvailable);

    if (currentCartQty + 1 > maxAvailable) {
        alert(`عذراً، نفدت الكمية المتاحة للإضافة من هذا المنتج. المتاح: (${toArabicDigits(maxAvailable)}) قطع.`);
        return;
    }

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name, price: parseFloat(price), qty: 1 });
    }

    saveCart(cart);
    renderCart();
    updateCartCount();

    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓ تمت الإضافة';
    btn.style.backgroundColor = 'var(--amber)';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 1500);
}

// ===== التعامل مع زر السلة واللوحة الجانبية =====
function initCartToggle() {
    const cartToggle = document.getElementById('cartToggle');
    const cartClose = document.getElementById('cartClose');
    const cartPanel = document.getElementById('cartPanel');
    const cartCheckout = document.querySelector('.cart-checkout');

    if (cartToggle) {
        cartToggle.addEventListener('click', () => {
            cartPanel?.classList.toggle('cart-panel--open');
        });
    }

    if (cartClose) {
        cartClose.addEventListener('click', () => {
            cartPanel?.classList.remove('cart-panel--open');
        });
    }

    if (cartCheckout) {
        cartCheckout.addEventListener('click', () => {
            window.location.href = 'pay.html';
        });
    }

    document.addEventListener('click', (e) => {
        if (cartPanel && !cartPanel.contains(e.target) && !cartToggle?.contains(e.target)) {
            cartPanel.classList.remove('cart-panel--open');
        }
    });
}

// ===== تعريف وإدارة أزرار الشراء بناءً على الأرقام الفعلية للمخزون =====
function initAddToCartButtons() {
    const addButtons = document.querySelectorAll('.add-to-cart');

    addButtons.forEach(btn => {
        const name = btn.dataset.name;
        const price = btn.dataset.price;
        
        // التحقق مما إذا كانت كمية المنتج أكبر من صفر
        let currentStockQty = cachedStock[name];
        if (currentStockQty === undefined || currentStockQty === true) currentStockQty = 0;
        if (currentStockQty === false) currentStockQty = 0;
        currentStockQty = Number(currentStockQty);

        const isInStock = currentStockQty > 0;

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        if (!isInStock) {
            newBtn.textContent = 'نفدت الكمية';
            newBtn.disabled = true;
            newBtn.style.opacity = '0.5';
            newBtn.style.cursor = 'not-allowed';
            newBtn.style.background = 'var(--line)';
            newBtn.style.color = 'var(--ink-soft)';
        } else {
            newBtn.textContent = 'أضف للسلة';
            newBtn.disabled = false;
            newBtn.style.opacity = '1';
            newBtn.style.cursor = 'pointer';
            newBtn.addEventListener('click', function (e) {
                addToCart(name, price, e);
            });
        }
    });
}

// ===== تحديث دوري لحالة المخزون من Firestore =====
async function refreshStockAndButtons() {
    await loadStockFromFirestore();
    initAddToCartButtons();
    renderCart(); // تحديث السلة لتتطابق مع البيانات الجديدة عند الحاجة
}

// ===== تهيئة البدء عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', async () => {
    renderCart();
    updateCartCount();
    initCartToggle();
    await refreshStockAndButtons();

    // تحديث ذكي ومستقر كل ١٠ ثوانٍ للمخزن
    setInterval(refreshStockAndButtons, 10000);
});