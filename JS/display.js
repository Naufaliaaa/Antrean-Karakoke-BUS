/*************************************************
 * DISPLAY.JS – COMPLETELY FIXED VERSION
 * Full Auto + Overlay Start + Error Message 3s + Room Support
 *************************************************/

// ========= INIT ROOM SYSTEM =========
console.log('🔄 Initializing room system for display...');

if (!window.RoomManager) {
  console.error('❌ RoomManager not loaded!');
  alert('Error: Room system tidak tersedia. Silakan refresh halaman.');
  throw new Error('RoomManager not loaded');
}

if (!RoomManager.initRoomSystem()) {
  console.error('❌ Room system initialization failed');
  throw new Error('Room system initialization failed');
}

console.log('✅ Room system initialized for display');

// ========= GET QUEUE REF =========
const queueRef = RoomManager.getQueueRef();

if (!queueRef) {
  console.error('❌ Queue reference not available');
  alert('Error: Tidak dapat terhubung ke database. Silakan pilih bus dari menu utama.');
  throw new Error('Queue reference not available');
}

console.log('✅ Queue reference obtained');

// ========= KONFIG =========
const MAX_DURATION = 600; // 10 menit

// ========= STATE =========
let player = null;
let currentKey = null;
let isPlayerReady = false;
let countdownTimer = null;
let remainingTime = MAX_DURATION;
let watchdogInterval = null;

// ========= 1. OVERLAY AKTIVASI =========
document.body.insertAdjacentHTML('afterbegin', `
  <div id="start-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:linear-gradient(135deg, #1a1a1a, #000); z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family: sans-serif;">
    <div style="font-size: 80px; margin-bottom: 20px;">🎤</div>
    <h1 style="margin-bottom:10px; font-size: 32px;">Sistem Karaoke Bus</h1>
    <p style="margin-bottom:30px; color: #aaa;">Klik tombol di bawah untuk mengaktifkan player</p>
    <button onclick="startSystem()" style="padding:20px 50px; font-size:24px; cursor:pointer; background:linear-gradient(135deg, #667eea, #764ba2); border:none; border-radius:50px; color:white; font-weight:bold; box-shadow: 0 10px 20px rgba(0,0,0,0.3); transition: 0.3s;">MULAI KARAOKE</button>
  </div>
`);

function startSystem() {
  const overlay = document.getElementById('start-overlay');
  if (overlay) overlay.remove();
  console.log("🚀 System Started");
  checkAndPlayFirst();
  
  if (!watchdogInterval) {
    watchdogInterval = setInterval(checkPlayerHealth, 5000);
  }
}

// ========= 2. LOAD YOUTUBE API =========
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

function onYouTubeIframeAPIReady() {
  console.log("✅ YouTube API Ready");
  isPlayerReady = true;
}

// ========= 3. CHECK & PLAY FIRST =========
function checkAndPlayFirst() {
  console.log('🔍 Checking for songs to play...');
  
  if (!isPlayerReady) {
    console.log('⏸️ Player not ready yet');
    return;
  }
  
  if (document.getElementById('start-overlay')) {
    console.log('⏸️ Start overlay still visible');
    return;
  }
  
  queueRef.orderByChild("order").limitToFirst(1).once("value", snap => {
    console.log('📊 First song check:', snap.val());
    
    if (snap.exists() && !currentKey) {
      snap.forEach(child => {
        console.log('▶️ Auto playing first song:', child.val().name);
        playSong(child.key, child.val());
      });
    }
  });
}

// ========= 4. PLAY SONG =========
function playSong(key, data) {
  console.log("🎵 Playing:", data.name);
  currentKey = key;
  remainingTime = MAX_DURATION;
  
  document.getElementById("now").innerText = "🎤 " + data.name;

  if (player) {
    clearAllTimers();
    try { player.destroy(); } catch(e) {}
    player = null;
  }

  player = new YT.Player("player", {
    height: "100%",
    width: "100%",
    videoId: data.videoId,
    playerVars: {
      autoplay: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      origin: window.location.origin
    },
    events: {
      onReady: (e) => {
        e.target.playVideo();
        startCountdown();
      },
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.ENDED) {
          console.log("✅ Video ended");
          removeCurrentAndPlayNext();
        }
      },
      onError: (e) => {
        console.error("❌ Video error:", e.data);
        handleVideoError();
      }
    }
  });
}

// ========= 5. ERROR HANDLER (3 DETIK) =========
function handleVideoError() {
  queueRef.child(currentKey).once("value", snap => {
    const songName = snap.exists() ? snap.val().name : "Seseorang";
    showErrorMessage(songName);
    setTimeout(() => {
      removeCurrentAndPlayNext();
    }, 3000);
  });
}

