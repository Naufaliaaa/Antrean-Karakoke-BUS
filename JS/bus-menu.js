/*************************************************
 * BUS-MENU.JS - UPDATED WITH CAMERA LOGIN
 * ✅ Camera Panel → Redirect to camera-login.html
 *************************************************/

// ========= SECURITY CHECK =========
(async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('room');
  
  if (!roomId) {
    await customError('Room ID tidak ditemukan!', 'Akses Ditolak');
    window.location.href = 'index.html';
    return;
  }
  
  const roomToken = sessionStorage.getItem(`room_token_${roomId}`);
  
  if (!roomToken) {
    console.warn('⚠️ Unauthorized access attempt blocked!');
    await customWarning('Anda harus memasukkan PIN terlebih dahulu!', 'Akses Ditolak');
    window.location.href = `pin-login.html?room=${roomId}`;
    return;
  }
  
  console.log('✅ Access granted - Token valid');
})();

// ========= GET ROOM ID =========
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

// ========= DAFTAR BUS =========
const buses = [
  { id: 'BUS-001', name: 'Bus 1', color: '#667eea' },
  { id: 'BUS-002', name: 'Bus 2', color: '#f093fb' },
  { id: 'BUS-003', name: 'Bus 3', color: '#4facfe' },
  { id: 'BUS-004', name: 'Bus 4', color: '#43e97b' },
  { id: 'BUS-005', name: 'Bus 5', color: '#fa709a' },
  { id: 'BUS-006', name: 'Bus 6', color: '#feca57' },
  { id: 'BUS-007', name: 'Bus 7', color: '#ff6b6b' },
];

// ========= SET BUS INFO =========
function setBusInfo() {
  const bus = buses.find(b => b.id === roomId);
  
  if (bus) {
    document.getElementById('bus-name').textContent = bus.name;
    document.getElementById('bus-icon').style.background = `linear-gradient(135deg, ${bus.color} 0%, ${adjustColor(bus.color, -20)} 100%)`;
  } else {
    document.getElementById('bus-name').textContent = roomId;
  }
  
  document.getElementById('room-id').textContent = `Room ID: ${roomId}`;
}

// ========= ADJUST COLOR =========
function adjustColor(color, percent) {
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// ========= CONFIRM EXIT =========
async function confirmExit(e) {
  e.preventDefault();
  
  const result = await customConfirm(
    'Apakah Anda yakin ingin keluar dari room bus ini?', 
    {
      title: 'Konfirmasi Keluar',
      icon: '🚪',
      confirmText: 'Ya, Keluar',
      cancelText: 'Batal',
      confirmClass: 'custom-modal-btn-danger'
    }
  );
  
  if (result) {
    sessionStorage.removeItem(`room_token_${roomId}`);
    sessionStorage.removeItem(`room_pin_verified_${roomId}`);
    console.log('🚪 User logged out, token removed');
    window.location.href = 'index.html';
  }
}

// ========= NAVIGATION =========
function goToDisplay(e) {
  e.preventDefault();
  window.location.href = `display-login.html?room=${roomId}`;
}

function goToForm(e) {
  e.preventDefault();
  window.location.href = `form.html?room=${roomId}`;
}

function goToEmote(e) {
  e.preventDefault();
  window.location.href = `emote.html?room=${roomId}`;
}

// ✅ UPDATED: Camera Panel → Redirect to camera-login.html
function goToVideo(e) {
  e.preventDefault();
  window.location.href = `camera-login.html?room=${roomId}`;
}

function goToAdmin(e) {
  e.preventDefault();
  window.location.href = `admin-login.html?room=${roomId}`;
}

// ========= EVENT LISTENERS =========
document.getElementById('back-button').addEventListener('click', confirmExit);
document.getElementById('display-btn').addEventListener('click', goToDisplay);
document.getElementById('form-btn').addEventListener('click', goToForm);
document.getElementById('video-btn').addEventListener('click', goToVideo);
document.getElementById('admin-btn').addEventListener('click', goToAdmin);

const emoteBtn = document.getElementById('emote-btn');
if (emoteBtn) {
  emoteBtn.addEventListener('click', goToEmote);
}

// ========= INIT =========
setBusInfo();

console.log('✅ Bus-menu.js loaded (WITH CAMERA LOGIN)');