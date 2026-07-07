import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ===== 1. دالة تحميل المخزون وعرضه في لوحة التحكم =====
async function loadAdminDashboard() {
    // استخدمنا stockContents لأنه موجود مسبقاً في ملف الـ HTML الخاص بك
    const container = document.getElementById('stockContents');
    if (!container) return;

    try {
        const stockRef = doc(window.db, 'state', 'stock');
        const snap = await getDoc(stockRef);
        const stockData = snap.exists() ? snap.data() : {};

        if (Object.keys(stockData).length === 0) {
            container.innerHTML = `<p class="empty-message">لا توجد منتجات مسجلة حتى الآن.</p>`;
            return;
        }

        container.innerHTML = Object.keys(stockData).map(productName => {
            let currentVal = stockData[productName];
            if (currentVal === true) currentVal = 10;
            if (currentVal === false || currentVal === undefined) currentVal = 0;
            currentVal = Number(currentVal);

            const inputId = `input-${btoa(encodeURIComponent(productName)).replace(/=/g, '')}`;

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.7); padding: 1rem; margin-bottom: 0.8rem; border: 1px solid var(--line); border-radius: 8px;">
                    <span style="font-weight: 600; color: var(--ink); font-size: 0.95rem;">${productName}</span>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <input type="number" id="${inputId}" value="${currentVal}" min="0" style="width: 80px; padding: 0.4rem; border: 1px solid var(--line); border-radius: 5px; text-align: center; font-family: var(--body);">
                        <button class="clear-btn save-stock-btn" data-name="${productName}" data-input="${inputId}" style="margin-top:0; padding: 0.5rem 1rem;">تحديث</button>
                    </div>
                </div>
            `;
        }).join('');

        // تفعيل أزرار الحفظ
        document.querySelectorAll('.save-stock-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const pName = e.target.dataset.name;
                const inputEl = document.getElementById(e.target.dataset.input);
                const newQty = parseInt(inputEl.value);

                if (isNaN(newQty) || newQty < 0) return;

                try {
                    e.target.disabled = true;
                    e.target.textContent = '...';

                    let updateData = {};
                    updateData[pName] = newQty;
                    await updateDoc(doc(window.db, 'state', 'stock'), updateData);

                    alert(`✓ تم تحديث كمية (${pName}) إلى: ${newQty}`);
                } catch (err) {
                    console.error("خطأ:", err);
                    alert('تعذر الحفظ، حاول مرة أخرى.');
                } finally {
                    e.target.disabled = false;
                    e.target.textContent = 'تحديث';
                }
            });
        });

    } catch (error) {
        console.error("خطأ في جلب بيانات لوحة التحكم:", error);
    }
}

// ===== 2. تشغيل النظام عند تحميل الصفحة =====
window.addEventListener('load', async () => {
    
    // الانتظار حتى يتم تهيئة Firebase من ملف firebase-init.js
    const checkFirebase = setInterval(() => {
        if (window.auth && window.db) {
            clearInterval(checkFirebase);
            initAdmin();
        }
    }, 50);

    function initAdmin() {
        // أ. مراقبة حالة تسجيل الدخول لإخفاء/إظهار لوحة التحكم
        onAuthStateChanged(window.auth, (user) => {
            if (user) {
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('adminDashboard').style.display = 'block';
                loadAdminDashboard(); // جلب المخزون بعد نجاح الدخول
            } else {
                document.getElementById('loginScreen').style.display = 'flex';
                document.getElementById('adminDashboard').style.display = 'none';
            }
        });

        // ب. كود تسجيل الدخول (مع منع الـ Refresh)
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault(); // هذا السطر يمنع تحديث الصفحة!
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const errorMsg = document.getElementById('errorMsg');
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                
                try {
                    submitBtn.textContent = 'جاري الدخول...';
                    submitBtn.disabled = true;
                    errorMsg.textContent = '';
                    
                    await signInWithEmailAndPassword(window.auth, email, password);
                    // عند النجاح، onAuthStateChanged بالأعلى ستتكفل بإظهار لوحة التحكم
                    
                } catch (err) {
                    console.error("خطأ في الدخول:", err);
                    errorMsg.textContent = '❌ بيانات الدخول غير صحيحة';
                    document.getElementById('password').value = '';
                } finally {
                    submitBtn.textContent = 'دخول';
                    submitBtn.disabled = false;
                }
            });
        }

        // ج. كود تسجيل الخروج
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await signOut(window.auth);
            });
        }
    }
});