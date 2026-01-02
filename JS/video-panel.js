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

// ========= STOP CAMERA (FIXED - DEEP CLEANUP) =========
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
  
  console.log('⏹️ Stopping camera with deep cleanup...');
  
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
    
    // Close peer connection FIRST
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
      console.log('🔌 Peer connection closed');
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
    
    // ✅ CRITICAL: Complete Firebase cleanup
    if (videoSessionRef) {
      console.log('🧹 Deep cleaning Firebase session...');
      
      // Remove ALL session data
      await videoSessionRef.set(null);
      
      console.log('✅ Firebase session completely cleared');
    }
    
    console.log('✅ Camera stopped successfully');
    
    await customSuccess(
      'Kamera berhasil dimatikan. Anda bisa mengaktifkan kembali kapan saja.',
      '✅ Kamera Dimatikan'
    );
    
  } catch (error) {
    console.error('❌ Error stopping camera:', error);
    await customError('Terjadi kesalahan saat mematikan kamera.');
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

// ========= SHOW VIDEO PREVIEW (IMPROVED FOR iOS) =========
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
    overflow-y: auto;
  `;
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 20px; padding: 30px; max-width: 500px; width: 100%; text-align: center;">
      <h2 style="margin: 0 0 15px 0; color: #333; font-size: 24px;">✅ Video Berhasil Direkam!</h2>
      <p style="margin: 0 0 20px 0; color: #64748b; font-size: 14px;">
        Durasi: <strong id="video-duration-text">Loading...</strong>
      </p>
      
      <video 
        id="preview-video" 
        controls 
        playsinline
        controlsList="nodownload"
        style="
          width: 100%; 
          border-radius: 12px; 
          margin-bottom: 20px;
          max-height: 300px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        "
      ></video>
      
      ${isIOS ? `
        <!-- iOS Instructions -->
        <div style="background: linear-gradient(135deg, #fff3cd 0%, #fef3c7 100%); border: 3px solid #fbbf24; border-radius: 15px; padding: 20px; margin-bottom: 20px; text-align: left; box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
            <span style="font-size: 32px;">📱</span>
            <h3 style="margin: 0; color: #92400e; font-size: 18px; font-weight: bold;">Cara Simpan ke iPhone Photos:</h3>
          </div>
          
          <div style="background: white; border-radius: 12px; padding: 15px; margin-bottom: 15px;">
            <ol style="margin: 0; padding-left: 20px; color: #78350f; font-size: 14px; line-height: 2;">
              <li>Tap tombol <strong style="color: #92400e; background: #fef3c7; padding: 2px 8px; border-radius: 4px;">▶️ PUTAR VIDEO</strong> di bawah</li>
              <li><strong style="color: #dc2626;">PENTING:</strong> Tahan jari pada <strong style="color: #92400e; text-decoration: underline;">AREA VIDEO yang SEDANG DIPUTAR</strong> (bukan area putih di sekitarnya)</li>
              <li>Tunggu 1-2 detik, akan muncul menu popup iOS</li>
              <li>Pilih <strong style="color: #92400e; background: #fef3c7; padding: 2px 8px; border-radius: 4px;">"Save Video"</strong> atau <strong>"Download Video"</strong></li>
              <li>Video otomatis tersimpan di <strong style="color: #92400e;">📸 Photos App</strong></li>
            </ol>
          </div>
          
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
            <p style="margin: 0; color: #7f1d1d; font-size: 13px; line-height: 1.6;">
              <strong>⚠️ PERHATIAN:</strong> Jangan long press di luar video player! Long press harus tepat di tengah video yang sedang diputar, bukan di area putih atau border.
            </p>
          </div>
          
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 8px;">
            <p style="margin: 0; color: #1e3a8a; font-size: 13px; line-height: 1.6;">
              <strong>💡 Tips:</strong> Kalau muncul menu "Copy Link" atau "Open in New Tab", berarti Anda long press di tempat yang salah. Coba lagi tepat di <strong>tengah-tengah video</strong>.
            </p>
          </div>
        </div>
        
        <!-- Big Play Button with Visual Guide -->
        <button 
          id="ios-save-guide-btn"
          style="
            width: 100%;
            padding: 20px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            border: none;
            border-radius: 15px;
            font-weight: bold;
            cursor: pointer;
            font-size: 18px;
            margin-bottom: 15px;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            position: relative;
          "
        >
          <span style="font-size: 28px;">▶️</span>
          <span>PUTAR VIDEO</span>
        </button>
        
        <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #166534; font-size: 13px; line-height: 1.6; text-align: center;">
            <strong>👆 Setelah video diputar di atas</strong><br>
            <strong style="font-size: 16px; color: #15803d;">TAHAN JARI DI TENGAH VIDEO</strong><br>
            <span style="font-size: 12px; color: #16a34a;">Tunggu 1-2 detik untuk muncul menu "Save Video"</span>
          </p>
        </div>
      ` : `
        <!-- Android/Desktop Download -->
        <div style="background: #d4edda; border: 2px solid #c3e6cb; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #155724; font-size: 14px;">
            💾 Klik tombol download di bawah untuk menyimpan video!
          </p>
        </div>
        
        <button 
          id="download-btn" 
          style="
            width: 100%;
            padding: 18px;
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            color: white;
            border: none;
            border-radius: 15px;
            font-weight: bold;
            cursor: pointer;
            font-size: 18px;
            margin-bottom: 15px;
            box-shadow: 0 4px 15px rgba(67, 233, 123, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          "
        >
          <span style="font-size: 24px;">💾</span>
          <span>Download Video</span>
        </button>
      `}
      
      <button 
        id="close-preview-btn" 
        style="
          width: 100%;
          padding: 15px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          font-size: 16px;
        "
      >
        ✖️ Tutup
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Get video element
  const previewVideo = document.getElementById('preview-video');
  previewVideo.src = videoUrl;
  
  // Show duration when loaded
  previewVideo.addEventListener('loadedmetadata', () => {
    const duration = previewVideo.duration;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    document.getElementById('video-duration-text').textContent = 
      `${minutes}:${String(seconds).padStart(2, '0')}`;
  });
  
  // iOS Save Guide Button
  const iosSaveGuideBtn = document.getElementById('ios-save-guide-btn');
  if (iosSaveGuideBtn) {
    iosSaveGuideBtn.addEventListener('click', async () => {
      try {
        // Play video
        await previewVideo.play();
        
        // Show success message with animation
        iosSaveGuideBtn.innerHTML = `
          <span style="font-size: 28px;">✅</span>
          <span>VIDEO DIPUTAR! Sekarang Long Press di TENGAH Video</span>
        `;
        iosSaveGuideBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        iosSaveGuideBtn.style.animation = 'pulse 1.5s infinite';
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4); }
            50% { transform: scale(1.03); box-shadow: 0 6px 25px rgba(34, 197, 94, 0.6); }
          }
        `;
        document.head.appendChild(style);
        
        // Show visual indicator on video
        const indicator = document.createElement('div');
        indicator.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(34, 197, 94, 0.9);
          color: white;
          padding: 20px 30px;
          border-radius: 15px;
          font-size: 18px;
          font-weight: bold;
          pointer-events: none;
          z-index: 1000;
          animation: fadeInOut 3s forwards;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
        `;
        indicator.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 40px; margin-bottom: 10px;">👇</div>
            <div>TAHAN JARI DI SINI</div>
            <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">1-2 detik untuk menu</div>
          </div>
        `;
        
        // Add fade animation
        const fadeStyle = document.createElement('style');
        fadeStyle.textContent = `
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
        `;
        document.head.appendChild(fadeStyle);
        
        // Add indicator to video container
        const videoContainer = previewVideo.parentElement;
        videoContainer.style.position = 'relative';
        videoContainer.appendChild(indicator);
        
        // Remove indicator after animation
        setTimeout(() => {
          indicator.remove();
        }, 3000);
        
        // Reset button after 8 seconds
        setTimeout(() => {
          iosSaveGuideBtn.innerHTML = `
            <span style="font-size: 28px;">▶️</span>
            <span>PUTAR VIDEO</span>
          `;
          iosSaveGuideBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
          iosSaveGuideBtn.style.animation = 'none';
        }, 8000);
        
      } catch (error) {
        console.error('Play error:', error);
        
        // Show error message
        iosSaveGuideBtn.innerHTML = `
          <span style="font-size: 28px;">⚠️</span>
          <span>Tap Video Player untuk Mulai</span>
        `;
        iosSaveGuideBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        setTimeout(() => {
          iosSaveGuideBtn.innerHTML = `
            <span style="font-size: 28px;">▶️</span>
            <span>PUTAR VIDEO</span>
          `;
          iosSaveGuideBtn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
        }, 3000);
      }
    });
  }
  
  // Download button (Android/Desktop)
  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `karaoke-${roomId}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      customSuccess('Video berhasil didownload!', 'Download Selesai');
      
      // Change button text
      downloadBtn.innerHTML = `
        <span style="font-size: 24px;">✅</span>
        <span>Video Terdownload!</span>
      `;
      downloadBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
      downloadBtn.disabled = true;
    });
  }
  
  // Close button
  document.getElementById('close-preview-btn').addEventListener('click', () => {
    URL.revokeObjectURL(videoUrl);
    modal.remove();
  });
  
  // Auto play for easier saving on iOS
  if (isIOS) {
    setTimeout(() => {
      previewVideo.play().catch(err => {
        console.log('Auto play blocked, user needs to interact first');
      });
    }, 500);
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

// ========= LOGOUT FUNCTION (SIMPLIFIED & ROBUST) =========
async function logout() {
  console.log('🚪 Logout function called');
  
  // Simple confirmation without customConfirm (in case it's not ready)
  const confirmed = confirm('Anda akan keluar dari Camera Panel. Kamera akan dimatikan dan Anda perlu login kembali.\n\nLanjutkan?');
  
  if (!confirmed) {
    console.log('❌ Logout cancelled by user');
    return;
  }
  
  console.log('✅ User confirmed logout, cleaning up...');
  
  try {
    // Stop recording if active
    if (isRecording) {
      console.log('🛑 Stopping recording...');
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      isRecording = false;
      clearInterval(recordingInterval);
    }
    
    // Stop camera if active
    if (isCameraActive || localStream) {
      console.log('🛑 Stopping camera...');
      
      // Stop all media tracks
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
        console.log('🔌 Peer connection closed');
      }
      
      // Reset video element
      if (localVideo) {
        localVideo.srcObject = null;
      }
    }
    
    // Clean up Firebase session completely
    if (videoSessionRef) {
      console.log('🧹 Cleaning Firebase session...');
      try {
        await videoSessionRef.set(null);
        console.log('✅ Firebase session cleared');
      } catch (fbError) {
        console.error('⚠️ Firebase cleanup error:', fbError);
        // Continue anyway
      }
    }
    
    // Clear authentication
    console.log('🗑️ Clearing session storage...');
    sessionStorage.removeItem(`camera_auth_${roomId}`);
    sessionStorage.removeItem(`camera_token_${roomId}`);
    sessionStorage.removeItem(`camera_login_time_${roomId}`);
    sessionStorage.removeItem(`camera_last_activity_${roomId}`);
    
    console.log('✅ Logout cleanup complete');
    
    // Show success message (fallback to alert if customSuccess not ready)
    if (typeof customSuccess === 'function') {
      await customSuccess('Logout berhasil! Redirecting...', '👋 Sampai Jumpa!');
    } else {
      alert('✅ Logout berhasil!');
    }
    
    // Redirect to login
    console.log('🔄 Redirecting to login page...');
    setTimeout(() => {
      window.location.replace(`camera-login.html?room=${roomId}`);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    
    // Force logout anyway
    alert('⚠️ Terjadi kesalahan saat logout, tapi akan tetap keluar.');
    
    // Force clear session
    sessionStorage.clear();
    
    // Force redirect
    setTimeout(() => {
      window.location.replace(`camera-login.html?room=${roomId}`);
    }, 500);
  }
}

// Export functions globally (CRITICAL!)
window.logout = logout;
window.stopCamera = stopCamera;

// ========= ENHANCED CLEANUP ON PAGE UNLOAD =========
window.addEventListener('beforeunload', async () => {
  console.log('🔄 Page unloading, performing deep cleanup...');
  
  // Stop recording
  if (isRecording && mediaRecorder) {
    mediaRecorder.stop();
  }
  
  // Stop all media tracks
  if (localStream) {
    localStream.getTracks().forEach(track => {
      track.stop();
      console.log('🛑 Force stopped track:', track.kind);
    });
  }
  
  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
  }
  
  // Clean up Firebase session completely
  if (videoSessionRef) {
    try {
      await videoSessionRef.child('cameraStatus').set('disconnected');
      await videoSessionRef.child('offer').remove();
      await videoSessionRef.child('answer').remove();
      await videoSessionRef.child('cameraCandidates').remove();
      await videoSessionRef.child('displayCandidates').remove();
      console.log('✅ Firebase session cleaned');
    } catch (e) {
      console.error('❌ Firebase cleanup error:', e);
    }
  }
});

// ========= CLEANUP ON PAGE HIDE (Mobile Safari) =========
window.addEventListener('pagehide', async () => {
  console.log('📱 Page hidden, cleaning up for mobile...');
  
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  if (peerConnection) {
    peerConnection.close();
  }
  
  if (videoSessionRef) {
    try {
      await videoSessionRef.set(null); // Clear entire session
    } catch (e) {
      console.error('Cleanup error:', e);
    }
  }
});

// ========= VISIBILITY CHANGE HANDLER =========
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('📄 Page hidden');
    // Optional: pause camera when tab is hidden
  } else {
    console.log('📄 Page visible');
    // Optional: resume camera when tab is visible
  }
});

// ========= START INIT =========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('✅ Video-panel.js (FIXED - Logout & Cleanup) loaded');