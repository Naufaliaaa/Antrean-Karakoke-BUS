/*************************************************
 * VIDEO-PANEL-PAGE.JS - FIXED VERSION
 * ✅ Logout function fixed
 * ✅ Better session cleanup
 * ✅ Firebase session reset on logout
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
    if (typeof window.logout === 'function') {
      window.logout();
    } else {
      window.location.replace(`camera-login.html?room=${roomId}`);
    }
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
    autoLogout();
  }
}

// Check every minute
setInterval(checkSessionTimeout, 60000);

// ========= AUTO LOGOUT (NO CONFIRMATION) =========
async function autoLogout() {
  console.log('⏰ Auto logout triggered due to session timeout');
  
  // Clean up camera
  if (typeof window.stopCamera === 'function') {
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
  
  await customWarning(
    'Sesi Anda telah berakhir. Anda akan diarahkan ke halaman login.',
    '⏰ Sesi Berakhir'
  );
  
  // Redirect
  setTimeout(() => {
    window.location.replace(`camera-login.html?room=${roomId}`);
  }, 2000);
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

// ========= DEEP CLEANUP ON LOGOUT =========
async function cleanupVideoSession() {
  console.log('🧹 Deep cleaning video session...');
  
  try {
    // Wait for Firebase to be ready
    if (typeof db !== 'undefined' && roomId) {
      const videoSessionRef = db.ref(`karaoke/room/${roomId}/videoSession`);
      
      // Remove entire video session
      await videoSessionRef.set(null);
      console.log('✅ Video session cleared from Firebase');
    }
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

// ========= WINDOW UNLOAD CLEANUP =========
window.addEventListener('beforeunload', async function() {
  console.log('🔄 Window unloading, cleaning up...');
  
  // Cleanup video session
  await cleanupVideoSession();
});

// ========= SETUP LOGOUT BUTTON (SIMPLIFIED & ROBUST) =========
function setupLogoutButton() {
  console.log('🔧 Setting up logout button...');
  
  const logoutBtn = document.getElementById('logout-btn');
  
  if (!logoutBtn) {
    console.warn('⚠️ Logout button not found yet, retrying in 100ms...');
    setTimeout(setupLogoutButton, 100);
    return;
  }
  
  console.log('✅ Logout button found');
  
  // Remove any existing listeners (prevent duplicates)
  const newLogoutBtn = logoutBtn.cloneNode(true);
  logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
  
  // Add click listener
  newLogoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('🚪 Logout button clicked!');
    
    // Wait a bit for logout function to be available
    setTimeout(() => {
      if (typeof window.logout === 'function') {
        console.log('✅ Calling window.logout()');
        window.logout();
      } else {
        console.error('❌ window.logout not available, performing fallback logout');
        performFallbackLogout();
      }
    }, 100);
  });
  
  console.log('✅ Logout button listener attached');
}

// ========= FALLBACK LOGOUT (IF MAIN LOGOUT NOT READY) =========
async function performFallbackLogout() {
  console.log('🔄 Performing fallback logout...');
  
  const confirmed = confirm('Logout dari Camera Panel?\n\nKamera akan dimatikan.');
  
  if (!confirmed) return;
  
  try {
    // Stop any media
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
    });
    
    // Clear Firebase if possible
    if (typeof db !== 'undefined' && roomId) {
      try {
        await db.ref(`karaoke/room/${roomId}/videoSession`).set(null);
      } catch (e) {
        console.log('Firebase cleanup skipped');
      }
    }
    
    // Clear session
    sessionStorage.clear();
    
    alert('✅ Logout berhasil!');
    
    // Redirect
    window.location.replace(`camera-login.html?room=${roomId}`);
    
  } catch (error) {
    console.error('Fallback logout error:', error);
    sessionStorage.clear();
    window.location.replace(`camera-login.html?room=${roomId}`);
  }
}

// Setup logout button when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLogoutButton);
} else {
  setupLogoutButton();
}

console.log('✅ Video-panel-page.js security loaded (FIXED)');
console.log('🔒 Direct URL access blocked');
console.log('⏱️ Session timeout: 4 hours');
console.log('💤 Inactivity warning: 30 minutes');