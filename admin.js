import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ===== القوائم المحدثة (10 منتجات لكل قسم) =====
const productCategories = {
    "الكلاب": [
        'Bio Alpha', 'Bio BK Choline', 'BioVita', 'Bio Nox', 'Vinocid',
        'Bio Thyme', 'Bio Phospho D', 'Bio Minerals', 'Bio E Selenium 20%', 'Bio AD3E Plus'
    ],
    "القطط": [
        'Bio Alpha (قطط)', 'Bio BK Choline (قطط)', 'BioVita (قطط)', 'Bio Nox (قطط)', 'Vinocid (قطط)',
        'Bio Thyme (قطط)', 'Bio Phospho D (قطط)', 'Bio Minerals (قطط)', 'Bio E Selenium 20% (قطط)', 'Bio AD3E Plus (قطط)'
    ],
    "الطيور": [
        'Bio Alpha — طيور', 'Bio BK Choline — طيور', 'BioVita — طيور', 'Bio Nox — طيور', 'Vinocid — طيور',
        'Bio Thyme — طيور', 'Bio Phospho D — طيور', 'Bio Minerals — طيور', 'Bio E Selenium 20% — طيور', 'Bio AD3E Plus — طيور'
    ],
    "حيوانات المزارع": [
        'علاج تطعيمي', 'مضاد طفيليات داخلية', 'مضاد طفيليات خارجية', 'مكمّل معدني', 'محلول إلكتروليت',
        'فيتامينات أ+د+هـ', 'سلفا ميكس', 'أوكسي تتراسايكلين', 'مضاد حيوي واسع', 'محلول تعقيم'
    ]
};

// ===== دالة عرض المخزون =====
async function renderStockItems() {
    const stockContents = document.getElementById('stockContents');
    if (!stockContents) return;

    // جلب الحالة من فايربيز
    const snap = await getDoc(doc(window.db, 'state', 'stock'));
    const stock = snap.exists() ? snap.data() : {};

    let html = '';

    // بناء الأقسام الأربعة
    Object.keys(productCategories).forEach(catName => {
        html += `<h2 style="background: #333; color: white; padding: 10px; margin-top: 25px; border-radius: 4px; text-align: center;">${catName}</h2>`;
        
        productCategories[catName].forEach(product => {
            const isAvailable = stock[product] !== false;
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #ccc;">
                    <span style="font-size: 15px; font-weight: bold;">${product}</span>
                    <button class="toggle-btn" 
                            data-product="${product}" 
                            data-status="${isAvailable}" 
                            style="padding: 8px 15px; cursor: pointer; color: white; border: none; border-radius: 4px; font-weight: bold; background: ${isAvailable ? '#28a745' : '#dc3545'};">
                        ${isAvailable ? 'متوفر' : 'غير متوفر'}
                    </button>
                </div>
            `;
        });
    });

    stockContents.innerHTML = html;

    // تفعيل الأزرار
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const product = e.target.dataset.product;
            const currentStatus = e.target.dataset.status === 'true';
            const newStatus = !currentStatus;

            // تغيير شكل الزر فوراً
            e.target.textContent = newStatus ? 'متوفر' : 'غير متوفر';
            e.target.style.background = newStatus ? '#28a745' : '#dc3545';
            e.target.dataset.status = newStatus;

            // حفظ في قاعدة البيانات
            try {
                const currentStock = (await getDoc(doc(window.db, 'state', 'stock'))).data() || {};
                currentStock[product] = newStatus;
                await setDoc(doc(window.db, 'state', 'stock'), currentStock);
            } catch (err) {
                console.error("خطأ:", err);
                alert("حدث خطأ، يرجى المحاولة مرة أخرى");
            }
        });
    });
}

// ===== تهيئة الدخول =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(window.auth, email, password);
        } catch (err) {
            alert('خطأ في كلمة المرور أو البريد');
        }
    });
}

// مراقبة تسجيل الدخول
onAuthStateChanged(window.auth, (user) => {
    if (user) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        renderStockItems();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
    }
});