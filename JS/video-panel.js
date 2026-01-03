/*************************************************
 * VIDEO-PANEL.JS - COMPLETE WITH MOBILE DOWNLOAD
 * ✅ Android: Direct download to Gallery
 * ✅ iOS: Save to Photos with instructions
 * ✅ Desktop: Standard download
 *************************************************/

console.log('🎥 ========================================');
console.log('🎥 VIDEO-PANEL.JS LOADING...');
console.log('🎥 ========================================');

// ========= GET ROOM ID IMMEDIATELY =========
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

if (!roomId) {
  console.error('❌ No room ID found!');
  alert('Room ID tidak ditemukan!');
  window.location.href = 'index.html';
  throw new Error('No room ID');
}

console.log('✅ Room ID:', roomId);

// ========= GLOBAL STATE (EXPOSED TO WINDOW) =========
window.videoSessionRef = null;
window.localStream = null;
window.peerConnection = null;
window.mediaRecorder = null;
window.recordedChunks = [];
window.recordingStartTime = null;
window.recordingInterval = null;
window.currentFacingMode = 'user';
window.isCameraActive = false;
window.isRecording = false;

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

// ========= WAIT FOR DEPENDENCIES =========
let dependenciesReady = false;

function checkDependencies() {
  const hasFirebase = typeof window.db !== 'undefined';
  const hasRoomManager = typeof window.RoomManager !== 'undefined';
  
  console.log('🔍 Checking dependencies...');
  console.log('   Firebase DB:', hasFirebase ? '✅' : '❌');
  console.log('   RoomManager:', hasRoomManager ? '✅' : '❌');
  
  if (hasFirebase && hasRoomManager) {
    console.log('✅ All dependencies ready!');
    dependenciesReady = true;
    initializeFirebase();
    return true;
  }
  
  console.log('⏳ Waiting for dependencies...');
  return false;
}

// ========= INITIALIZE FIREBASE =========
function initializeFirebase() {
  try {
    if (!RoomManager.initRoomSystem()) {
      console.error('❌ Room system init failed');
      return false;
    }
    
    window.videoSessionRef = db.ref(`karaoke/room/${roomId}/videoSession`);
    console.log('✅ Firebase reference initialized');
    console.log('   Path:', `karaoke/room/${roomId}/videoSession`);
    return true;
  } catch (error) {
    console.error('❌ Firebase init error:', error);
    return false;
  }
}

