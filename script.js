// ===== متغيرات السلة =====
const CART_KEY = 'qabdat_aldawa_cart';
let cachedStock = {};

// ===== تحويل الأرقام للعربية =====
function toArabicDigits(num) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, d => arabicDigits[d]);
}

// ===== تحميل السلة من التخزين المحلي (سلة الزائر تبقى محلية) =====
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

// ===== تحديث عرض السلة =====
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

        document.querySelectorAll('.qty-increase').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.target.dataset.index);
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

// ===== إضافة العنصر إلى السلة =====
function addToCart(name, price) {
    let cart = loadCart();
    const existing = cart.find(item => item.name === name);

    if (existing) {
        existing.qty++;
    } else {
        cart.push({ name, price: parseFloat(price), qty: 1 });
    }

    saveCart(cart);
    renderCart();
    updateCartCount();

    const btn = event.target;
    btn.textContent = '✓ تمت الإضافة';
    btn.style.backgroundColor = 'var(--amber)';
    setTimeout(() => {
        btn.textContent = 'أضف للسلة';
        btn.style.backgroundColor = '';
    }, 1500);
}

// ===== التعامل مع زر السلة واللوحة =====
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

// ===== تعريف أزرار إضافة للسلة حسب المخزون المشترك =====
function initAddToCartButtons() {
    const addButtons = document.querySelectorAll('.add-to-cart');

    addButtons.forEach(btn => {
        const name = btn.dataset.name;
        const price = btn.dataset.price;
        const isInStock = cachedStock[name] !== false;

        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        if (!isInStock) {
            newBtn.textContent = 'غير متوفر';
            newBtn.disabled = true;
            newBtn.style.opacity = '0.5';
            newBtn.style.cursor = 'not-allowed';
        } else {
            newBtn.textContent = 'أضف للسلة';
            newBtn.disabled = false;
            newBtn.style.opacity = '1';
            newBtn.style.cursor = 'pointer';
            newBtn.addEventListener('click', function () {
                addToCart(name, price);
            });
        }
    });
}

// ===== تحديث دوري لحالة المخزون من Firestore =====
async function refreshStockAndButtons() {
    await loadStockFromFirestore();
    initAddToCartButtons();
}

// ===== تهيئة البدء =====
document.addEventListener('DOMContentLoaded', async () => {
    renderCart();
    updateCartCount();
    initCartToggle();
    await refreshStockAndButtons();

    // تحديث حالة المخزون كل ١٠ ثوانٍ (بدلاً من كل ثانيتين، لتقليل القراءات من Firestore)
    setInterval(refreshStockAndButtons, 10000);
});