function showErrorMessage(name) {
  const overlay = document.createElement("div");
  overlay.id = "error-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  
  overlay.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 100px; margin-bottom: 30px;">⚠️</div>
      <h1 style="font-size: 48px; color: #ef4444; margin-bottom: 20px; font-weight: bold;">
        Link Bermasalah!
      </h1>
      <p style="font-size: 32px; color: white; margin-bottom: 15px;">
        Maaf link yang <strong style="color: #fbbf24;">${name}</strong> request bermasalah
      </p>
      <p style="font-size: 24px; color: #94a3b8;">
        Video tidak dapat diputar
      </p>
      <p style="font-size: 20px; color: #64748b; margin-top: 30px;">
        Melanjutkan ke lagu berikutnya dalam <span id="error-countdown" style="color: #fbbf24; font-weight: bold;">3</span> detik...
      </p>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  let count = 3;
  const countdownEl = document.getElementById("error-countdown");
  const countdownInterval = setInterval(() => {
    count--;
    if (countdownEl) countdownEl.textContent = count;
    if (count <= 0) clearInterval(countdownInterval);
  }, 1000);
  
  setTimeout(() => overlay.remove(), 3000);
}

// ========= 6. REALTIME LISTENER =========
queueRef.orderByChild("order").on("value", snap => {
  console.log('📊 Queue data updated:', snap.val());
  console.log('🎵 Current key:', currentKey);
  console.log('🎬 Player ready:', isPlayerReady);
  
  renderQueue(snap.val());
  
  if (!snap.exists()) {
    console.log('📭 Queue empty');
    resetPlayer();
    return;
  }

  // Auto play jika tidak ada yang sedang diputar
  if (!currentKey && isPlayerReady && !document.getElementById('start-overlay')) {
    console.log('🚀 Attempting to auto play...');
    snap.forEach(child => {
      console.log('▶️ Playing:', child.val().name);
      playSong(child.key, child.val());
      return true;
    });
  }

  // Cek jika lagu current dihapus oleh admin
  const data = snap.val();
  if (currentKey && (!data || !data[currentKey])) {
    console.log('⏭️ Current song removed, playing next...');
    playNextSong();
  }
});

// ========= 7. NEXT & REMOVE =========
function removeCurrentAndPlayNext() {
  if (!currentKey) return;
  
  queueRef.child(currentKey).remove()
    .then(() => {
      console.log("✅ Song removed from queue");
      currentKey = null;
      playNextSong();
    });
}

function playNextSong() {
  clearAllTimers();
  currentKey = null;
  
  queueRef.orderByChild("order").limitToFirst(1).once("value", snap => {
    if (!snap.exists()) {
      resetPlayer();
    } else {
      snap.forEach(child => playSong(child.key, child.val()));
    }
  });
}

// ========= 8. TIMER =========
function startCountdown() {
  clearInterval(countdownTimer);
  remainingTime = MAX_DURATION;
  updateTimerUI();
  
  countdownTimer = setInterval(() => {
    remainingTime--;
    updateTimerUI();
    
    if (remainingTime <= 0) {
      console.log("⏰ Time limit reached (10 menit)");
      clearAllTimers();
      removeCurrentAndPlayNext();
    }
  }, 1000);
}

function updateTimerUI() {
  const min = Math.floor(remainingTime / 60);
  const sec = remainingTime % 60;
  const el = document.getElementById("timer");
  if (el) {
    el.innerText = `⏳ ${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
}

function clearAllTimers() {
  clearInterval(countdownTimer);
}

// ========= 9. HEALTH CHECK =========
function checkPlayerHealth() {
  if (player && typeof player.getPlayerState === 'function') {
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.CUED) {
      console.log("⚠️ Player paused, resuming...");
      player.playVideo();
    }
  }
}

// ========= 10. RESET PLAYER =========
function resetPlayer() {
  console.log("🔄 Reset player");
  currentKey = null;
  clearAllTimers();
  
  if (player) {
    try { player.destroy(); } catch(e) {}
    player = null;
  }
  
  document.getElementById("now").innerText = "Menunggu lagu...";
  document.getElementById("timer").innerText = "⏳ 10:00";
}

// ========= 11. RENDER QUEUE =========
function renderQueue(data) {
  const list = document.getElementById("queue-list");
  
  if (!data) {
    list.innerHTML = '<div class="empty">Belum ada antrean</div>';
    list.className = "empty";
    return;
  }

  list.className = "";
  const items = Object.entries(data).sort((a, b) => a[1].order - b[1].order);
  const nextItems = items.slice(1);
  
  if (nextItems.length === 0) {
    list.innerHTML = '<div class="empty">Tidak ada lagu selanjutnya</div>';
    list.className = "empty";
  } else {
    list.innerHTML = nextItems.map((item, index) => `
      <div class="queue-item">
        <div class="queue-number">${index + 1}</div>
        <div class="queue-name">${item[1].name}</div>
      </div>
    `).join('');
  }
}