// ========= START CAMERA (MAIN FUNCTION) =========
window.startCamera = async function() {
  console.log('');
  console.log('🚀 ========================================');
  console.log('🚀 START CAMERA FUNCTION CALLED!');
  console.log('🚀 ========================================');
  
  const startBtn = document.getElementById('start-camera-btn');
  const overlay = document.getElementById('camera-overlay');
  const video = document.getElementById('local-video');
  
  try {
    // Check dependencies
    if (!dependenciesReady) {
      console.log('⏳ Dependencies not ready, checking now...');
      
      if (startBtn) {
        startBtn.disabled = true;
        startBtn.textContent = 'Menunggu sistem...';
      }
      
      // Wait for dependencies (max 5 seconds)
      let attempts = 0;
      while (!checkDependencies() && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!dependenciesReady) {
        throw new Error('Sistem belum siap. Silakan refresh halaman (F5) dan tunggu beberapa detik.');
      }
    }
    
    console.log('✅ Dependencies ready, proceeding...');
    
    // Update button state
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.textContent = 'Memulai kamera...';
    }
    
    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Browser tidak mendukung kamera!\n\nGunakan browser terbaru:\n- Chrome\n- Firefox\n- Safari\n\nPastikan akses via HTTPS!');
    }
    
    console.log('📱 Requesting camera permission...');
    
    // Request camera access with detailed constraints
    const constraints = {
      video: {
        facingMode: window.currentFacingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    };
    
    console.log('📋 Camera constraints:', constraints);
    
    window.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('✅ ✅ ✅ CAMERA ACCESS GRANTED! ✅ ✅ ✅');
    console.log('   Video tracks:', window.localStream.getVideoTracks().length);
    console.log('   Audio tracks:', window.localStream.getAudioTracks().length);
    
    // Validate video element
    if (!video) {
      throw new Error('Video element tidak ditemukan di halaman!');
    }
    
    console.log('📺 Setting video source...');
    video.srcObject = window.localStream;
    
    // Try to play video
    try {
      await video.play();
      console.log('✅ Video playing successfully');
    } catch (playError) {
      console.warn('⚠️ Auto-play blocked, trying manual play...');
      video.play().catch(e => {
        console.log('Manual play error (can be ignored):', e);
      });
    }
    
    // Hide overlay
    if (overlay) {
      overlay.classList.add('hidden');
      console.log('✅ Overlay hidden');
    }
    
    // Update UI state
    window.isCameraActive = true;
    console.log('✅ Camera active state set to TRUE');
    
    // Update buttons
    if (startBtn) startBtn.style.display = 'none';
    
    const stopBtn = document.getElementById('stop-camera-btn');
    if (stopBtn) {
      stopBtn.style.display = 'inline-flex';
      console.log('✅ Stop button shown');
    }
    
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
      recordBtn.disabled = false;
      console.log('✅ Record button enabled');
    }
    
    const flipBtn = document.getElementById('flip-camera-btn');
    if (flipBtn) {
      flipBtn.disabled = false;
      console.log('✅ Flip button enabled');
    }
    
    // Update status UI
    updateStatusUI('online');
    
    console.log('📡 Setting up WebRTC for streaming...');
    
    // Setup WebRTC
    await setupWebRTC();
    
    // Update Firebase status
    if (window.videoSessionRef) {
      await window.videoSessionRef.child('cameraStatus').set('connected');
      console.log('✅ Firebase status updated: connected');
    }
    
    const streamText = document.getElementById('streaming-status');
    if (streamText) {
      streamText.textContent = 'Aktif (Streaming ke Display)';
      console.log('✅ Streaming status text updated');
    }
    
    console.log('');
    console.log('🎉 ========================================');
    console.log('🎉 CAMERA FULLY ACTIVE & STREAMING!');
    console.log('🎉 ========================================');
    console.log('');
    
    // Success notification
    if (typeof customSuccess === 'function') {
      await customSuccess(
        'Kamera berhasil diaktifkan!\n\n✅ Streaming ke display aktif\n📹 Siap merekam',
        '🎥 Kamera Aktif'
      );
    } else {
      alert('✅ Kamera berhasil diaktifkan dan streaming ke display!');
    }
    
  } catch (error) {
    console.error('');
    console.error('❌ ========================================');
    console.error('❌ CAMERA ERROR!');
    console.error('❌ ========================================');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    console.error('❌ ========================================');
    console.error('');
    
    handleCameraError(error, startBtn);
  }
};

// ========= HANDLE CAMERA ERRORS =========
function handleCameraError(error, startBtn) {
  // Reset button
  if (startBtn) {
    startBtn.disabled = false;
    startBtn.textContent = 'Aktifkan Kamera';
    startBtn.style.display = 'inline-flex';
  }
  
  let message = '❌ Gagal mengakses kamera!\n\n';
  let title = 'Error Kamera';
  
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    title = '🚫 Izin Kamera Ditolak';
    message += 'Anda menolak akses kamera!\n\n';
    message += '✅ CARA MEMPERBAIKI:\n\n';
    message += '1. Klik ikon GEMBOK 🔒 di address bar\n';
    message += '2. Cari "Camera" atau "Kamera"\n';
    message += '3. Ubah dari "Block" ke "Allow"\n';
    message += '4. Refresh halaman (F5)\n';
    message += '5. Klik "Aktifkan Kamera" lagi\n\n';
    message += '💡 Pastikan tidak ada aplikasi lain yang pakai kamera!';
  } 
  else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
    title = '📷 Kamera Tidak Ditemukan';
    message += 'Device ini tidak memiliki kamera!\n\n';
    message += 'Kemungkinan:\n';
    message += '• Device tidak ada kamera built-in\n';
    message += '• Kamera eksternal tidak terpasang\n';
    message += '• Kamera rusak/disabled\n';
    message += '• Driver kamera belum terinstall';
  }
  else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
    title = '⚠️ Kamera Sedang Digunakan';
    message += 'Kamera tidak dapat diakses!\n\n';
    message += '✅ SOLUSI:\n\n';
    message += '1. Tutup aplikasi lain:\n';
    message += '   • Zoom, Skype, Teams\n';
    message += '   • WhatsApp Web, Telegram\n';
    message += '   • Tab browser lain\n\n';
    message += '2. Restart browser\n\n';
    message += '3. Jika masih error, restart komputer';
  }
  else if (error.name === 'OverconstrainedError') {
    title = '⚠️ Resolusi Tidak Didukung';
    message += 'Kamera tidak support resolusi HD!\n\n';
    message += 'Sistem akan coba resolusi lebih rendah...\n\n';
    message += 'Silakan klik "Aktifkan Kamera" lagi.';
  }
  else if (error.message && error.message.includes('sistem')) {
    title = '⚠️ Sistem Belum Siap';
    message += 'Firebase belum selesai loading!\n\n';
    message += '✅ SOLUSI:\n\n';
    message += '1. Refresh halaman (F5)\n';
    message += '2. Tunggu 3-5 detik\n';
    message += '3. Klik "Aktifkan Kamera" lagi\n\n';
    message += 'Jika tetap error:\n';
    message += '• Clear cache browser\n';
    message += '• Restart browser';
  }
  else {
    message += 'Error: ' + error.message + '\n\n';
    message += '✅ SOLUSI UMUM:\n\n';
    message += '1. Refresh halaman (F5)\n';
    message += '2. Gunakan browser terbaru\n';
    message += '3. Pastikan akses via HTTPS\n';
    message += '4. Coba browser lain (Chrome/Firefox)';
  }
  
  // Show error modal
  if (typeof customError === 'function') {
    customError(message, title);
  } else {
    alert(title + '\n\n' + message);
  }
}

