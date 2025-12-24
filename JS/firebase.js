/*************************************************
 * FIREBASE.JS – SAFE & STABLE VERSION
 * TIDAK MENGHILANGKAN FITUR
 * HANYA MEMASTIKAN FIREBASE READY
 *************************************************/

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyCouSLT2_QXPxNM2CofnOoHOqy0PHGjsb0",
  authDomain: "karaoke-bus.firebaseapp.com",
  databaseURL: "https://karaoke-bus-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "karaoke-bus",
  storageBucket: "karaoke-bus.appspot.com",
  messagingSenderId: "828869589410",
  appId: "1:828869589410:web:b3606b37c81f741f581afb"
};

// ================= SAFE INIT =================
if (!window.firebase) {
  console.error("❌ Firebase SDK belum dimuat!");
  alert("Firebase SDK belum siap. Cek urutan script di HTML!");
  throw new Error("Firebase SDK missing");
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("🔥 Firebase initialized");
} else {
  console.log("🔥 Firebase already initialized");
}

// ================= DATABASE =================
const db = firebase.database();

if (!db) {
  console.error("❌ Database gagal diinisialisasi");
  alert("Koneksi database gagal");
  throw new Error("Database init failed");
}

console.log("✅ Firebase Database ready");

// ================= GLOBAL EXPORT =================
window.db = db;
