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

// (بقية الكود الخاص بك يفضل إعادة كتابة النصوص العربية فيه بنفس الطريقة)