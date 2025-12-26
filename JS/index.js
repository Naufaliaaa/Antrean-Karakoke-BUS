/*************************************************
 * INDEX.JS - Bus Selection Logic
 *************************************************/

// ========= DAFTAR BUS - EDIT DI SINI! =========
const buses = [
  { id: 'BUS-001', name: 'Bus 1', color: '#667eea' },
  { id: 'BUS-002', name: 'Bus 2', color: '#f093fb' },
  { id: 'BUS-003', name: 'Bus 3', color: '#4facfe' },
  { id: 'BUS-004', name: 'Bus 4', color: '#43e97b' },
  { id: 'BUS-005', name: 'Bus 5', color: '#fa709a' },
  { id: 'BUS-006', name: 'Bus 6', color: '#feca57' },
  { id: 'BUS-007', name: 'Bus 7', color: '#ff6b6b' },
];

// ========= RENDER BUS CARDS =========
function renderBusCards() {
  const grid = document.getElementById('bus-grid');
  grid.innerHTML = '';
  
  buses.forEach(bus => {
    const card = document.createElement('div');
    card.className = 'bus-card';
    card.style.background = `linear-gradient(135deg, ${bus.color} 0%, ${adjustColor(bus.color, -20)} 100%)`;
    card.onclick = () => selectBus(bus.id);
    
    card.innerHTML = `
      <div class="bus-icon"></div>
      <div class="bus-name">${bus.name}</div>
      <div class="bus-id">${bus.id}</div>
    `;
    
    grid.appendChild(card);
  });
}

// ========= ADJUST COLOR (DARKER) =========
function adjustColor(color, percent) {
  const num = parseInt(color.replace("#",""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// ========= SELECT BUS =========
function selectBus(roomId) {
  localStorage.setItem('karaoke_room_id', roomId);
  window.location.href = `pin-login.html?room=${roomId}`;
}

// ========= CUSTOM ROOM =========
function enterCustomRoom() {
  const input = document.getElementById('custom-room-id');
  const roomId = input.value.trim().toUpperCase();
  
  if (!roomId) {
    alert('Masukkan Room ID!');
    return;
  }
  
  if (!/^[A-Z0-9-]+$/.test(roomId)) {
    alert('Room ID hanya boleh huruf, angka, dan dash (-)');
    return;
  }
  
  localStorage.setItem('karaoke_room_id', roomId);
  window.location.href = `pin-login.html?room=${roomId}`;
}

// ========= ENTER KEY =========
document.getElementById('custom-room-id').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    enterCustomRoom();
  }
});

// ========= INIT =========
renderBusCards();

console.log('✅ Index.js loaded');