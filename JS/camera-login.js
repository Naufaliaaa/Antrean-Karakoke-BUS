/*************************************************
 * CAMERA-LOGIN.JS - Camera Panel Authentication
 * Password: panelcamerabushioo021
 *************************************************/

// ========= PASSWORD CAMERA PANEL =========
const CAMERA_PASSWORD = "panelcamerabushioo021";

// ========= GET ROOM ID =========
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

if (!roomId) {
  console.error('❌ Room ID tidak ditemukan');
  alert('Room ID tidak ditemukan. Kembali ke beranda.');
  window.location.href = 'index.html';
}

// ========= ELEMENTS =========
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const errorEl = document.getElementById('error');
const backLink = document.getElementById('back-link');

// ========= HAPUS TOKEN LAMA (Force re-login) =========
sessionStorage.removeItem(`camera_auth_${roomId}`);
sessionStorage.removeItem(`camera_token_${roomId}`);
sessionStorage.removeItem(`camera_login_time_${roomId}`);

console.log('🎥 Camera login page loaded for room:', roomId);

// ========= CHECK IF ALREADY LOGGED IN =========
// (Disabled untuk force login setiap kali)
/*
const existingToken = sessionStorage.getItem(`camera_token_${roomId}`);
const loginTime = sessionStorage.getItem(`camera_login_time_${roomId}`);

if (existingToken && loginTime) {
  const fourHours = 4 * 60 * 60 * 1000;
  if (Date.now() - parseInt(loginTime) < fourHours) {
    console.log('✅ Already authenticated, redirecting...');
    window.location.href = `video-panel.html?room=${roomId}`;
  }
}
*/

// ========= EVENT LISTENERS =========
passwordInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    login();
  }
});

loginBtn.addEventListener('click', login);
backLink.addEventListener('click', goBackToBusMenu);

// ========= LOGIN FUNCTION =========
async function login() {
  const input = passwordInput.value.trim();
  
  // Validasi input kosong
  if (!input) {
    showError('Password tidak boleh kosong');
    return;
  }
  
  // Disable button saat proses login
  loginBtn.disabled = true;
  loginBtn.textContent = 'Memverifikasi...';
  
  try {
    // Cek password
    if (input === CAMERA_PASSWORD) {
      console.log('✅ Password correct!');
      
      // Generate secure token
      const token = generateCameraToken(roomId, input);
      
      // Set authentication data
      sessionStorage.setItem(`camera_auth_${roomId}`, 'authenticated');
      sessionStorage.setItem(`camera_token_${roomId}`, token);
      sessionStorage.setItem(`camera_login_time_${roomId}`, Date.now());
      
      // Success message
      await customSuccess(
        'Password benar! Anda akan diarahkan ke Camera Panel.',
        '✅ Login Berhasil'
      );
      
      // Redirect to video panel
      setTimeout(() => {
        window.location.href = `video-panel.html?room=${roomId}`;
      }, 1000);
      
    } else {
      // Password salah
      console.warn('❌ Wrong password attempt');
      showError('Password salah! Silakan coba lagi.');
      
      // Reset input
      passwordInput.value = '';
      passwordInput.focus();
      
      // Re-enable button
      loginBtn.disabled = false;
      loginBtn.textContent = 'Masuk';
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    
    await customError(
      'Terjadi kesalahan saat login. Silakan coba lagi.',
      'Login Error'
    );
    
    loginBtn.disabled = false;
    loginBtn.textContent = 'Masuk';
  }
}

// ========= SHOW ERROR =========
function showError(message) {
  errorEl.textContent = `❌ ${message}`;
  errorEl.style.display = 'block';
  
  // Animate
  errorEl.style.animation = 'none';
  setTimeout(() => {
    errorEl.style.animation = 'shake 0.5s';
  }, 10);
  
  // Auto hide after 4 seconds
  setTimeout(() => {
    errorEl.style.display = 'none';
  }, 4000);
}

// ========= GENERATE SECURE TOKEN =========
function generateCameraToken(roomId, password) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const data = `CAMERA-${roomId}-${password}-${timestamp}-${random}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `CAMERA_TOKEN_${Math.abs(hash).toString(36).toUpperCase()}_${timestamp}`;
}

// ========= GO BACK TO BUS MENU =========
async function goBackToBusMenu(e) {
  e.preventDefault();
  
  const result = await customConfirm(
    'Anda akan kembali ke menu bus tanpa login ke Camera Panel.',
    {
      title: 'Kembali ke Menu?',
      icon: '🏠',
      confirmText: 'Ya, Kembali',
      cancelText: 'Batal'
    }
  );
  
  if (result) {
    console.log('🔙 Going back to bus menu');
    window.location.href = `bus-menu.html?room=${roomId}`;
  }
}

// ========= PREVENT BACK BUTTON AFTER LOGIN =========
window.addEventListener('popstate', function(e) {
  // User mencoba back setelah login
  const isAuthenticated = sessionStorage.getItem(`camera_auth_${roomId}`);
  
  if (isAuthenticated) {
    console.log('⚠️ Back button pressed after auth, clearing session');
    sessionStorage.removeItem(`camera_auth_${roomId}`);
    sessionStorage.removeItem(`camera_token_${roomId}`);
    sessionStorage.removeItem(`camera_login_time_${roomId}`);
  }
});

console.log('✅ Camera-login.js loaded');
console.log('🔐 Required password: panelcamerabushioo021');