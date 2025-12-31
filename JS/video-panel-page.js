/*************************************************
 * VIDEO-PANEL-PAGE.JS - Video Panel Security & Auth
 * ✅ Prevent direct URL access
 * ✅ Session management with timeout
 * ✅ Auto logout on session expire
 *************************************************/

// ========= GET ROOM ID =========
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

if (!roomId) {
  console.error('❌ Room ID tidak ditemukan');
  alert('Room ID tidak ditemukan! Kembali ke beranda.');
  window.location.href = 'index.html';
  throw new Error('No room ID');
}

console.log('🎥 Video Panel loading for room:', roomId);

// ========= SECURITY CHECK: AUTH REQUIRED =========
(async function checkAuthentication() {
  console.log('🔐 Checking camera panel authentication...');
  
  const isAuthenticated = sessionStorage.getItem(`camera_auth_${roomId}`);
  const cameraToken = sessionStorage.getItem(`camera_token_${roomId}`);
  const loginTime = sessionStorage.getItem(`camera_login_time_${roomId}`);
  
  // Check if user is authenticated
  if (!isAuthenticated || !cameraToken) {
    console.warn('⚠️ Unauthorized access attempt blocked!');
    console.warn('User tried to access video-panel.html without authentication');
    
    await customWarning(
      'Anda harus login terlebih dahulu untuk mengakses Camera Panel!',
      '🔒 Akses Ditolak'
    );
    
    // Redirect to camera login
    window.location.replace(`camera-login.html?room=${roomId}`);
    throw new Error('Unauthorized access');
  }
  
  // Check session timeout (4 hours)
  const fourHours = 4 * 60 * 60 * 1000;
  
  if (loginTime && (Date.now() - parseInt(loginTime)) > fourHours) {
    console.warn('⏰ Session expired (4 hours)');
    
    await customWarning(
      'Sesi Camera Panel Anda telah berakhir (4 jam). Silakan login kembali.',
      '⏰ Sesi Berakhir'
    );
    
    // Clear session
    sessionStorage.removeItem(`camera_auth_${roomId}`);
    sessionStorage.removeItem(`camera_token_${roomId}`);
    sessionStorage.removeItem(`camera_login_time_${roomId}`);
    
    // Redirect to login
    window.location.replace(`camera-login.html?room=${roomId}`);
    throw new Error('Session expired');
  }
  
  console.log('✅ Camera Panel access granted');
  console.log('📌 Token:', cameraToken.substring(0, 20) + '...');
  console.log('⏱️ Session time remaining:', Math.round((fourHours - (Date.now() - parseInt(loginTime))) / 1000 / 60), 'minutes');
  
})();

// ========= SESSION TIMEOUT WARNING =========
function checkSessionTimeout() {
  const loginTime = sessionStorage.getItem(`camera_login_time_${roomId}`);
  
  if (!loginTime) {
    console.warn('⚠️ No login time found, logging out');
    logout();
    return;
  }
  
  const fourHours = 4 * 60 * 60 * 1000;
  const elapsed = Date.now() - parseInt(loginTime);
  const remaining = fourHours - elapsed;
  
  // Warning 10 minutes before timeout
  if (remaining < 10 * 60 * 1000 && remaining > 9 * 60 * 1000) {
    customWarning(
      'Sesi Anda akan berakhir dalam 10 menit. Anda akan otomatis logout.',
      '⏰ Peringatan Sesi'
    );
  }
  
  // Auto logout if expired
  if (remaining <= 0) {
    console.warn('⏰ Session timeout, auto logout');
    logout(true);
  }
}

// Check every minute
setInterval(checkSessionTimeout, 60000);

// ========= LOGOUT FUNCTION =========
async function logout(autoLogout = false) {
  const message = autoLogout 
    ? 'Sesi Anda telah berakhir. Anda akan diarahkan ke halaman login.'
    : 'Anda akan keluar dari Camera Panel. Anda perlu login kembali untuk mengakses panel ini.';
  
  const title = autoLogout ? '⏰ Sesi Berakhir' : '🚪 Konfirmasi Logout';
  
  let result = true;
  
  if (!autoLogout) {
    result = await customConfirm(
      message,
      {
        title: title,
        icon: '🚪',
        confirmText: 'Ya, Logout',
        cancelText: 'Batal',
        confirmClass: 'custom-modal-btn-danger'
      }
    );
  }
  
  if (result) {
    console.log('🚪 Logging out from camera panel...');
    
    // Stop camera if active
    if (window.stopCamera && typeof window.stopCamera === 'function') {
      try {
        await window.stopCamera();
      } catch (e) {
        console.log('Camera already stopped');
      }
    }
    
    // Clear session
    sessionStorage.removeItem(`camera_auth_${roomId}`);
    sessionStorage.removeItem(`camera_token_${roomId}`);
    sessionStorage.removeItem(`camera_login_time_${roomId}`);
    
    if (!autoLogout) {
      await customSuccess(
        'Logout berhasil! Anda akan diarahkan ke halaman login.',
        'Sampai Jumpa!'
      );
    }
    
    // Redirect
    setTimeout(() => {
      window.location.replace(`camera-login.html?room=${roomId}`);
    }, autoLogout ? 0 : 1500);
  }
}

// ========= PREVENT BACK BUTTON BYPASS =========
window.addEventListener('popstate', function(e) {
  console.log('⚠️ Back button pressed');
  
  // User mencoba back dari video panel
  const isAuthenticated = sessionStorage.getItem(`camera_auth_${roomId}`);
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    window.location.replace(`camera-login.html?room=${roomId}`);
  }
});

// ========= PREVENT CONTEXT MENU (Optional Security) =========
/*
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  console.log('Context menu disabled for security');
});
*/

// ========= SESSION ACTIVITY TRACKER =========
let lastActivity = Date.now();

function updateActivity() {
  lastActivity = Date.now();
  sessionStorage.setItem(`camera_last_activity_${roomId}`, lastActivity);
}

// Track user activity
['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
  document.addEventListener(event, updateActivity, true);
});

// Check inactivity (30 minutes)
function checkInactivity() {
  const thirtyMinutes = 30 * 60 * 1000;
  const inactive = Date.now() - lastActivity;
  
  if (inactive > thirtyMinutes) {
    console.warn('⚠️ User inactive for 30 minutes');
    customWarning(
      'Anda tidak aktif selama 30 menit. Untuk keamanan, silakan konfirmasi aktivitas Anda.',
      '⚠️ Inactivity Warning'
    ).then(() => {
      updateActivity();
    });
  }
}

// Check every 5 minutes
setInterval(checkInactivity, 5 * 60 * 1000);

// ========= WINDOW UNLOAD CLEANUP =========
window.addEventListener('beforeunload', function() {
  console.log('🔄 Window unloading, cleaning up...');
  
  // Optional: Keep session for quick return
  // Or clear it for maximum security
  /*
  sessionStorage.removeItem(`camera_auth_${roomId}`);
  sessionStorage.removeItem(`camera_token_${roomId}`);
  sessionStorage.removeItem(`camera_login_time_${roomId}`);
  */
});

// ========= EXPORT LOGOUT FOR BUTTON =========
window.logout = logout;

console.log('✅ Video-panel-page.js security loaded');
console.log('🔒 Direct URL access blocked');
console.log('⏱️ Session timeout: 4 hours');
console.log('💤 Inactivity warning: 30 minutes');