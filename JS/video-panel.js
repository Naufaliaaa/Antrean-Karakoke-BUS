/*************************************************
 * VIDEO-PANEL.JS - ULTRA-FIXED & SIMPLIFIED
 * ✅ Direct event binding
 * ✅ No complex async init
 * ✅ Better error handling
 *************************************************/

console.log('🎥 VIDEO-PANEL.JS LOADING...');

// ========= GLOBAL STATE =========
let roomId = null;
let videoSessionRef = null;

// WebRTC Config
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// Media State
let localStream = null;
let peerConnection = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordingStartTime = null;
let recordingInterval = null;
let currentFacingMode = 'user';
let isCameraActive = false;

// ========= IMMEDIATE BUTTON BINDING =========
// Bind as soon as DOM is ready, no waiting
function bindButtons() {
  console.log('🔧 Binding buttons...');
  
  const startBtn = document.getElementById('start-camera-btn');
  const stopBtn = document.getElementById('stop-camera-btn');
  const recordBtn = document.getElementById('record-btn');
  const flipBtn = document.getElementById('flip-camera-btn');
  const backBtn = document.getElementById('back-btn');
  
  if (startBtn) {
    console.log('✅ Found start button');
    
    // Remove any existing listeners
    const newStartBtn = startBtn.cloneNode(true);
    startBtn.parentNode.replaceChild(newStartBtn, startBtn);
    
    // Add new listener
    newStartBtn.addEventListener('click', async function(e) {
      console.log('🎬 START BUTTON CLICKED!');
      e.preventDefault();
      
      // Disable immediately
      this.disabled = true;
      this.innerHTML = '<span>⏳</span><span>Memulai...</span>';
      
      try {
        await startCamera();
      } catch (error) {
        console.error('❌ Start camera failed:', error);
        this.disabled = false;
        this.innerHTML = '<span>📷</span><span>Aktifkan Kamera</span>';
        alert('Gagal: ' + error.message);
      }
    });
    
    console.log('✅ Start button listener attached');
  } else {
    console.error('❌ Start button not found!');
  }
  
  if (stopBtn) {
    stopBtn.addEventListener('click', stopCamera);
    console.log('✅ Stop button listener attached');
  }
  
  if (recordBtn) {
    recordBtn.addEventListener('click', toggleRecording);
    console.log('✅ Record button listener attached');
  }
  
  if (flipBtn) {
    flipBtn.addEventListener('click', flipCamera);
    console.log('✅ Flip button listener attached');
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', handleBack);
    console.log('✅ Back button listener attached');
  }
}

