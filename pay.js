// ===== إعدادات =====
const CART_KEY = 'qabdat_aldawa_cart';
const SHIPPING_COST = 20;

// ===== تحويل الأرقام للعربية =====
function toArabicDigits(num) {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, d => arabicDigits[d]);
}

// ===== تحميل السلة =====
function loadCart() {
    try {
        const saved = localStorage.getItem(CART_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

// ===== حفظ السلة =====
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ===== عرض ملخص الطلب =====
function renderSummary() {
    const cart = loadCart();
    const summaryItemsEl = document.getElementById('summaryItems');
    const summarySubtotalEl = document.getElementById('summarySubtotal');
    const summaryShippingEl = document.getElementById('summaryShipping');
    const summaryTotalEl = document.getElementById('summaryTotal');
    const submitBtn = document.querySelector('.checkout__submit');

    if (cart.length === 0) {
        summaryItemsEl.innerHTML = '<p class="cart-empty">سلتك فارغة</p>';
        summarySubtotalEl.textContent = '٠ ر.س.';
        summaryTotalEl.textContent = '٠ ر.س.';
        if (submitBtn) submitBtn.disabled = true;
        return 0;
    }

    summaryItemsEl.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.name} × ${toArabicDigits(item.qty)}</span>
            <span>${toArabicDigits(item.price * item.qty)} ر.س.</span>
        </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const total = subtotal + SHIPPING_COST;

    summarySubtotalEl.textContent = `${toArabicDigits(subtotal)} ر.س.`;
    summaryShippingEl.textContent = `${toArabicDigits(SHIPPING_COST)} ر.س.`;
    summaryTotalEl.textContent = `${toArabicDigits(total)} ر.س.`;
    if (submitBtn) submitBtn.disabled = false;

    return total;
}

// ===== إرسال الطلب إلى Firestore =====
async function submitOrder(shippingData, cart, total) {
    const { collection, addDoc, serverTimestamp } = await import(
        "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
    );

    const order = {
        shippingData: {
            ...shippingData,
            timestamp: new Date().toLocaleString('ar-SA')
        },
        items: cart,
        total: total,
        status: 'pending',
        createdAt: serverTimestamp()
    };

    await addDoc(collection(window.db, 'orders'), order);
}

// ===== معالجة إرسال النموذج =====
function initCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cart = loadCart();
        if (cart.length === 0) {
            alert('سلتك فارغة، أضف منتجات أولاً.');
            return;
        }

        const formData = new FormData(form);
        const shippingData = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            city: formData.get('city'),
            address: formData.get('address')
        };

        const total = renderSummary();
        const submitBtn = form.querySelector('.checkout__submit');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'جارٍ إرسال الطلب...';

        try {
            await submitOrder(shippingData, cart, total);
            localStorage.removeItem(CART_KEY);
            alert('✓ تم استلام طلبك بنجاح! سيتواصل معك فريقنا قريباً.');
            window.location.href = 'index.html';
        } catch (err) {
            console.error('فشل إرسال الطلب:', err);
            alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ===== تهيئة =====
document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    initCheckoutForm();
});