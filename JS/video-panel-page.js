/*************************************************
 * VIDEO-PANEL.JS - FIXED VERSION
 * ✅ Camera activation fixed
 * ✅ Firebase ready check added
 * ✅ Better error handling
 *************************************************/

// ========= WAIT FOR FIREBASE & ROOM MANAGER =========
let isSystemReady = false;
let roomId = null;
let videoSessionRef = null;

// Wait for dependencies
function waitForDependencies() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      if (window.db && window.RoomManager) {
        clearInterval(checkInterval);
        console.log('✅ Dependencies ready');
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('❌ Dependencies timeout');
        reject(new Error('Dependencies not loaded'));
      }
    }, 100);
  });
}

// ========= WEBRTC CONFIG =========
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// ========= STATE =========
let localStream = null;
let peerConnection = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordingStartTime = null;
let recordingInterval = null;
let currentFacingMode = 'user';
let isCameraActive = false;

// ========= ELEMENTS =========
let localVideo, cameraOverlay, startCameraBtn, stopCameraBtn;
let recordBtn, flipCameraBtn, backBtn, connectionStatus;
let streamingStatus, recordingTime, recordingStatusBar;
let statusDot, recordIcon, recordText;

// ========= INIT =========
async function init() {
  console.log('🎥 Initializing camera panel...');
  
  try {
    // Wait for dependencies
    await waitForDependencies();
    
    // Get elements
    localVideo = document.getElementById('local-video');
    cameraOverlay = document.getElementById('camera-overlay');
    startCameraBtn = document.getElementById('start-camera-btn');
    stopCameraBtn = document.getElementById('stop-camera-btn');
    recordBtn = document.getElementById('record-btn');
    flipCameraBtn = document.getElementById('flip-camera-btn');
    backBtn = document.getElementById('back-btn');
    connectionStatus = document.getElementById('connection-status');
    streamingStatus = document.getElementById('streaming-status');
    recordingTime = document.getElementById('recording-time');
    recordingStatusBar = document.getElementById('recording-status-bar');
    statusDot = document.getElementById('status-dot');
    recordIcon = document.getElementById('record-icon');
    recordText = document.getElementById('record-text');
    
    // Validate elements
    if (!localVideo || !startCameraBtn) {
      throw new Error('Required DOM elements not found');
    }
    
    // Get room ID
    roomId = RoomManager.getRoomId();
    
    if (!roomId) {
      throw new Error('Room ID not found');
    }
    
    console.log('✅ Room ID:', roomId);
    
    // Initialize Firebase reference
    videoSessionRef = db.ref(`karaoke/room/${roomId}/videoSession`);
    console.log('✅ Video session ref initialized');
    
    // Setup event listeners
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    recordBtn.addEventListener('click', toggleRecording);
    flipCameraBtn.addEventListener('click', flipCamera);
    backBtn.addEventListener('click', handleBack);
    
    isSystemReady = true;
    console.log('✅ Camera panel ready');
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    await customError(
      `Gagal menginisialisasi camera panel: ${error.message}`,
      'Initialization Error'
    );
  }
}

// ========= START CAMERA =========
async function startCamera() {
  console.log('📹 Starting camera...');
  
  if (!isSystemReady) {
    await customError('System belum siap. Silakan refresh halaman.', 'System Not Ready');
    return;
  }
  
  try {
    startCameraBtn.disabled = true;
    startCameraBtn.textContent = 'Memulai...';
    
    // Check camera permission
    const permissions = await navigator.permissions.query({ name: 'camera' });
    console.log('📷 Camera permission:', permissions.state);
    
    // Request camera access
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    };
    
    console.log('📹 Requesting media with constraints:', constraints);
    
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('✅ Camera stream obtained');
    console.log('Video tracks:', localStream.getVideoTracks().length);
    console.log('Audio tracks:', localStream.getAudioTracks().length);
    
    // Set video source
    localVideo.srcObject = localStream;
    
    // Hide overlay
    cameraOverlay.classList.add('hidden');
    
    // Update UI
    isCameraActive = true;
    startCameraBtn.style.display = 'none';
    stopCameraBtn.style.display = 'inline-flex';
    recordBtn.disabled = false;
    flipCameraBtn.disabled = false;
    
    connectionStatus.textContent = 'Online';
    statusDot.classList.add('online');
    
    console.log('📡 Setting up WebRTC...');
    
    // Setup WebRTC
    await setupWebRTC();
    
    // Update Firebase status
    await videoSessionRef.child('cameraStatus').set('connected');
    
    streamingStatus.textContent = 'Aktif (Tampil di Display)';
    
    console.log('✅ Camera started and streaming');
    
    await customSuccess(
      'Kamera berhasil diaktifkan dan streaming ke display!',
      '✅ Kamera Aktif'
    );
    
  } catch (error) {
    console.error('❌ Camera error:', error);
    
    let errorMessage = 'Gagal mengakses kamera. ';
    
    if (error.name === 'NotAllowedError') {
      errorMessage += 'Izin kamera ditolak. Silakan izinkan akses kamera di browser.';
    } else if (error.name === 'NotFoundError') {
      errorMessage += 'Kamera tidak ditemukan. Pastikan device memiliki kamera.';
    } else if (error.name === 'NotReadableError') {
      errorMessage += 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain dan coba lagi.';
    } else {
      errorMessage += error.message;
    }
    
    await customError(errorMessage, 'Kamera Error');
    
    // Reset button
    startCameraBtn.disabled = false;
    startCameraBtn.textContent = 'Aktifkan Kamera';
  }
}

