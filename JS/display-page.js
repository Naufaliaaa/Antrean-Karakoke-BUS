/*************************************************
 * DISPLAY-PAGE.JS - Display Page Init & Auth
 *************************************************/

// ========= AUTH CHECK =========
(async function() {
  const isAuthenticated = sessionStorage.getItem("displayAuth") === "authenticated";
  const displayToken = sessionStorage.getItem("display_token");
  
  if (!isAuthenticated || !displayToken) {
    console.warn('⚠️ Unauthorized display access attempt blocked!');
    await customWarning("Anda harus login sebagai display terlebih dahulu!", "Akses Ditolak");
    window.location.replace("display-login.html");
    throw new Error("Unauthorized access");
  }
  
  const loginTime = sessionStorage.getItem("displayLoginTime");
  const eightHours = 8 * 60 * 60 * 1000;
  
  if (loginTime && (Date.now() - parseInt(loginTime)) > eightHours) {
    await customWarning("Sesi display Anda telah berakhir (8 jam). Silakan login kembali.", "Sesi Berakhir");
    sessionStorage.removeItem("displayAuth");
    sessionStorage.removeItem("displayLoginTime");
    sessionStorage.removeItem("display_token");
    window.location.replace("display-login.html");
    throw new Error("Session expired");
  }
  
  console.log('✅ Display access granted - Token valid');
})();

// ========= LOGOUT =========
async function logout() {
  const result = await customConfirm(
    'Layar karaoke akan berhenti dan Anda perlu login kembali untuk mengaktifkannya.', 
    {
      title: 'Keluar dari Display?',
      icon: '🚪',
      confirmText: 'Ya, Logout',
      cancelText: 'Batal',
      confirmClass: 'custom-modal-btn-danger'
    }
  );
  
  if (result) {
    sessionStorage.removeItem("displayAuth");
    sessionStorage.removeItem("displayLoginTime");
    sessionStorage.removeItem("display_token");
    
    await customSuccess("Logout berhasil! Display akan dimatikan.", "Sampai Jumpa!");
    
    setTimeout(() => {
      window.location.replace("display-login.html");
    }, 1500);
  }
}

// ========= EVENT LISTENERS =========
document.getElementById('logout-btn').addEventListener('click', logout);

console.log('✅ Display-page.js loaded');