/*************************************************
 * DISPLAY.JS – WITH ALTERNATING EMOTE ANIMATION
 * ✅ Emote bergerak BOLAK-BALIK (Kanan→Kiri, Kiri→Kanan)
 * ✅ Seperti Live Streaming
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

// ========= GET REFS =========
const queueRef = RoomManager.getQueueRef();
const roomId = RoomManager.getRoomId();
const roomRef = RoomManager.getRoomRef();
const emotesRef = roomRef.child('emotes');

if (!queueRef) {
  console.error('❌ Queue reference not available');
  alert('Error: Tidak dapat terhubung ke database.');
  throw new Error('Queue reference not available');
}

console.log('✅ Room ID:', roomId);

// ========= CONFIG =========
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const MAX_DURATION = 600;

// ========= STATE =========
let player = null;
let currentKey = null;
let isPlayerReady = false;
let countdownTimer = null;
let remainingTime = MAX_DURATION;
let watchdogInterval = null;

// WebRTC State
let peerConnection = null;
let videoSessionRef = null;
let remoteStream = null;
let isPiPActive = false;

// Emote State
let activeEmotes = [];
let emotePositions = [15, 30, 45, 60, 75]; // 5 Y positions (%)
let nextEmotePosition = 0;
let nextDirection = 'rtl'; // Alternate between 'rtl' and 'ltr'

// ========= 1. OVERLAY =========
document.body.insertAdjacentHTML('afterbegin', `
  <div id="start-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:linear-gradient(135deg, #1a1a1a, #000); z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family: sans-serif;">
    <div style="font-size: 80px; margin-bottom: 20px;">🎤</div>
    <h1 style="margin-bottom:10px; font-size: 32px;">Sistem Karaoke Bus</h1>
    <p style="margin-bottom:30px; color: #aaa;">Klik tombol di bawah untuk mengaktifkan player</p>
    <button onclick="startSystem()" style="padding:20px 50px; font-size:24px; cursor:pointer; background:linear-gradient(135deg, #667eea, #764ba2); border:none; border-radius:50px; color:white; font-weight:bold; box-shadow: 0 10px 20px rgba(0,0,0,0.3); transition: 0.3s;">MULAI KARAOKE</button>
  </div>
`);

window.startSystem = function() {
  const overlay = document.getElementById('start-overlay');
  if (overlay) overlay.remove();
  console.log("🚀 System Started");
  checkAndPlayFirst();
  initWebRTCReceiver();
  initEmoteListener();
  
  if (!watchdogInterval) {
    watchdogInterval = setInterval(checkPlayerHealth, 5000);
  }
}

// ========= 2. YOUTUBE API =========
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(tag);

window.onYouTubeIframeAPIReady = function() {
  console.log("✅ YouTube API Ready");
  isPlayerReady = true;
}

// ========= 3. WEBRTC =========
function initWebRTCReceiver() {
  console.log('📹 Initializing WebRTC receiver...');
  videoSessionRef = db.ref(`karaoke/room/${roomId}/videoSession`);
  
  videoSessionRef.child('cameraStatus').on('value', (snapshot) => {
    const status = snapshot.val();
    if (status === 'connected') {
      setupWebRTCConnection();
    } else if (status === 'disconnected') {
      closePiPCamera();
    }
  });
}

async function setupWebRTCConnection() {
  try {
    peerConnection = new RTCPeerConnection(configuration);
    
    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      const pipVideo = document.getElementById('pip-video');
      const pipCamera = document.getElementById('pip-camera');
      
      if (pipVideo && pipCamera) {
        pipVideo.srcObject = remoteStream;
        pipCamera.classList.remove('hidden');
        isPiPActive = true;
      }
    };
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        videoSessionRef.child('displayCandidates').push(event.candidate.toJSON());
      }
    };
    
    peerConnection.onconnectionstatechange = () => {
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        closePiPCamera();
      }
    };
    
    videoSessionRef.child('offer').on('value', async (snapshot) => {
      if (!snapshot.exists() || peerConnection.currentRemoteDescription) return;
      
      const offer = snapshot.val();
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      await videoSessionRef.child('answer').set(peerConnection.localDescription.toJSON());
    });
    
    videoSessionRef.child('cameraCandidates').on('child_added', async (snapshot) => {
      const candidate = snapshot.val();
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });
  } catch (error) {
    console.error('❌ WebRTC error:', error);
  }
}

function closePiPCamera() {
  const pipCamera = document.getElementById('pip-camera');
  const pipVideo = document.getElementById('pip-video');
  
  if (pipCamera) pipCamera.classList.add('hidden');
  if (pipVideo) pipVideo.srcObject = null;
  if (peerConnection) peerConnection.close();
  
  peerConnection = null;
  remoteStream = null;
  isPiPActive = false;
}

// ========= 4. 🎭 EMOTE LISTENER (ALTERNATING) =========
function initEmoteListener() {
  console.log('🎭 Initializing emote listener...');
  
  // Listen untuk emote baru
  emotesRef.orderByChild('timestamp').limitToLast(1).on('child_added', (snapshot) => {
    const emote = snapshot.val();
    
    // Cek apakah sudah pernah ditampilkan
    if (activeEmotes.includes(snapshot.key)) {
      return;
    }
    
    console.log('🎭 New emote received:', emote);
    showEmoteAnimation(emote, snapshot.key);
  });
  
  console.log('✅ Emote listener active');
}

function showEmoteAnimation(emoteData, emoteKey) {
  const container = document.getElementById('emote-container');
  if (!container) {
    console.error('❌ Emote container not found');
    return;
  }
  
  // Create emote element
  const emoteEl = document.createElement('div');
  emoteEl.className = 'floating-emote';
  
  // ✨ ALTERNATE DIRECTION (RTL ↔ LTR)
  const direction = nextDirection;
  emoteEl.classList.add(direction);
  
  // Toggle untuk emote berikutnya
  nextDirection = (direction === 'rtl') ? 'ltr' : 'rtl';
  
  // Get Y position
  const yPosition = emotePositions[nextEmotePosition % emotePositions.length];
  nextEmotePosition++;
  
  emoteEl.style.top = `${yPosition}%`;
  
  emoteEl.innerHTML = `
    <div class="emote-emoji">${emoteData.emote}</div>
    <div class="emote-info">
      <div class="emote-name">${emoteData.name}</div>
      <div class="emote-label">${emoteData.emoteName || ''}</div>
    </div>
  `;
  
  container.appendChild(emoteEl);
  activeEmotes.push(emoteKey);
  
  console.log(`✅ Emote animation started (${direction.toUpperCase()}):`, emoteData.name);
  
  // Remove after 10s
  setTimeout(() => {
    emoteEl.remove();
    const index = activeEmotes.indexOf(emoteKey);
    if (index > -1) activeEmotes.splice(index, 1);
  }, 10000);
}

// ========= 5. PLAY SONG =========
function checkAndPlayFirst() {
  if (!isPlayerReady || document.getElementById('start-overlay')) return;
  
  queueRef.orderByChild("order").limitToFirst(1).once("value", snap => {
    if (snap.exists() && !currentKey) {
      snap.forEach(child => playSong(child.key, child.val()));
    }
  });
}

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
    playerVars: { autoplay: 1, controls: 1, rel: 0, modestbranding: 1 },
    events: {
      onReady: (e) => { e.target.playVideo(); startCountdown(); },
      onStateChange: (e) => { if (e.data === YT.PlayerState.ENDED) removeCurrentAndPlayNext(); },
      onError: (e) => handleVideoError()
    }
  });
}

function handleVideoError() {
  queueRef.child(currentKey).once("value", snap => {
    const songName = snap.exists() ? snap.val().name : "Seseorang";
    showErrorMessage(songName);
    setTimeout(() => removeCurrentAndPlayNext(), 3000);
  });
}

function showErrorMessage(name) {
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); display:flex; align-items:center; justify-content:center; z-index:9999;";
  overlay.innerHTML = `
    <div style="text-align:center; padding:40px;">
      <div style="font-size:100px; margin-bottom:30px;">⚠️</div>
      <h1 style="font-size:48px; color:#ef4444; margin-bottom:20px;">Link Bermasalah!</h1>
      <p style="font-size:32px; color:white;">Maaf link yang <strong style="color:#fbbf24;">${name}</strong> request bermasalah</p>
      <p style="font-size:24px; color:#94a3b8; margin-top:15px;">Video tidak dapat diputar</p>
      <p style="font-size:20px; color:#64748b; margin-top:30px;">Melanjutkan dalam <span id="error-countdown" style="color:#fbbf24;">3</span> detik...</p>
    </div>
  `;
  document.body.appendChild(overlay);
  
  let count = 3;
  const interval = setInterval(() => {
    count--;
    const el = document.getElementById("error-countdown");
    if (el) el.textContent = count;
    if (count <= 0) clearInterval(interval);
  }, 1000);
  
  setTimeout(() => overlay.remove(), 3000);
}

// ========= 6. QUEUE LISTENER =========
queueRef.orderByChild("order").on("value", snap => {
  renderQueue(snap.val());
  
  if (!snap.exists()) {
    resetPlayer();
    return;
  }

  if (!currentKey && isPlayerReady && !document.getElementById('start-overlay')) {
    snap.forEach(child => { playSong(child.key, child.val()); return true; });
  }

  const data = snap.val();
  if (currentKey && (!data || !data[currentKey])) {
    playNextSong();
  }
});

function removeCurrentAndPlayNext() {
  if (!currentKey) return;
  queueRef.child(currentKey).remove().then(() => {
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

// ========= 7. TIMER =========
function startCountdown() {
  clearInterval(countdownTimer);
  remainingTime = MAX_DURATION;
  updateTimerUI();
  
  countdownTimer = setInterval(() => {
    remainingTime--;
    updateTimerUI();
    if (remainingTime <= 0) {
      clearAllTimers();
      removeCurrentAndPlayNext();
    }
  }, 1000);
}

function updateTimerUI() {
  const min = Math.floor(remainingTime / 60);
  const sec = remainingTime % 60;
  const el = document.getElementById("timer");
  if (el) el.innerText = `⏳ ${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function clearAllTimers() {
  clearInterval(countdownTimer);
}

function checkPlayerHealth() {
  if (player && typeof player.getPlayerState === 'function') {
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.CUED) {
      player.playVideo();
    }
  }
}

function resetPlayer() {
  currentKey = null;
  clearAllTimers();
  if (player) { try { player.destroy(); } catch(e) {} player = null; }
  document.getElementById("now").innerText = "Menunggu lagu...";
  document.getElementById("timer").innerText = "⏳ 10:00";
}

// ========= 8. RENDER QUEUE =========
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
    list.innerHTML = nextItems.map((item, i) => `
      <div class="queue-item">
        <div class="queue-number">${i + 1}</div>
        <div class="queue-name">${item[1].name}</div>
      </div>
    `).join('');
  }
}

// ========= 9. CLEANUP =========
window.addEventListener('beforeunload', () => {
  if (peerConnection) peerConnection.close();
  if (videoSessionRef) {
    videoSessionRef.child('answer').remove();
    videoSessionRef.child('displayCandidates').remove();
  }
});

console.log('✅ Display.js with alternating emote animation loaded');