// ========= SETUP WEBRTC =========
async function setupWebRTC() {
  try {
    console.log('🔗 Creating peer connection...');
    
    window.peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    window.localStream.getTracks().forEach(track => {
      window.peerConnection.addTrack(track, window.localStream);
      console.log('➕ Added track to peer:', track.kind);
    });
    
    // Handle ICE candidates
    window.peerConnection.onicecandidate = (event) => {
      if (event.candidate && window.videoSessionRef) {
        window.videoSessionRef.child('cameraCandidates').push(event.candidate.toJSON());
        console.log('📤 ICE candidate sent');
      }
    };
    
    // Create and send offer
    const offer = await window.peerConnection.createOffer();
    await window.peerConnection.setLocalDescription(offer);
    
    if (window.videoSessionRef) {
      await window.videoSessionRef.child('offer').set(window.peerConnection.localDescription.toJSON());
      console.log('📤 Offer sent to display');
    }
    
    // Listen for answer
    if (window.videoSessionRef) {
      window.videoSessionRef.child('answer').on('value', async (snapshot) => {
        if (!snapshot.exists() || !window.peerConnection || window.peerConnection.currentRemoteDescription) {
          return;
        }
        
        try {
          const answer = snapshot.val();
          await window.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          console.log('📩 Answer received and set');
        } catch (e) {
          console.error('Error setting remote description:', e);
        }
      });
      
      // Listen for ICE candidates from display
      window.videoSessionRef.child('displayCandidates').on('child_added', async (snapshot) => {
        if (!window.peerConnection || !snapshot.val()) return;
        
        try {
          await window.peerConnection.addIceCandidate(new RTCIceCandidate(snapshot.val()));
          console.log('✅ Display ICE candidate added');
        } catch (e) {
          console.error('Error adding display ICE candidate:', e);
        }
      });
    }
    
    console.log('✅ WebRTC setup complete');
    
  } catch (error) {
    console.error('❌ WebRTC setup error:', error);
  }
}

// ========= UPDATE STATUS UI =========
function updateStatusUI(status) {
  const statusText = document.getElementById('connection-status');
  const statusDot = document.getElementById('status-dot');
  
  if (status === 'online') {
    if (statusText) statusText.textContent = 'Online';
    if (statusDot) statusDot.classList.add('online');
  } else {
    if (statusText) statusText.textContent = 'Offline';
    if (statusDot) statusDot.classList.remove('online');
  }
}

