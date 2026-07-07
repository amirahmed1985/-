import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ===== قائمة المنتجات حسب التصنيف =====
function getCategories() {
    return {
        'الكلاب': [
            'Bio Alpha', 'Bio BK Choline', 'BioVita', 'Bio Nox', 'Vinocid',
            'Bio Thyme', 'Bio Phospho D', 'Bio Minerals', 'Bio E Selenium 20%', 'Bio AD3E Plus'
        ],
        'القطط': [
            'Bio Alpha', 'Bio BK Choline', 'BioVita', 'Bio Nox', 'Vinocid',
            'Bio Thyme', 'Bio Phospho D', 'Bio Minerals', 'Bio E Selenium 20%', 'Bio AD3E Plus'
        ],
        'الطيور': [
            'Bio Alpha — طيور', 'Bio BK Choline — طيور', 'BioVita — طيور', 'Bio Nox — طيور', 'Vinocid — طيور',
            'Bio Thyme — طيور', 'Bio Phospho D — طيور', 'Bio Minerals — طيور', 'Bio E Selenium 20% — طيور', 'Bio AD3E Plus — طيور'
        ]
    };
}

// ===== دالة عرض المخزون =====
async function renderStockItems() {
    const stockContents = document.getElementById('stockContents');
    if (!stockContents) return;

    // جلب حالة المخزون الحالية
    const snap = await getDoc(doc(window.db, 'state', 'stock'));
    const stock = snap.exists() ? snap.data() : {};

    const categories = getCategories();
    let html = '';

    // بناء التصنيفات
    for (const [catName, products] of Object.entries(categories)) {
        html += `<h3 style="margin: 20px 0 10px; border-bottom: 2px solid #ccc; padding-bottom: 5px;">${catName}</h3>`;
        html += '<div style="display: grid; gap: 10px; margin-bottom: 20px;">';
        
        products.forEach(product => {
            const isAvailable = stock[product] !== false;
            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">
                    <span style="font-weight: bold;">${product}</span>
                    <button class="toggle-btn" data-product="${product}" data-status="${isAvailable}" 
                            style="padding: 8px 20px; cursor: pointer; color: white; border: none; border-radius: 4px; background: ${isAvailable ? '#28a745' : '#dc3545'};">
                        ${isAvailable ? 'متوفر' : 'غير متوفر'}
                    </button>
                </div>
            `;
        });
        html += '</div>';
    }
    
    stockContents.innerHTML = html;

    // تفعيل الأزرار
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const product = e.target.dataset.product;
            const currentStatus = e.target.dataset.status === 'true';
            const newStatus = !currentStatus;

            // تحديث الواجهة فوراً
            e.target.textContent = newStatus ? 'متوفر' : 'غير متوفر';
            e.target.style.background = newStatus ? '#28a745' : '#dc3545';
            e.target.dataset.status = newStatus;

            // تحديث Firebase
            const currentStock = (await getDoc(doc(window.db, 'state', 'stock'))).data() || {};
            currentStock[product] = newStatus;
            await setDoc(doc(window.db, 'state', 'stock'), currentStock);
        });
    });
}

// ===== تهيئة تسجيل الدخول =====
function initAuth() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                await signInWithEmailAndPassword(window.auth, email, password);
            } catch (err) {
                alert('خطأ في بيانات الدخول');
            }
        });
    }

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
}

initAuth();