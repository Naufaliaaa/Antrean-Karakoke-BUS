//FILE form.js

// ================= INIT ROOM SYSTEM =================
console.log('🔄 Initializing room system...');

if (!window.RoomManager) {
  console.error('❌ RoomManager not loaded!');
  alert('Error: Room system tidak tersedia. Silakan refresh halaman.');
  throw new Error('RoomManager not loaded');
}

if (!RoomManager.initRoomSystem()) {
  console.error('❌ Room system initialization failed');
  throw new Error('Room system initialization failed');
}

// ================= FIREBASE DENGAN ROOM =================
const queueRef = RoomManager.getQueueRef();

if (!queueRef) {
  console.error('❌ Queue reference not available');
  alert('Error: Tidak dapat terhubung ke database. Silakan pilih bus dari menu utama.');
  throw new Error('Queue reference not available');
}

console.log('✅ Room system initialized successfully');

// ================= DEVICE ID =================
function getDeviceId() {
  let deviceId = localStorage.getItem("karaoke_device_id");
  
  if (!deviceId) {
    deviceId = "DEV_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("karaoke_device_id", deviceId);
  }
  
  return deviceId;
}

const DEVICE_ID = getDeviceId();

// ================= UTIL =================
function extractVideoId(url) {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
}

// ================= SHOW ALERT =================
function showAlert(message, type) {
  const alert = document.getElementById("alert");
  alert.textContent = message;
  alert.className = `alert ${type}`;
  alert.style.display = "block";
  
  setTimeout(() => {
    alert.style.display = "none";
  }, 5000);
}

// ================= CEK DEVICE DI ANTREAN =================
function checkDeviceInQueue(deviceId) {
  return new Promise((resolve) => {
    queueRef.once("value", snap => {
      if (!snap.exists()) {
        resolve(false);
        return;
      }
      
      const data = snap.val();
      const devices = Object.values(data).map(item => item.deviceId);
      
      resolve(devices.includes(deviceId));
    });
  });
}

// ================= GET NAMA DARI DEVICE =================
function getNameFromDevice(deviceId) {
  return new Promise((resolve) => {
    queueRef.once("value", snap => {
      if (!snap.exists()) {
        resolve(null);
        return;
      }
      
      const data = snap.val();
      const song = Object.values(data).find(item => item.deviceId === deviceId);
      
      resolve(song ? song.name : null);
    });
  });
}

// ================= SUBMIT SONG =================
async function submitSong() {
  const nameInput = document.getElementById("name");
  const linkInput = document.getElementById("youtube-link");
  
  const name = nameInput.value.trim();
  const link = linkInput.value.trim();
  
  if (!name || !link) {
    showAlert("❌ Nama dan link YouTube wajib diisi!", "error");
    return;
  }
  
  if (name.length < 2) {
    showAlert("❌ Nama minimal 2 karakter!", "error");
    return;
  }
  
  const videoId = extractVideoId(link);
  if (!videoId) {
    showAlert("❌ Link YouTube tidak valid!", "error");
    return;
  }
  
  const deviceExists = await checkDeviceInQueue(DEVICE_ID);
  
  if (deviceExists) {
    const activeName = await getNameFromDevice(DEVICE_ID);
    showAlert(`⏳ Device ini sudah ada request aktif dengan nama "${activeName}". Tunggu sampai lagu selesai ya! 🎤`, "error");
    return;
  }
  
  queueRef.once("value", snap => {
    let maxOrder = 0;
    
    if (snap.exists()) {
      snap.forEach(child => {
        if (child.val().order > maxOrder) {
          maxOrder = child.val().order;
        }
      });
    }
    
    queueRef.push({
      name: name,
      videoId: videoId,
      deviceId: DEVICE_ID,
      order: maxOrder + 1,
      createdAt: Date.now()
    }, (error) => {
      if (error) {
        showAlert("❌ Gagal menambahkan lagu. Coba lagi!", "error");
      } else {
        showAlert(`✅ Berhasil! Lagu kamu ditambahkan ke antrean. Terima kasih ${name}! 🎉`, "success");
        nameInput.value = "";
        linkInput.value = "";
        nameInput.focus();
      }
    });
  });
}

// ================= UPDATE STATUS =================
queueRef.on("value", snap => {
  const queueCount = document.getElementById("queue-count");
  const queueStatus = document.getElementById("queue-status");
  
  if (!snap.exists()) {
    queueCount.textContent = "0";
    queueStatus.innerHTML = "⏳ Menunggu antrean...";
    queueStatus.style.background = "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)";
    queueStatus.style.color = "#0369a1";
    return;
  }
  
  const data = snap.val();
  const items = Object.values(data);
  const count = items.length;
  
  queueCount.textContent = count;
  
  const myRequest = items.find(item => item.deviceId === DEVICE_ID);
  
  if (myRequest) {
    const position = items.findIndex(item => item.deviceId === DEVICE_ID) + 1;
    queueStatus.innerHTML = `🎵 <strong>${myRequest.name}</strong> kamu ada di urutan ke-${position}! ${position === 1 ? 'Sedang bernyanyi 🎤' : 'Tunggu ya! ⏳'}`;
    queueStatus.style.background = "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";
    queueStatus.style.color = "#92400e";
  } else {
    const nowPlaying = items[0];
    queueStatus.innerHTML = `🎤 <strong>${nowPlaying.name}</strong> sedang bernyanyi! ${count > 1 ? `(${count - 1} orang menunggu)` : ''}`;
    queueStatus.style.background = "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)";
    queueStatus.style.color = "#166534";
  }
});

// ================= ENTER KEY =================
document.getElementById("name").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    document.getElementById("youtube-link").focus();
  }
});

document.getElementById("youtube-link").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    submitSong();
  }
});