// ========= STOP CAMERA =========
window.stopCamera = async function() {
  console.log('⏹️ Stop camera called');
  
  let confirmed;
  if (typeof customConfirm === 'function') {
    confirmed = await customConfirm(
      'Kamera akan dimatikan dan streaming akan berhenti.\n\nYakin ingin melanjutkan?',
      {
        title: '⏹️ Stop Kamera?',
        confirmText: 'Ya, Stop',
        cancelText: 'Batal'
      }
    );
  } else {
    confirmed = confirm('Stop kamera dan hentikan streaming?');
  }
  
  if (!confirmed) return;
  
  try {
    // Stop recording if active
    if (window.isRecording) {
      stopRecording();
    }
    
    // Stop all tracks
    if (window.localStream) {
      window.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('⏹️ Track stopped:', track.kind);
      });
      window.localStream = null;
    }
    
    // Close peer connection
    if (window.peerConnection) {
      window.peerConnection.close();
      window.peerConnection = null;
      console.log('⏹️ Peer connection closed');
    }
    
    // Clear video
    const video = document.getElementById('local-video');
    if (video) video.srcObject = null;
    
    // Show overlay
    const overlay = document.getElementById('camera-overlay');
    if (overlay) overlay.classList.remove('hidden');
    
    // Update state
    window.isCameraActive = false;
    
    // Update UI
    const startBtn = document.getElementById('start-camera-btn');
    if (startBtn) {
      startBtn.style.display = 'inline-flex';
      startBtn.disabled = false;
      startBtn.textContent = 'Aktifkan Kamera';
    }
    
    const stopBtn = document.getElementById('stop-camera-btn');
    if (stopBtn) stopBtn.style.display = 'none';
    
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) recordBtn.disabled = true;
    
    const flipBtn = document.getElementById('flip-camera-btn');
    if (flipBtn) flipBtn.disabled = true;
    
    updateStatusUI('offline');
    
    const streamText = document.getElementById('streaming-status');
    if (streamText) streamText.textContent = 'Tidak Aktif';
    
    // Clean Firebase
    if (window.videoSessionRef) {
      await window.videoSessionRef.set(null);
      console.log('✅ Firebase session cleared');
    }
    
    console.log('✅ Camera stopped successfully');
    
    if (typeof customSuccess === 'function') {
      await customSuccess('Kamera berhasil dimatikan', '✅ Selesai');
    }
    
  } catch (error) {
    console.error('❌ Stop camera error:', error);
  }
};

// ========= FLIP CAMERA =========
window.flipCamera = async function() {
  console.log('🔄 Flip camera called');
  
  try {
    window.currentFacingMode = window.currentFacingMode === 'user' ? 'environment' : 'user';
    
    if (window.localStream) {
      window.localStream.getTracks().forEach(track => track.stop());
    }
    
    window.localStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: window.currentFacingMode },
      audio: true
    });
    
    const video = document.getElementById('local-video');
    if (video) video.srcObject = window.localStream;
    
    if (window.peerConnection) {
      const senders = window.peerConnection.getSenders();
      
      const videoTrack = window.localStream.getVideoTracks()[0];
      const audioTrack = window.localStream.getAudioTracks()[0];
      
      const videoSender = senders.find(s => s.track?.kind === 'video');
      const audioSender = senders.find(s => s.track?.kind === 'audio');
      
      if (videoSender && videoTrack) await videoSender.replaceTrack(videoTrack);
      if (audioSender && audioTrack) await audioSender.replaceTrack(audioTrack);
    }
    
    console.log('✅ Camera flipped to:', window.currentFacingMode);
    
  } catch (error) {
    console.error('❌ Flip error:', error);
    
    if (typeof customError === 'function') {
      await customError('Gagal membalik kamera: ' + error.message, 'Error');
    } else {
      alert('Gagal flip: ' + error.message);
    }
  }
};

// ========= TOGGLE RECORDING =========
window.toggleRecording = function() {
  if (window.isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
};

// ========= START RECORDING =========
function startRecording() {
  try {
    window.recordedChunks = [];
    
    const options = {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 2500000
    };
    
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm';
    }
    
    window.mediaRecorder = new MediaRecorder(window.localStream, options);
    
    window.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        window.recordedChunks.push(event.data);
      }
    };
    
    window.mediaRecorder.onstop = saveRecording;
    
    window.mediaRecorder.start();
    window.isRecording = true;
    
    const btn = document.getElementById('record-btn');
    if (btn) btn.classList.add('recording');
    
    const icon = document.getElementById('record-icon');
    if (icon) icon.textContent = '⏹️';
    
    const text = document.getElementById('record-text');
    if (text) text.textContent = 'Stop Rekam';
    
    const bar = document.getElementById('recording-status-bar');
    if (bar) bar.style.display = 'flex';
    
    window.recordingStartTime = Date.now();
    window.recordingInterval = setInterval(updateRecordingTime, 1000);
    
    console.log('🔴 Recording started');
    
  } catch (error) {
    console.error('❌ Recording error:', error);
    alert('Gagal memulai rekaman: ' + error.message);
  }
}