// ========= STOP CAMERA =========
async function stopCamera() {
  const result = await customConfirm(
    'Camera akan dimatikan dan tidak tampil di display lagi.',
    {
      title: 'Stop Kamera?',
      icon: '📷',
      confirmText: 'Ya, Stop',
      cancelText: 'Batal'
    }
  );
  
  if (!result) return;
  
  console.log('⏹️ Stopping camera...');
  
  try {
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }
    
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
      localStream = null;
    }
    
    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    
    // Reset video
    localVideo.srcObject = null;
    cameraOverlay.classList.remove('hidden');
    
    // Update UI
    isCameraActive = false;
    startCameraBtn.style.display = 'inline-flex';
    startCameraBtn.disabled = false;
    stopCameraBtn.style.display = 'none';
    recordBtn.disabled = true;
    flipCameraBtn.disabled = true;
    
    connectionStatus.textContent = 'Offline';
    statusDot.classList.remove('online');
    streamingStatus.textContent = 'Tidak Aktif';
    
    // Update Firebase
    if (videoSessionRef) {
      await videoSessionRef.child('cameraStatus').set('disconnected');
      await videoSessionRef.child('offer').remove();
      await videoSessionRef.child('cameraCandidates').remove();
    }
    
    console.log('✅ Camera stopped successfully');
    
  } catch (error) {
    console.error('❌ Error stopping camera:', error);
  }
}

// ========= SETUP WEBRTC =========
async function setupWebRTC() {
  try {
    console.log('📡 Creating peer connection...');
    
    peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
      console.log('➕ Added track to peer:', track.kind);
    });
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        videoSessionRef.child('cameraCandidates').push(event.candidate.toJSON());
        console.log('📤 Sent ICE candidate');
      }
    };
    
    // Handle connection state
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        console.warn('⚠️ Connection lost');
      }
    };
    
    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    console.log('📤 Created offer');
    
    // Send offer to Firebase
    await videoSessionRef.child('offer').set(peerConnection.localDescription.toJSON());
    
    console.log('✅ Offer sent to display');
    
    // Listen for answer
    videoSessionRef.child('answer').on('value', async (snapshot) => {
      if (!snapshot.exists() || peerConnection.currentRemoteDescription) return;
      
      const answer = snapshot.val();
      console.log('📩 Received answer from display');
      
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });
    
    // Listen for ICE candidates from display
    videoSessionRef.child('displayCandidates').on('child_added', async (snapshot) => {
      const candidate = snapshot.val();
      
      if (peerConnection && candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('📥 Added display ICE candidate');
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    });
    
    console.log('✅ WebRTC setup complete');
    
  } catch (error) {
    console.error('❌ WebRTC error:', error);
    throw error;
  }
}

// ========= FLIP CAMERA =========
async function flipCamera() {
  try {
    console.log('🔄 Flipping camera...');
    
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    // Stop current stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Get new stream
    const constraints = {
      video: {
        facingMode: currentFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    };
    
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = localStream;
    
    // Update peer connection tracks
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
    await customError('Gagal membalik kamera: ' + error.message);
  }
}

// ========= TOGGLE RECORDING =========
function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// ========= START RECORDING =========
function startRecording() {
  try {
    console.log('🔴 Starting recording...');
    
    recordedChunks = [];
    
    const options = {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 2500000
    };
    
    // iOS fallback
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm';
    }
    
    mediaRecorder = new MediaRecorder(localStream, options);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      showVideoPreview();
    };
    
    mediaRecorder.start();
    isRecording = true;
    
    // Update UI
    recordBtn.classList.add('recording');
    recordIcon.textContent = '⏹️';
    recordText.textContent = 'Stop Rekam';
    recordingStatusBar.style.display = 'flex';
    
    // Start timer
    recordingStartTime = Date.now();
    recordingInterval = setInterval(updateRecordingTime, 1000);
    
    console.log('✅ Recording started');
    
  } catch (error) {
    console.error('❌ Recording error:', error);
    customError('Gagal memulai rekaman: ' + error.message);
  }
}

