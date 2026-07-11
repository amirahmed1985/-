// ===== إعداد Firebase =====
// استبدل القيم أدناه بالقيم الخاصة بمشروعك من Firebase Console
// (Project settings → General → Your apps → Web app)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

// إتاحة عام لبقية ملفات JS (script.js, pay.js, admin.js)
window.db = getFirestore(app);
window.auth = getAuth(app);