// ========= STOP RECORDING =========
function stopRecording() {
  if (window.mediaRecorder && window.isRecording) {
    window.mediaRecorder.stop();
    window.isRecording = false;
    
    const btn = document.getElementById('record-btn');
    if (btn) btn.classList.remove('recording');
    
    const icon = document.getElementById('record-icon');
    if (icon) icon.textContent = '⏺️';
    
    const text = document.getElementById('record-text');
    if (text) text.textContent = 'Mulai Rekam';
    
    const bar = document.getElementById('recording-status-bar');
    if (bar) bar.style.display = 'none';
    
    const time = document.getElementById('recording-time');
    if (time) time.textContent = '00:00';
    
    clearInterval(window.recordingInterval);
    
    console.log('⏹️ Recording stopped');
  }
}

// ========= UPDATE RECORDING TIME =========
function updateRecordingTime() {
  const elapsed = Math.floor((Date.now() - window.recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  const time = document.getElementById('recording-time');
  if (time) {
    time.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

// ========= SAVE RECORDING (MOBILE-FRIENDLY WITH MP4 CONVERSION) =========
async function saveRecording() {
  console.log('💾 Saving recording...');
  
  const blob = new Blob(window.recordedChunks, { type: 'video/webm' });
  
  console.log('📦 Original blob:', {
    size: (blob.size / 1024 / 1024).toFixed(2) + ' MB',
    type: blob.type
  });
  
  // ========= DETECT DEVICE =========
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;
  
  console.log('📱 Device detection:', {
    isIOS,
    isAndroid,
    isMobile
  });
  
  // ========= iOS HANDLING (TETAP SAMA) =========
  if (isIOS) {
    console.log('🍎 iOS detected - using special handling');
    
    const url = URL.createObjectURL(blob);
    const filename = `karaoke-${roomId}-${Date.now()}.webm`;
    
    const newWindow = window.open('', '_blank');
    
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Save Video - Karaoke Bus</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              padding: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container { max-width: 500px; width: 100%; text-align: center; }
            h1 { font-size: 28px; margin-bottom: 10px; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
            .subtitle { font-size: 14px; margin-bottom: 25px; opacity: 0.9; }
            .instructions {
              background: rgba(255, 255, 255, 0.95);
              border-radius: 20px;
              padding: 25px;
              margin-bottom: 25px;
              text-align: left;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .instructions h2 {
              font-size: 20px;
              margin-bottom: 15px;
              color: #667eea;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .instructions ol { padding-left: 20px; color: #333; }
            .instructions li { margin-bottom: 15px; line-height: 1.8; font-size: 16px; }
            .instructions strong { color: #667eea; font-weight: 700; }
            .step-number {
              display: inline-block;
              width: 28px;
              height: 28px;
              background: #667eea;
              color: white;
              border-radius: 50%;
              text-align: center;
              line-height: 28px;
              font-weight: bold;
              margin-right: 8px;
              font-size: 14px;
            }
            video {
              width: 100%;
              max-width: 500px;
              border-radius: 20px;
              box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
              margin-bottom: 25px;
              border: 4px solid rgba(255,255,255,0.3);
            }
            .button {
              display: inline-block;
              padding: 16px 32px;
              background: rgba(255,255,255,0.95);
              color: #667eea;
              text-decoration: none;
              border-radius: 15px;
              font-weight: 700;
              font-size: 17px;
              box-shadow: 0 8px 25px rgba(0,0,0,0.2);
              margin-top: 20px;
            }
            .info {
              margin-top: 25px;
              padding: 18px;
              background: rgba(255, 193, 7, 0.2);
              backdrop-filter: blur(10px);
              border-radius: 15px;
              font-size: 15px;
              border: 2px solid rgba(255, 193, 7, 0.4);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>💾 Video Rekaman Karaoke</h1>
            <p class="subtitle">Ikuti langkah di bawah untuk menyimpan video</p>
            
            <div class="instructions">
              <h2>📱 Cara Simpan ke Foto (iPhone/iPad):</h2>
              <ol>
                <li><span class="step-number">1</span><strong>Tekan dan tahan</strong> video (2-3 detik)</li>
                <li><span class="step-number">2</span>Tunggu muncul <strong>menu popup</strong></li>
                <li><span class="step-number">3</span>Pilih <strong>"Save Video"</strong></li>
                <li><span class="step-number">4</span>Video tersimpan ke <strong>Photos</strong> 📸</li>
              </ol>
            </div>
            
            <video src="${url}" controls playsinline></video>
            
            <a href="${url}" download="${filename}" class="button">
              📥 Download Video
            </a>
            
            <div class="info">
              ⚠️ Jika tombol tidak bekerja, gunakan cara "tekan dan tahan" di atas.
            </div>
          </div>
        </body>
        </html>
      `);
      
      console.log('✅ iOS instruction page opened');
      
      if (typeof customSuccess === 'function') {
        customSuccess(
          'Video dibuka di tab baru!\n\n📱 CARA SIMPAN:\n\n1. TEKAN DAN TAHAN video (2-3 detik)\n2. Pilih "Save Video"\n3. Video tersimpan ke Photos 📸',
          '🍎 iPhone/iPad'
        );
      }
    } else {
      if (typeof customWarning === 'function') {
        customWarning('Browser memblokir popup!\n\nIzinkan popup di pengaturan browser.', '⚠️ Popup Diblokir');
      }
    }
    
    return;
  }
  
  // ========= ANDROID & DESKTOP - CONVERT TO MP4 =========
  console.log('🤖 Android/Desktop detected - Converting to MP4...');
  
  // Show loading
  let loadingModal;
  if (typeof customAlert === 'function') {
    // Show conversion progress (non-blocking)
    console.log('⏳ Converting video to MP4...');
  }
  
  try {
    // Create video element for conversion
    const videoElement = document.createElement('video');
    videoElement.src = URL.createObjectURL(blob);
    videoElement.muted = true;
    
    await new Promise((resolve, reject) => {
      videoElement.onloadedmetadata = resolve;
      videoElement.onerror = reject;
    });
    
    console.log('✅ Video metadata loaded');
    console.log('   Duration:', videoElement.duration, 'seconds');
    console.log('   Size:', videoElement.videoWidth, 'x', videoElement.videoHeight);
    
    // Create canvas for frame extraction
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Setup MediaRecorder with MP4 (H.264)
    const stream = canvas.captureStream(30); // 30 FPS
    
    // Add audio track
    const audioContext = new AudioContext();
    const audioSource = audioContext.createMediaElementSource(videoElement);
    const audioDestination = audioContext.createMediaStreamDestination();
    audioSource.connect(audioDestination);
    audioSource.connect(audioContext.destination);
    
    const audioTrack = audioDestination.stream.getAudioTracks()[0];
    if (audioTrack) {
      stream.addTrack(audioTrack);
    }
    
    // Try MP4 format (H.264) - Android native
    let mimeType = 'video/mp4';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      // Fallback to WebM if MP4 not supported
      mimeType = 'video/webm;codecs=h264';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }
    
    console.log('🎬 Using mime type:', mimeType);
    
    const mp4Recorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecondPerPixel: 0.1
    });
    
    const mp4Chunks = [];
    
    mp4Recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        mp4Chunks.push(e.data);
      }
    };
    
    mp4Recorder.onstop = () => {
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const mp4Blob = new Blob(mp4Chunks, { type: mimeType });
      const mp4Url = URL.createObjectURL(mp4Blob);
      const filename = `karaoke-${roomId}-${Date.now()}.${extension}`;
      
      console.log('✅ Conversion complete!');
      console.log('   Final size:', (mp4Blob.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('   Format:', extension.toUpperCase());
      
      // Download the file
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = mp4Url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(mp4Url);
        audioContext.close();
      }, 100);
      
      // Show success message
      let message = 'Video berhasil disimpan!';
      let details = '';
      
      if (isAndroid) {
        if (extension === 'mp4') {
          details = '\n\n✅ VIDEO FORMAT MP4\n\n';
          details += '📸 Video akan OTOMATIS muncul di GALERI dalam beberapa detik!\n\n';
          details += '📂 Lokasi:\n';
          details += '• Aplikasi Gallery/Photos\n';
          details += '• Folder "Downloads" atau "Camera"\n\n';
          details += '💡 Jika belum muncul:\n';
          details += '1. Tunggu 10-30 detik\n';
          details += '2. Tutup dan buka ulang aplikasi Gallery\n';
          details += '3. Atau cek di Files → Downloads';
        } else {
          details = '\n\n⚠️ VIDEO FORMAT WEBM\n\n';
          details += '📂 Lokasi: Files → Downloads\n\n';
          details += 'Cara pindah ke Gallery:\n';
          details += '1. Buka Files → Downloads\n';
          details += '2. Tap video → Share\n';
          details += '3. Pilih "Save to Gallery"';
        }
      } else {
        details = '\n\n💾 Lokasi: Folder Downloads';
      }
      
      if (typeof customSuccess === 'function') {
        customSuccess(message + details, '✅ Video Tersimpan');
      } else {
        alert('✅ ' + message + details);
      }
    };
    
    // Start recording
    mp4Recorder.start();
    videoElement.play();
    
    // Draw frames
    const drawFrame = () => {
      if (!videoElement.paused && !videoElement.ended) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      }
    };
    
    drawFrame();
    
    // Stop when video ends
    videoElement.onended = () => {
      mp4Recorder.stop();
      console.log('🏁 Recording finished');
    };
    
  } catch (error) {
    console.error('❌ Conversion error:', error);
    
    // Fallback to original WebM
    console.log('⚠️ Falling back to WebM download');
    
    const url = URL.createObjectURL(blob);
    const filename = `karaoke-${roomId}-${Date.now()}.webm`;
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    if (typeof customWarning === 'function') {
      customWarning(
        'Video disimpan dalam format WebM.\n\n📂 Lokasi: Files → Downloads\n\nGunakan app "Video Converter" untuk convert ke MP4 agar masuk Gallery.',
        '⚠️ Format WebM'
      );
    } else {
      alert('⚠️ Video disimpan sebagai WebM di folder Downloads.\n\nGunakan Video Converter untuk pindah ke Gallery.');
    }
  }
}

// ========= LOGOUT =========
window.logout = async function() {
  console.log('🚪 Logout called');
  
  let confirmed;
  if (typeof customConfirm === 'function') {
    confirmed = await customConfirm(
      'Logout dari Camera Panel?\n\nAnda perlu login kembali untuk mengakses panel ini.',
      {
        title: '🚪 Logout?',
        confirmText: 'Ya, Logout',
        cancelText: 'Batal',
        confirmClass: 'custom-modal-btn-danger'
      }
    );
  } else {
    confirmed = confirm('Logout dari Camera Panel?');
  }
  
  if (!confirmed) return;
  
  try {
    if (window.isCameraActive) {
      if (window.isRecording) stopRecording();
      
      if (window.localStream) {
        window.localStream.getTracks().forEach(t => t.stop());
        window.localStream = null;
      }
      
      if (window.peerConnection) {
        window.peerConnection.close();
        window.peerConnection = null;
      }
      
      if (window.videoSessionRef) {
        await window.videoSessionRef.set(null);
      }
    }
    
    sessionStorage.clear();
    
    if (typeof customSuccess === 'function') {
      await customSuccess('Logout berhasil!', '👋 Sampai Jumpa!');
    }
    
    setTimeout(() => {
      window.location.replace(`camera-login.html?room=${roomId}`);
    }, 1000);
    
  } catch (error) {
    console.error('Logout error:', error);
    sessionStorage.clear();
    window.location.replace(`camera-login.html?room=${roomId}`);
  }
};

// ========= CLEANUP ON PAGE UNLOAD =========
window.addEventListener('beforeunload', () => {
  if (window.isRecording && window.mediaRecorder) {
    window.mediaRecorder.stop();
  }
  
  if (window.localStream) {
    window.localStream.getTracks().forEach(track => track.stop());
  }
  
  if (window.peerConnection) {
    window.peerConnection.close();
  }
  
  if (window.videoSessionRef) {
    window.videoSessionRef.set(null).catch(() => {});
  }
});

// ========= AUTO-CHECK DEPENDENCIES =========
setTimeout(() => {
  console.log('🔄 Auto-checking dependencies...');
  checkDependencies();
}, 500);

console.log('');
console.log('✅ ========================================');
console.log('✅ VIDEO-PANEL.JS FULLY LOADED!');
console.log('✅ WITH MOBILE DOWNLOAD SUPPORT');
console.log('✅ ========================================');
console.log('✅ Functions exposed to window:');
console.log('   - window.startCamera');
console.log('   - window.stopCamera');
console.log('   - window.flipCamera');
console.log('   - window.toggleRecording');
console.log('   - window.logout');
console.log('✅ ========================================');
console.log('');