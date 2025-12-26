/*************************************************
 * ADMIN-LOGIN.JS - Admin Authentication
 *************************************************/

// ========= PASSWORD ADMIN =========
const ADMIN_PASSWORD = "karaokebushioo0001";

// ========= ELEMENTS =========
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const errorEl = document.getElementById('error');
const backLink = document.getElementById('back-link');

// ========= CHECK ALREADY LOGGED IN =========
if (sessionStorage.getItem("adminAuth") === "authenticated") {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room');
  if (room) {
    window.location.href = `admin.html?room=${room}`;
  } else {
    window.location.href = "admin.html";
  }
}

// ========= EVENT LISTENERS =========
passwordInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    login();
  }
});

loginBtn.addEventListener('click', login);
backLink.addEventListener('click', goBackToBusMenu);

// ========= LOGIN FUNCTION =========
function login() {
  const input = passwordInput.value;
  
  if (input === ADMIN_PASSWORD) {
    // Set auth
    sessionStorage.setItem("adminAuth", "authenticated");
    sessionStorage.setItem("loginTime", Date.now());
    
    // Get room
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    
    // Redirect
    if (room) {
      localStorage.setItem('karaoke_room_id', room);
      window.location.href = `admin.html?room=${room}`;
    } else {
      window.location.href = "admin.html";
    }
  } else {
    // Show error
    errorEl.style.display = "block";
    passwordInput.value = "";
    passwordInput.focus();
    
    setTimeout(() => {
      errorEl.style.display = "none";
    }, 3000);
  }
}

// ========= GO BACK =========
async function goBackToBusMenu(e) {
  e.preventDefault();
  
  const result = await customConfirm(
    'Anda akan kembali ke menu bus tanpa login sebagai admin.', 
    {
      title: 'Kembali ke Menu?',
      icon: '🏠',
      confirmText: 'Ya, Kembali',
      cancelText: 'Batal'
    }
  );
  
  if (result) {
    const roomId = localStorage.getItem('karaoke_room_id');
    if (roomId) {
      window.location.href = `bus-menu.html?room=${roomId}`;
    } else {
      window.location.href = 'index.html';
    }
  }
}

console.log('✅ Admin-login.js loaded');