import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyChWdPd5BroEAUs-p4pE2dCb2DHdkqIPkU",
  authDomain: "ryuwebpage.firebaseapp.com",
  projectId: "ryuwebpage",
  storageBucket: "ryuwebpage.firebasestorage.app",
  messagingSenderId: "256418151260",
  appId: "1:256418151260:web:2799e754d3adbf16eb5f99",
  measurementId: "G-DBYDQ13X0Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

window.firebaseApp = app;
window.db = db;

console.log("Firebase & Firestore Initialized successfully");
