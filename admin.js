// هذا الكود يفترض وجود أزرار في صفحتك كلاسها .toggle-btn
document.addEventListener('DOMContentLoaded', () => {
    console.log("نظام التحكم يعمل...");
    
    // ربط الأزرار الموجودة فعلياً في صفحتك
    const buttons = document.querySelectorAll('.toggle-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const product = e.target.dataset.product;
            console.log("تم الضغط على: " + product);
            
            // هنا نضع كود التحديث لـ Firebase
            // تأكد أن window.db معرف في مكان آخر
            if (window.db) {
                // ... كود التحديث الخاص بك هنا
                alert("تم الضغط على " + product);
            }
        });
    });
});