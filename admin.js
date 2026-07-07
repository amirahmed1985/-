import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// التوصيل بمستند المخزن في Firestore
const stockRef = doc(window.db, 'state', 'stock');

// ===== دالة تحميل المخزون وعرضه في لوحة التحكم =====
async function loadAdminDashboard() {
    const container = document.getElementById('adminStockContainer');
    if (!container) {
        console.error("لم يتم العثور على عنصر id='adminStockContainer' في صفحة admin.html");
        return;
    }

    try {
        const snap = await getDoc(stockRef);
        const stockData = snap.exists() ? snap.data() : {};

        // إذا كانت قاعدة البيانات فارغة تماماً، نضع قيم افتراضية مبدئية لتتحكم بها
        if (Object.keys(stockData).length === 0) {
            container.innerHTML = `<p style="text-align:center; color:var(--ink-soft);">لا توجد منتجات مسجلة. تأكد من ربط قاعدة البيانات بشكل صحيح.</p>`;
            return;
        }

        // بناء واجهة التحكم بالكميات رقمياً لكل منتج موجود في قاعدة بياناتك
        container.innerHTML = Object.keys(stockData).map(productName => {
            let currentVal = stockData[productName];
            
            // تحويل ذكي وتلقائي للقيم القديمة (إذا كانت true تحول إلى 10 كبداية، وإذا false تحول إلى 0)
            if (currentVal === true) currentVal = 10;
            if (currentVal === false || currentVal === undefined) currentVal = 0;
            currentVal = Number(currentVal);

            // إنشاء معرف فريد وآمن لكل حقل إدخال
            const inputId = `input-${btoa(encodeURIComponent(productName)).replace(/=/g, '')}`;

            return `
                <div class="admin-stock-card" style="display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 1rem; margin-bottom: 0.8rem; border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow-sm);">
                    <span style="font-weight: 700; color: var(--ink); font-size: 0.95rem;">${productName}</span>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <input type="number" id="${inputId}" value="${currentVal}" min="0" style="width: 80px; padding: 0.4rem; border: 1px solid var(--line); border-radius: 5px; text-align: center; font-family: var(--body); font-weight: bold;">
                        <button class="btn btn--small save-stock-btn" data-name="${productName}" data-input="${inputId}">تعديل الكمية</button>
                    </div>
                </div>
            `;
        }).join('');

        // تفعيل أزرار الحفظ والتعديل الرقمي
        document.querySelectorAll('.save-stock-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const pName = e.target.dataset.name;
                const inputEl = document.getElementById(e.target.dataset.input);
                const newQty = parseInt(inputEl.value);

                if (isNaN(newQty) || newQty < 0) {
                    alert('الرجاء إدخال رقم صحيح أكبر من أو يساوي الصفر.');
                    return;
                }

                try {
                    e.target.disabled = true;
                    e.target.textContent = 'جاري الحفظ...';

                    // تحديث حقل المنتج المحدد فقط في Firestore بالأرقام
                    let updateData = {};
                    updateData[pName] = newQty;
                    await updateDoc(stockRef, updateData);

                    alert(`تم تحديث كمية المنتج (${pName}) بنجاح إلى: ${newQty} قطع.`);
                } catch (err) {
                    console.error("خطأ أثناء تحديث البيانات:", err);
                    alert('تعذر حفظ التعديل، تأكد من اتصال الإنترنت وصلاحيات Firestore.');
                } finally {
                    e.target.disabled = false;
                    e.target.textContent = 'تعديل الكمية';
                }
            });
        });

    } catch (error) {
        console.error("خطأ في جلب بيانات لوحة التحكم:", error);
        container.innerHTML = `<p style="color:var(--clay); text-align:center;">حدث خطأ أثناء تحميل المخزون.</p>`;
    }
}

// تشغيل الدالة فور تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadAdminDashboard);