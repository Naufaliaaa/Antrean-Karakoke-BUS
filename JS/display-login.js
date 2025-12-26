/*************************************************
 * DISPLAY-LOGIN.JS - Display Authentication
 *************************************************/

// ========= PASSWORD DISPLAY =========
const DISPLAY_PASSWORD = "displaybus9999";

// ========= ELEMENTS =========
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const errorEl = document.getElementById('error');
const backLink = document.getElementById('back-link');

// ========= HAPUS TOKEN LAMA =========
sessionStorage.removeItem('displayAuth');
sessionStorage.removeItem('displayLoginTime');
sessionStorage.removeItem('display_token');

// ========= EVENT LISTENERS =========
passwordInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    login();
  }
});

loginBtn.addEventListener('click', login);
backLink.addEventListener('click', goBackHome);

// ========= LOGIN FUNCTION =========
function login() {
  const input = passwordInput.value;
  
  if (input === DISPLAY_PASSWORD) {
    // Disable button
    loginBtn.disabled = true;
    loginBtn.textContent = 'Memverifikasi...';
    
    // Generate token
    const token = generateDisplayToken();
    
    // Set auth
    sessionStorage.setItem("displayAuth", "authenticated");
    sessionStorage.setItem("displayLoginTime", Date.now());
    sessionStorage.setItem("display_token", token);
    
    console.log('✅ Display authenticated with token');
    
    // Redirect
    window.location.href = "display.html";
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

// ========= GENERATE TOKEN =========
function generateDisplayToken() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const data = `display-${timestamp}-${random}`;
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `DISPLAY_TOKEN_${Math.abs(hash).toString(36)}_${timestamp}`;
}

// ========= GO BACK HOME =========
async function goBackHome(e) {
  e.preventDefault();
  
  const result = await customConfirm(
    'Anda akan kembali ke beranda tanpa mengaktifkan display.', 
    {
      title: 'Kembali ke Beranda?',
      icon: '🏠',
      confirmText: 'Ya, Kembali',
      cancelText: 'Batal'
    }
  );
  
  if (result) {
    window.location.href = 'index.html';
  }
}

console.log('✅ Display-login.js loaded');