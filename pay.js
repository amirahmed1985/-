// ===== استيراد دوال Firebase الضرورية =====
import { doc, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CART_KEY = 'qabdat_aldawa_cart';

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

// ===== تفريغ السلة بعد نجاح الطلب =====
function clearCart() {
    localStorage.removeItem(CART_KEY);
}

// ===== عرض ملخص الطلب في صفحة الدفع =====
function renderSummary() {
    const cart = loadCart();
    const summaryItemsEl = document.getElementById('summaryItems');
    const summaryTotalEl = document.getElementById('summaryTotal');

    if (!summaryItemsEl || !summaryTotalEl) return;

    if (cart.length === 0) {
        summaryItemsEl.innerHTML = '<p style="text-align:center; color:var(--ink-soft);">السلة فارغة</p>';
        summaryTotalEl.textContent = '٠ ر.س.';
        return;
    }

    summaryItemsEl.innerHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.name} (x${toArabicDigits(item.qty)})</span>
            <span>${toArabicDigits(item.price * item.qty)} ر.س.</span>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    summaryTotalEl.textContent = `${toArabicDigits(total)} ر.س.`;
}

// ===== معالجة الدفع والخصم الآمن من المخزون =====
async function handleCheckout(event) {
    event.preventDefault();
    
    const cart = loadCart();
    if (cart.length === 0) {
        alert('سلتك فارغة! لا يمكن إتمام الطلب.');
        return;
    }

    const submitBtn = document.getElementById('submitOrderBtn') || document.querySelector('.checkout__submit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري معالجة الطلب...';
        submitBtn.style.opacity = '0.7';
    }

    try {
        const stockRef = doc(window.db, 'state', 'stock');
        
        // استخدام Transaction لضمان الخصم الدقيق وعدم تعارض الطلبات
        await runTransaction(window.db, async (transaction) => {
            const stockDoc = await transaction.get(stockRef);
            if (!stockDoc.exists()) {
                throw "عذراً، بيانات المخزون غير متوفرة حالياً.";
            }

            let currentStock = stockDoc.data();
            let updates = {};

            // فحص توفر الكميات لكل منتج في السلة
            for (let item of cart) {
                let available = Number(currentStock[item.name]) || 0;
                
                if (available < item.qty) {
                    throw `عذراً، الكمية المطلوبة من (${item.name}) غير متوفرة. المتاح حالياً هو: ${toArabicDigits(available)} قطع.`;
                }
                // تجهيز الكمية الجديدة بعد الخصم
                updates[item.name] = available - item.qty;
            }

            // تنفيذ الخصم الفعلي في قاعدة البيانات
            transaction.update(stockRef, updates);
        });

        // نجاح العملية
        alert('تم تأكيد طلبك بنجاح! شكراً لتسوقك من قبضة الدواء.');
        clearCart();
        window.location.href = 'index.html'; // العودة للصفحة الرئيسية
        
    } catch (error) {
        console.error("خطأ في معالجة الطلب:", error);
        alert(typeof error === 'string' ? error : 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى لاحقاً.');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'إتمام الطلب';
            submitBtn.style.opacity = '1';
        }
    }
}

// ===== تهيئة الصفحة عند التحميل =====
document.addEventListener('DOMContentLoaded', () => {
    renderSummary();
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    } else {
        // دعم احتياطي في حال كان زر الإرسال خارج الفورم
        const submitBtn = document.getElementById('submitOrderBtn') || document.querySelector('.checkout__submit');
        if (submitBtn) {
            submitBtn.addEventListener('click', handleCheckout);
        }
    }
});