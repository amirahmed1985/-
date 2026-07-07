import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ===== تعريف المنتجات لكل قسم (قطط، طيور، كلاب) =====
const productCategories = {
    "القطط": ['Bio Alpha', 'Bio BK Choline', 'BioVita', 'Bio Nox', 'Vinocid'],
    "الطيور": ['Bio Alpha — طيور', 'Bio BK Choline — طيور', 'BioVita — طيور', 'Bio Nox — طيور', 'Vinocid — طيور'],
    "الكلاب": ['Bio Thyme', 'Bio Phospho D', 'Bio Minerals', 'Bio E Selenium 20%', 'Bio AD3E Plus']
};

// ===== دالة عرض المخزون =====
async function renderStockItems() {
    const stockContents = document.getElementById('stockContents');
    if (!stockContents) return;

    // جلب الحالة من فايربيز
    const snap = await getDoc(doc(window.db, 'state', 'stock'));
    const stock = snap.exists() ? snap.data() : {};

    let html = '';

    // بناء الأقسام الثلاثة
    Object.keys(productCategories).forEach(catName => {
        html += `<h2 style="background: #e9ecef; padding: 10px; margin-top: 20px; border-radius: 4px;">${catName}</h2>`;
        
        productCategories[catName].forEach(product => {
            const isAvailable = stock[product] !== false;
            
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                    <span style="font-size: 16px;">${product}</span>
                    <button class="toggle-btn" 
                            data-product="${product}" 
                            data-status="${isAvailable}" 
                            style="padding: 10px 20px; cursor: pointer; color: white; border: none; border-radius: 5px; font-weight: bold; background: ${isAvailable ? '#28a745' : '#dc3545'};">
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