// ========= INITIALIZE =========
async function initialize() {
  console.log('🚀 Initializing system...');
  
  try {
    // Wait for Firebase
    let attempts = 0;
    while (!window.db && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    
    if (!window.db) {
      throw new Error('Firebase not loaded');
    }
    
    console.log('✅ Firebase ready');
    
    // Wait for RoomManager
    attempts = 0;
    while (!window.RoomManager && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    
    if (!window.RoomManager) {
      throw new Error('RoomManager not loaded');
    }
    
    console.log('✅ RoomManager ready');
    
    // Initialize room
    if (!RoomManager.initRoomSystem()) {
      throw new Error('Failed to init room system');
    }
    
    roomId = RoomManager.getRoomId();
    if (!roomId) {
      throw new Error('Room ID not found');
    }
    
    console.log('✅ Room ID:', roomId);
    
    // Initialize Firebase ref
    videoSessionRef = window.db.ref(`karaoke/room/${roomId}/videoSession`);
    console.log('✅ Video session ref ready');
    
    // Bind buttons
    bindButtons();
    
    console.log('✅ System ready!');
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    alert('Error: ' + error.message + '\n\nSilakan refresh halaman.');
  }
}

// ========= START CAMERA =========
async function startCamera() {
  console.log('📹 STARTING CAMERA...');
  
  const startBtn = document.getElementById('start-camera-btn');
  const stopBtn = document.getElementById('stop-camera-btn');
  const recordBtn = document.getElementById('record-btn');
  const flipBtn = document.getElementById('flip-camera-btn');
  const overlay = document.getElementById('camera-overlay');
  const video = document.getElementById('local-video');
  const statusText = document.getElementById('connection-status');
  const statusDot = document.getElementById('status-dot');
  const streamText = document.getElementById('streaming-status');
  
  try {
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser tidak mendukung akses kamera. Gunakan browser modern (Chrome/Firefox).');
    }
    
    console.log('📱 Requesting camera access...');
    
    // Request camera
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 }
      },
      audio: true
    };
    
    console.log('📹 Constraints:', constraints);
    
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('✅ Camera stream obtained!');
    console.log('📹 Video tracks:', localStream.getVideoTracks().length);
    console.log('🎤 Audio tracks:', localStream.getAudioTracks().length);
    
    // Set video source
    video.srcObject = localStream;
    
    // Wait for video to load
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        console.log('✅ Video metadata loaded');
        video.play().then(resolve).catch(reject);
      };
      
      setTimeout(() => reject(new Error('Video load timeout')), 5000);
    });
    
    console.log('✅ Video playing');
    
    // Hide overlay
    if (overlay) overlay.classList.add('hidden');
    
    // Update UI
    isCameraActive = true;
    
    if (startBtn) {
      startBtn.style.display = 'none';
    }
    
    if (stopBtn) {
      stopBtn.style.display = 'inline-flex';
    }
    
    if (recordBtn) {
      recordBtn.disabled = false;
    }
    
    if (flipBtn) {
      flipBtn.disabled = false;
    }
    
    if (statusText) {
      statusText.textContent = 'Online';
    }
    
    if (statusDot) {
      statusDot.classList.add('online');
    }
    
    console.log('📡 Setting up WebRTC...');
    
    // Setup WebRTC
    await setupWebRTC();
    
    // Update Firebase
    if (videoSessionRef) {
      await videoSessionRef.child('cameraStatus').set('connected');
      console.log('✅ Firebase updated');
    }
    
    if (streamText) {
      streamText.textContent = 'Aktif (Tampil di Display)';
    }
    
    console.log('✅✅✅ CAMERA FULLY ACTIVE!');
    
    // Show success (if customSuccess available)
    if (typeof customSuccess === 'function') {
      await customSuccess('Kamera berhasil diaktifkan!', '✅ Berhasil');
    } else {
      alert('✅ Kamera aktif dan streaming ke display!');
    }
    
  } catch (error) {
    console.error('❌ Camera error:', error);
    
    // Reset UI
    if (startBtn) {
      startBtn.disabled = false;
      startBtn.innerHTML = '<span>📷</span><span>Aktifkan Kamera</span>';
    }
    
    if (overlay) {
      overlay.classList.remove('hidden');
    }
    
    // Show error
    let errorMsg = 'Gagal mengakses kamera.\n\n';
    
    if (error.name === 'NotAllowedError') {
      errorMsg += '🚫 Izin kamera ditolak!\n\n';
      errorMsg += 'Solusi:\n';
      errorMsg += '1. Klik ikon gembok di address bar\n';
      errorMsg += '2. Pilih "Izinkan" untuk Camera\n';
      errorMsg += '3. Refresh halaman\n';
    } else if (error.name === 'NotFoundError') {
      errorMsg += '📷 Kamera tidak ditemukan!\n\n';
      errorMsg += 'Pastikan device memiliki kamera.';
    } else if (error.name === 'NotReadableError') {
      errorMsg += '⚠️ Kamera sedang digunakan!\n\n';
      errorMsg += 'Tutup aplikasi lain yang menggunakan kamera.';
    } else {
      errorMsg += 'Error: ' + (error.message || 'Unknown error');
    }
    
    if (typeof customError === 'function') {
      await customError(errorMsg, 'Camera Error');
    } else {
      alert(errorMsg);
    }
    
    throw error;
  }
}

