// ===== تعريف الأقسام والمنتجات (10 لكل قسم) =====
const categories = {
    "الكلاب": [
        "Bio Alpha", "Bio BK Choline", "BioVita", "Bio Nox", "Vinocid", 
        "Bio Thyme", "Bio Phospho D", "Bio Minerals", "Bio E Selenium 20%", "Bio AD3E Plus"
    ],
    "القطط": [
        "Bio Alpha (قطط)", "Bio BK Choline (قطط)", "BioVita (قطط)", "Bio Nox (قطط)", "Vinocid (قطط)", 
        "Bio Thyme (قطط)", "Bio Phospho D (قطط)", "Bio Minerals (قطط)", "Bio E Selenium 20% (قطط)", "Bio AD3E Plus (قطط)"
    ],
    "الطيور": [
        "Bio Alpha (طيور)", "Bio BK Choline (طيور)", "BioVita (طيور)", "Bio Nox (طيور)", "Vinocid (طيور)", 
        "Bio Thyme (طيور)", "Bio Phospho D (طيور)", "Bio Minerals (طيور)", "Bio E Selenium 20% (طيور)", "Bio AD3E Plus (طيور)"
    ],
    "حيوانات المزرعة": [
        "مضاد حيوي واسع", "فيتامينات مكثفة", "محفز مناعة", "علاج طفيليات", "محلول إلكتروليت",
        "مكمل معدني", "مضاد فطريات", "منشط نمو", "علاج تنفسي", "مطهر عام"
    ]
};

// دالة عرض المخزون (تحتفظ بالتصميم الكلاسيكي)
async function renderAdminStock() {
    const stockContainer = document.getElementById('stockContents'); // تأكد من وجود هذا العنصر في صفحتك
    if (!stockContainer) return;

    // جلب البيانات من Firestore
    const snap = await getDoc(doc(window.db, 'state', 'stock'));
    const stock = snap.exists() ? snap.data() : {};

    let html = '';

    // بناء الأقسام
    Object.keys(categories).forEach(catName => {
        html += `<h2 style="margin-top: 30px; border-bottom: 2px solid var(--ink); padding-bottom: 5px; color: var(--deep);">${catName}</h2>`;
        
        categories[catName].forEach(product => {
            const isAvailable = stock[product] !== false;
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid var(--line);">
                    <span style="font-size: 15px;">${product}</span>
                    <button class="toggle-btn" 
                            data-product="${product}" 
                            data-status="${isAvailable}" 
                            style="padding: 8px 20px; cursor: pointer; color: white; border: none; border-radius: 4px; background: ${isAvailable ? '#3B5C3A' : '#A6512E'};">
                        ${isAvailable ? 'متوفر' : 'غير متوفر'}
                    </button>
                </div>
            `;
        });
    });

    stockContainer.innerHTML = html;

    // إضافة وظيفة التحديث عند الضغط
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const product = e.target.dataset.product;
            const currentStatus = e.target.dataset.status === 'true';
            const newStatus = !currentStatus;

            // تحديث الزر لحظياً
            e.target.textContent = newStatus ? 'متوفر' : 'غير متوفر';
            e.target.style.background = newStatus ? '#3B5C3A' : '#A6512E';
            e.target.dataset.status = newStatus;

            // حفظ في Firebase
            const currentStock = (await getDoc(doc(window.db, 'state', 'stock'))).data() || {};
            currentStock[product] = newStatus;
            await setDoc(doc(window.db, 'state', 'stock'), currentStock);
        });
    });
}