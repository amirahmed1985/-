import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const productCategories = {
    "الكلاب": ["Bio Alpha", "Bio BK Choline", "BioVita", "Bio Nox", "Vinocid", "Bio Thyme", "Bio Phospho D", "Bio Minerals", "Bio E Selenium 20%", "Bio AD3E Plus"],
    "القطط": ["Bio Alpha (قطط)", "Bio BK Choline (قطط)", "BioVita (قطط)", "Bio Nox (قطط)", "Vinocid (قطط)", "Bio Thyme (قطط)", "Bio Phospho D (قطط)", "Bio Minerals (قطط)", "Bio E Selenium 20% (قطط)", "Bio AD3E Plus (قطط)"],
    "الطيور": ["Bio Alpha (طيور)", "Bio BK Choline (طيور)", "BioVita (طيور)", "Bio Nox (طيور)", "Vinocid (طيور)", "Bio Thyme (طيور)", "Bio Phospho D (طيور)", "Bio Minerals (طيور)", "Bio E Selenium 20% (طيور)", "Bio AD3E Plus (طيور)"],
    "حيوانات المزارع": ["مضاد حيوي", "فيتامينات مكثفة", "محفز مناعة", "علاج طفيليات", "محلول إلكتروليت", "مكمل معدني", "مضاد فطريات", "منشط نمو", "علاج تنفسي", "مطهر عام"]
};

async function renderStockItems() {
    const stockContents = document.getElementById('stockContents');
    if (!stockContents) return;

    try {
        const snap = await getDoc(doc(window.db, 'state', 'stock'));
        const stock = snap.exists() ? snap.data() : {};
        let html = '';

        Object.keys(productCategories).forEach(catName => {
            html += `<h2 style="background:#333; color:#fff; padding:10px; margin-top:20px;">${catName}</h2>`;
            productCategories[catName].forEach(product => {
                const isAvailable = stock[product] !== false;
                html += `
                    <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #ccc;">
                        <span>${product}</span>
                        <button class="toggle-btn" data-product="${product}" data-status="${isAvailable}" 
                                style="background:${isAvailable ? '#28a745' : '#dc3545'}; color:white; border:none; padding:5px 15px; cursor:pointer;">
                            ${isAvailable ? 'متوفر' : 'غير متوفر'}
                        </button>
                    </div>`;
            });
        });
        stockContents.innerHTML = html;

        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const product = e.target.dataset.product;
                const newStatus = e.target.dataset.status === 'false';
                e.target.textContent = newStatus ? 'متوفر' : 'غير متوفر';
                e.target.style.background = newStatus ? '#28a745' : '#dc3545';
                e.target.dataset.status = newStatus;
                const currentStock = (await getDoc(doc(window.db, 'state', 'stock'))).data() || {};
                currentStock[product] = newStatus;
                await setDoc(doc(window.db, 'state', 'stock'), currentStock);
            });
        });
    } catch (e) { console.error(e); }
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