// ========= SETUP WEBRTC =========
async function setupWebRTC() {
  try {
    console.log('📡 Creating peer connection...');
    
    peerConnection = new RTCPeerConnection(configuration);
    
    // Add tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
      console.log('➕ Added track:', track.kind);
    });
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && videoSessionRef) {
        videoSessionRef.child('cameraCandidates').push(event.candidate.toJSON());
        console.log('📤 Sent ICE candidate');
      }
    };
    
    // Handle connection state
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
    };
    
    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    console.log('📤 Created offer');
    
    // Send offer
    if (videoSessionRef) {
      await videoSessionRef.child('offer').set(peerConnection.localDescription.toJSON());
      console.log('✅ Offer sent');
    }
    
    // Listen for answer
    if (videoSessionRef) {
      videoSessionRef.child('answer').on('value', async (snapshot) => {
        if (!snapshot.exists() || !peerConnection || peerConnection.currentRemoteDescription) return;
        
        const answer = snapshot.val();
        console.log('📩 Received answer');
        
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (e) {
          console.error('Error setting remote description:', e);
        }
      });
    }
    
    // Listen for ICE candidates
    if (videoSessionRef) {
      videoSessionRef.child('displayCandidates').on('child_added', async (snapshot) => {
        const candidate = snapshot.val();
        
        if (peerConnection && candidate) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('📥 Added ICE candidate');
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
      });
    }
    
    console.log('✅ WebRTC setup complete');
    
  } catch (error) {
    console.error('❌ WebRTC error:', error);
    throw error;
  }
}

// ========= STOP CAMERA =========
async function stopCamera() {
  console.log('⏹️ Stopping camera...');
  
  const confirmStop = typeof customConfirm === 'function' 
    ? await customConfirm('Camera akan dimatikan. Lanjutkan?', {
        title: 'Stop Kamera?',
        confirmText: 'Ya',
        cancelText: 'Batal'
      })
    : confirm('Stop kamera?');
  
  if (!confirmStop) return;
  
  try {
    // Stop recording
    if (isRecording) {
      stopRecording();
    }
    
    // Stop tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped:', track.kind);
      });
      localStream = null;
    }
    
    // Close peer
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    
    // Reset video
    const video = document.getElementById('local-video');
    if (video) video.srcObject = null;
    
    // Show overlay
    const overlay = document.getElementById('camera-overlay');
    if (overlay) overlay.classList.remove('hidden');
    
    // Update UI
    isCameraActive = false;
    
    const startBtn = document.getElementById('start-camera-btn');
    const stopBtn = document.getElementById('stop-camera-btn');
    const recordBtn = document.getElementById('record-btn');
    const flipBtn = document.getElementById('flip-camera-btn');
    const statusText = document.getElementById('connection-status');
    const statusDot = document.getElementById('status-dot');
    const streamText = document.getElementById('streaming-status');
    
    if (startBtn) {
      startBtn.style.display = 'inline-flex';
      startBtn.disabled = false;
      startBtn.innerHTML = '<span>📷</span><span>Aktifkan Kamera</span>';
    }
    
    if (stopBtn) stopBtn.style.display = 'none';
    if (recordBtn) recordBtn.disabled = true;
    if (flipBtn) flipBtn.disabled = true;
    if (statusText) statusText.textContent = 'Offline';
    if (statusDot) statusDot.classList.remove('online');
    if (streamText) streamText.textContent = 'Tidak Aktif';
    
    // Clean Firebase
    if (videoSessionRef) {
      await videoSessionRef.set(null);
      console.log('✅ Firebase cleaned');
    }
    
    console.log('✅ Camera stopped');
    
    if (typeof customSuccess === 'function') {
      await customSuccess('Kamera dimatikan', 'Selesai');
    }
    
  } catch (error) {
    console.error('❌ Stop error:', error);
  }
}

// ========= FLIP CAMERA =========
async function flipCamera() {
  try {
    console.log('🔄 Flipping camera...');
    
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    // Stop current
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
    }
    
    // Get new stream
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacingMode },
      audio: true
    });
    
    // Update video
    const video = document.getElementById('local-video');
    if (video) video.srcObject = localStream;
    
    // Update peer tracks
    if (peerConnection) {
      const senders = peerConnection.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');
      const audioSender = senders.find(s => s.track?.kind === 'audio');
      
      if (videoSender) {
        await videoSender.replaceTrack(localStream.getVideoTracks()[0]);
      }
      if (audioSender) {
        await audioSender.replaceTrack(localStream.getAudioTracks()[0]);
      }
    }
    
    console.log('✅ Camera flipped');
    
  } catch (error) {
    console.error('❌ Flip error:', error);
    alert('Gagal flip: ' + error.message);
  }
}

// ========= RECORDING =========
function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

