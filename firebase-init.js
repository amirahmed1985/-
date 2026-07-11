import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCu3TdujkDRPM3ZLl3h3__4mqTx07ifQ_Y",
  authDomain: "qabdat-aldawa.firebaseapp.com",
  projectId: "qabdat-aldawa",
  storageBucket: "qabdat-aldawa.firebasestorage.app",
  messagingSenderId: "182425727502",
  appId: "1:182425727502:web:7feabda12b411eb22e425f",
  measurementId: "G-N9WMFVV2P1"
};

const app = initializeApp(firebaseConfig);
window.db = getFirestore(app);
window.auth = getAuth(app);