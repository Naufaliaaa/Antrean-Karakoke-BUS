/*************************************************
 * ADMIN-PAGE.JS - Admin Page Init & Auth
 *************************************************/

// ========= SET ROOM ID FROM URL =========
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  let adminRoomId = urlParams.get('room');
  if (adminRoomId) {
    localStorage.setItem('karaoke_room_id', adminRoomId);
  }
})();

// ========= GO BACK TO BUS MENU =========
async function goBackToBusMenu() {
  const result = await customConfirm(
    'Apakah Anda yakin ingin kembali ke menu bus?', 
    {
      title: 'Keluar dari Admin Panel',
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

// ========= CHECK AUTH & TIMEOUT =========
(async function() {
  const isAuthenticated = sessionStorage.getItem("adminAuth") === "authenticated";
  if (!isAuthenticated) {
    await customWarning("Anda harus login sebagai admin terlebih dahulu!", "Akses Ditolak");
    window.location.replace("admin-login.html");
    throw new Error("Unauthorized access");
  }
  
  const loginTime = sessionStorage.getItem("loginTime");
  const twoHours = 2 * 60 * 60 * 1000;
  if (loginTime && (Date.now() - parseInt(loginTime)) > twoHours) {
    await customWarning("Sesi admin Anda telah berakhir. Silakan login kembali.", "Sesi Berakhir");
    logout();
  }
})();

// ========= LOGOUT =========
async function logout() {
  const result = await customConfirm(
    'Anda akan keluar dari panel admin. Anda perlu login kembali untuk mengakses panel ini.', 
    {
      title: 'Konfirmasi Logout',
      icon: '🚪',
      confirmText: 'Ya, Logout',
      cancelText: 'Batal',
      confirmClass: 'custom-modal-btn-danger'
    }
  );
  
  if (result) {
    sessionStorage.removeItem("adminAuth");
    sessionStorage.removeItem("loginTime");
    
    await customSuccess("Logout berhasil! Anda akan diarahkan ke halaman login.", "Sampai Jumpa!");
    
    setTimeout(() => {
      window.location.replace("admin-login.html");
    }, 1500);
  }
}

// ========= EVENT LISTENERS =========
document.getElementById('back-btn').addEventListener('click', function(e) {
  e.preventDefault();
  goBackToBusMenu();
});

document.getElementById('logout-btn').addEventListener('click', logout);

console.log('✅ Admin-page.js loaded');