function startRecording() {
  try {
    console.log('🔴 Start recording...');
    
    recordedChunks = [];
    
    const options = {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 2500000
    };
    
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm';
    }
    
    mediaRecorder = new MediaRecorder(localStream, options);
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    
    mediaRecorder.onstop = saveRecording;
    
    mediaRecorder.start();
    isRecording = true;
    
    // Update UI
    const btn = document.getElementById('record-btn');
    const icon = document.getElementById('record-icon');
    const text = document.getElementById('record-text');
    const bar = document.getElementById('recording-status-bar');
    
    if (btn) btn.classList.add('recording');
    if (icon) icon.textContent = '⏹️';
    if (text) text.textContent = 'Stop Rekam';
    if (bar) bar.style.display = 'flex';
    
    // Start timer
    recordingStartTime = Date.now();
    recordingInterval = setInterval(updateRecordingTime, 1000);
    
    console.log('✅ Recording started');
    
  } catch (error) {
    console.error('❌ Recording error:', error);
    alert('Gagal rekam: ' + error.message);
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    console.log('⏹️ Stop recording...');
    
    mediaRecorder.stop();
    isRecording = false;
    
    // Update UI
    const btn = document.getElementById('record-btn');
    const icon = document.getElementById('record-icon');
    const text = document.getElementById('record-text');
    const bar = document.getElementById('recording-status-bar');
    const time = document.getElementById('recording-time');
    
    if (btn) btn.classList.remove('recording');
    if (icon) icon.textContent = '⏺️';
    if (text) text.textContent = 'Mulai Rekam';
    if (bar) bar.style.display = 'none';
    if (time) time.textContent = '00:00';
    
    clearInterval(recordingInterval);
    
    console.log('✅ Recording stopped');
  }
}

function updateRecordingTime() {
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  
  const timeEl = document.getElementById('recording-time');
  if (timeEl) {
    timeEl.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
}

function saveRecording() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `karaoke-${roomId}-${Date.now()}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  setTimeout(() => URL.revokeObjectURL(url), 100);
  
  console.log('💾 Recording saved');
  
  if (typeof customSuccess === 'function') {
    customSuccess('Video tersimpan!', 'Berhasil');
  } else {
    alert('✅ Video tersimpan!');
  }
}

// ========= BACK =========
async function handleBack(e) {
  e.preventDefault();
  
  if (isCameraActive || isRecording) {
    const confirmBack = typeof customConfirm === 'function'
      ? await customConfirm('Camera aktif. Yakin keluar?', {
          title: 'Keluar?',
          confirmText: 'Ya',
          cancelText: 'Batal'
        })
      : confirm('Camera aktif. Yakin keluar?');
    
    if (!confirmBack) return;
    
    if (isRecording) stopRecording();
    if (isCameraActive) await stopCamera();
  }
  
  window.location.href = `bus-menu.html?room=${roomId}`;
}

// ========= LOGOUT =========
async function logout() {
  console.log('🚪 Logout...');
  
  const confirmLogout = typeof customConfirm === 'function'
    ? await customConfirm('Logout dari Camera Panel?', {
        title: 'Logout?',
        confirmText: 'Ya',
        cancelText: 'Batal'
      })
    : confirm('Logout?');
  
  if (!confirmLogout) return;
  
  try {
    if (isRecording && mediaRecorder) {
      mediaRecorder.stop();
      clearInterval(recordingInterval);
    }
    
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }
    
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    
    if (videoSessionRef) {
      await videoSessionRef.set(null);
    }
    
    sessionStorage.clear();
    
    if (typeof customSuccess === 'function') {
      await customSuccess('Logout berhasil!', 'Bye!');
    }
    
    setTimeout(() => {
      window.location.replace(`camera-login.html?room=${roomId}`);
    }, 1000);
    
  } catch (error) {
    console.error('Logout error:', error);
    sessionStorage.clear();
    window.location.replace(`camera-login.html?room=${roomId}`);
  }
}

window.logout = logout;
window.stopCamera = stopCamera;

// ========= CLEANUP =========
window.addEventListener('beforeunload', async () => {
  console.log('🔄 Cleanup...');
  
  if (isRecording && mediaRecorder) mediaRecorder.stop();
  if (localStream) localStream.getTracks().forEach(t => t.stop());
  if (peerConnection) peerConnection.close();
  
  if (videoSessionRef) {
    try {
      await videoSessionRef.set(null);
    } catch (e) {}
  }
});

// ========= AUTO-START =========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded');
    setTimeout(initialize, 200);
  });
} else {
  console.log('📄 DOM already loaded');
  setTimeout(initialize, 200);
}

console.log('✅ Video-panel.js loaded');