// ===== إعدادات لوحة التحكم =====

let currentSearchQuery = '';

let unsubOrders = null;



// ===== تحويل الأرقام للعربية =====

function toArabicDigits(num) {

    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    return String(num).replace(/[0-9]/g, d => arabicDigits[d]);

}



// ===== قائمة المنتجات =====

function getAllProducts() {

    const byCat = getProductsByCategory();

    return [...byCat.dogs_cats, ...byCat.birds, ...byCat.farm].sort();

}



function getProductsByCategory() {

    return {

        dogs_cats: [

            'Bio Alpha', 'Bio BK Choline', 'BioVita', 'Bio Nox', 'Vinocid',

            'Bio Thyme', 'Bio Phospho D', 'Bio Minerals', 'Bio E Selenium 20%', 'Bio AD3E Plus'

        ],

        birds: [

            'Bio Alpha — طيور', 'Bio BK Choline — طيور', 'BioVita — طيور', 'Bio Nox — طيور', 'Vinocid — طيور',

            'Bio Thyme — طيور', 'Bio Phospho D — طيور', 'Bio Minerals — طيور', 'Bio E Selenium 20% — طيور', 'Bio AD3E Plus — طيور'

        ],

        farm: [

            'علاج تطعيمي — حيوانات المزرعة',

            'مضاد طفيليات داخلية وخارجية — أبقار وأغنام',

            'مكمّل معدني للأعلاف — حيوانات المزرعة',

            'محلول إلكتروليت — عجول وأغنام'

        ]

    };

}



// ===== Firestore: تحميل المخزون =====

async function loadStock() {

    const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const snap = await getDoc(doc(window.db, 'state', 'stock'));

    return snap.exists() ? snap.data() : {};

}



// ===== Firestore: حفظ المخزون =====

async function saveStock(stock) {

    const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    await setDoc(doc(window.db, 'state', 'stock'), stock);

}



// ===== عرض عناصر المخزون مع البحث =====

async function renderStockItems(productsToShow = null) {

    const stockContents = document.getElementById('stockContents');

    const productsByCategory = getProductsByCategory();

    const stock = await loadStock();



    const categoryInfo = {

        dogs_cats: { name: '🐕 كلاب وقطط', icon: '🐕' },

        birds: { name: '🦜 الطيور', icon: '🦜' },

        farm: { name: '🐄 الحيوانات المزرعية', icon: '🐄' }

    };



    let html = '<div style="display: grid; gap: 2rem;">';

    let totalFound = 0;



    Object.keys(productsByCategory).forEach(category => {

        const categoryLabel = categoryInfo[category];

        let products = productsByCategory[category];



        if (productsToShow) {

            products = products.filter(p => productsToShow.includes(p));

        }



        if (products.length === 0) return;

        totalFound += products.length;



        html += `

            <div style="background: linear-gradient(135deg, rgba(59, 92, 58, 0.05), rgba(217, 142, 59, 0.05)); border: 2px solid rgba(59, 92, 58, 0.2); border-radius: 12px; padding: 1.5rem; overflow: hidden;">

                <h3 style="font-family: 'El Messiri', sans-serif; color: var(--deep); margin-top: 0; margin-bottom: 1.5rem; font-size: 1.3rem; display: flex; align-items: center; gap: 0.7rem;">

                    <span style="font-size: 1.8rem;">${categoryLabel.icon}</span>

                    ${categoryLabel.name}

                </h3>

                <div style="display: grid; gap: 1rem;">

                    ${products.map(product => {

                        const isInStock = stock[product] !== false;

                        return `

                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.7); border-radius: 8px; border: 1px solid rgba(59, 92, 58, 0.1);">

                                <div>

                                    <div style="font-weight: 600; color: var(--ink); font-size: 0.95rem;">${product}</div>

                                    <div style="font-size: 0.8rem; color: var(--ink-soft); margin-top: 0.4rem; display: flex; align-items: center; gap: 0.4rem;">

                                        <span style="font-size: 1rem;">${isInStock ? '✓' : '✕'}</span>

                                        ${isInStock ? '<span style="color: var(--deep);">متوفر في المخزون</span>' : '<span style="color: var(--clay);">غير متوفر</span>'}

                                    </div>

                                </div>

                                <button class="stock-toggle-btn" data-product="${product}" style="padding: 0.6rem 1.2rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; background: ${isInStock ? 'var(--deep)' : 'var(--amber)'}; color: var(--paper); white-space: nowrap;">

                                    ${isInStock ? 'وقف البيع' : 'استئناف البيع'}

                                </button>

                            </div>

                        `;

                    }).join('')}

                </div>

            </div>

        `;

    });



    if (totalFound === 0 && productsToShow) {

        html = '<p class="empty-message">لم يتم العثور على منتجات</p>';

    }



    html += '</div>';

    stockContents.innerHTML = html;



    document.querySelectorAll('.stock-toggle-btn').forEach(btn => {

        btn.addEventListener('click', async (e) => {

            e.target.disabled = true;

            const product = e.target.dataset.product;

            const newStock = await loadStock();

            newStock[product] = newStock[product] === false ? true : false;

            await saveStock(newStock);

            await renderStockItems(productsToShow);

        });

    });

}