// ========= STOP RECORDING =========
function stopRecording() {
  if (mediaRecorder && isRecording) {
    console.log('⏹️ Stopping recording...');
    
    mediaRecorder.stop();
    isRecording = false;
    
    // Update UI
    recordBtn.classList.remove('recording');
    recordIcon.textContent = '⏺️';
    recordText.textContent = 'Mulai Rekam';
    recordingStatusBar.style.display = 'none';
    
    // Stop timer
    clearInterval(recordingInterval);
    recordingTime.textContent = '00:00';
    
    console.log('✅ Recording stopped');
  }
}

// ========= UPDATE RECORDING TIME =========
function updateRecordingTime() {
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  recordingTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ========= SHOW VIDEO PREVIEW =========
async function showVideoPreview() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const videoUrl = URL.createObjectURL(blob);
  
  console.log('💾 Video blob created:', blob.size, 'bytes');
  
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 20px; padding: 30px; max-width: 500px; width: 100%; text-align: center;">
      <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px;">✅ Video Berhasil Direkam!</h2>
      
      <video 
        id="preview-video" 
        controls 
        playsinline
        style="
          width: 100%; 
          border-radius: 12px; 
          margin-bottom: 20px;
          max-height: 300px;
        "
      ></video>
      
      ${isIOS ? `
        <div style="background: #fff3cd; border: 2px solid #fbbf24; border-radius: 12px; padding: 15px; margin-bottom: 20px; text-align: left;">
          <p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold; font-size: 14px;">📱 Cara Simpan di iPhone:</p>
          <ol style="margin: 0; padding-left: 20px; color: #78350f; font-size: 13px; line-height: 1.6;">
            <li>Tap tombol <strong>Play ▶️</strong> di atas</li>
            <li><strong>Tahan</strong> video (long press)</li>
            <li>Pilih <strong>"Save Video"</strong></li>
            <li>Video akan tersimpan di <strong>Photos</strong></li>
          </ol>
        </div>
      ` : `
        <div style="background: #d4edda; border: 2px solid #c3e6cb; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #155724; font-size: 14px;">
            💾 Video siap didownload!
          </p>
        </div>
      `}
      
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        ${!isIOS ? `
          <button 
            id="download-btn" 
            style="
              flex: 1;
              padding: 15px;
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
              color: white;
              border: none;
              border-radius: 12px;
              font-weight: bold;
              cursor: pointer;
              font-size: 16px;
            "
          >
            💾 Download
          </button>
        ` : ''}
        
        <button 
          id="close-preview-btn" 
          style="
            flex: 1;
            padding: 15px;
            background: #f1f5f9;
            color: #64748b;
            border: none;
            border-radius: 12px;
            font-weight: bold;
            cursor: pointer;
            font-size: 16px;
          "
        >
          Tutup
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Set video source
  const previewVideo = document.getElementById('preview-video');
  previewVideo.src = videoUrl;
  
  // Download button
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `karaoke-${roomId}-${Date.now()}.webm`;
      a.click();
      
      customSuccess('Video berhasil didownload!', 'Download Selesai');
    });
  }
  
  // Close button
  document.getElementById('close-preview-btn').addEventListener('click', () => {
    URL.revokeObjectURL(videoUrl);
    modal.remove();
  });
  
  // Auto play for iOS
  if (isIOS) {
    previewVideo.play();
  }
}

// ========= HANDLE BACK =========
async function handleBack(e) {
  e.preventDefault();
  
  if (isCameraActive || isRecording) {
    const result = await customConfirm(
      'Camera sedang aktif. Yakin ingin keluar?',
      {
        title: 'Keluar?',
        icon: '⚠️',
        confirmText: 'Ya, Keluar',
        cancelText: 'Batal'
      }
    );
    
    if (!result) return;
    
    if (isRecording) stopRecording();
    if (isCameraActive) await stopCamera();
  }
  
  window.location.href = `bus-menu.html?room=${roomId}`;
}

// ========= CLEANUP =========
window.addEventListener('beforeunload', async () => {
  console.log('🔄 Page unloading, cleaning up...');
  
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  if (peerConnection) {
    peerConnection.close();
  }
  
  if (videoSessionRef) {
    await videoSessionRef.child('cameraStatus').set('disconnected');
  }
});

// Export for logout
window.stopCamera = stopCamera;

// ========= START INIT =========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('✅ Video-panel.js (FIXED) loaded');