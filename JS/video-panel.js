/*************************************************
 * VIDEO-PANEL.JS - iOS Compatible Recording
 * ✅ Show video preview after recording
 * ✅ User can save manually (iOS friendly)
 *************************************************/

// ========= GET ROOM ID =========
const roomId = RoomManager.getRoomId();

if (!roomId) {
  alert('Room ID tidak ditemukan!');
  window.location.href = 'index.html';
}

// ========= ELEMENTS =========
const localVideo = document.getElementById('local-video');
const cameraOverlay = document.getElementById('camera-overlay');
const startCameraBtn = document.getElementById('start-camera-btn');
const stopCameraBtn = document.getElementById('stop-camera-btn');
const recordBtn = document.getElementById('record-btn');
const flipCameraBtn = document.getElementById('flip-camera-btn');
const backBtn = document.getElementById('back-btn');
const connectionStatus = document.getElementById('connection-status');
const streamingStatus = document.getElementById('streaming-status');
const recordingTime = document.getElementById('recording-time');
const recordingStatusBar = document.getElementById('recording-status-bar');
const statusDot = document.getElementById('status-dot');
const recordIcon = document.getElementById('record-icon');
const recordText = document.getElementById('record-text');

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
let videoSessionRef = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let recordingStartTime = null;
let recordingInterval = null;
let currentFacingMode = 'user';
let isCameraActive = false;

// ========= INIT =========
function init() {
  console.log('🎥 Initializing camera panel...');
  
  videoSessionRef = db.ref(`karaoke/room/${roomId}/videoSession`);
  
  // Event listeners
  startCameraBtn.addEventListener('click', startCamera);
  stopCameraBtn.addEventListener('click', stopCamera);
  recordBtn.addEventListener('click', toggleRecording);
  flipCameraBtn.addEventListener('click', flipCamera);
  backBtn.addEventListener('click', handleBack);
  
  console.log('✅ Camera panel ready');
}

// ========= START CAMERA =========
async function startCamera() {
  try {
    startCameraBtn.disabled = true;
    startCameraBtn.textContent = 'Memulai...';
    
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
    
    cameraOverlay.classList.add('hidden');
    
    isCameraActive = true;
    startCameraBtn.style.display = 'none';
    stopCameraBtn.style.display = 'inline-flex';
    recordBtn.disabled = false;
    flipCameraBtn.disabled = false;
    
    connectionStatus.textContent = 'Online';
    statusDot.classList.add('online');
    
    await setupWebRTC();
    await videoSessionRef.child('cameraStatus').set('connected');
    
    streamingStatus.textContent = 'Aktif (Tampil di Display)';
    
    console.log('✅ Camera started and streaming');
    
  } catch (error) {
    console.error('❌ Camera error:', error);
    await customError('Gagal mengakses kamera: ' + error.message);
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
  
  if (isRecording) {
    stopRecording();
  }
  
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  localVideo.srcObject = null;
  cameraOverlay.classList.remove('hidden');
  
  isCameraActive = false;
  startCameraBtn.style.display = 'inline-flex';
  stopCameraBtn.style.display = 'none';
  recordBtn.disabled = true;
  flipCameraBtn.disabled = true;
  
  connectionStatus.textContent = 'Offline';
  statusDot.classList.remove('online');
  streamingStatus.textContent = 'Tidak Aktif';
  
  await videoSessionRef.child('cameraStatus').set('disconnected');
  await videoSessionRef.child('offer').remove();
  await videoSessionRef.child('cameraCandidates').remove();
  
  console.log('⏹️ Camera stopped');
}

// ========= SETUP WEBRTC =========
async function setupWebRTC() {
  try {
    peerConnection = new RTCPeerConnection(configuration);
    
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
    
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        videoSessionRef.child('cameraCandidates').push(event.candidate.toJSON());
      }
    };
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await videoSessionRef.child('offer').set(peerConnection.localDescription.toJSON());
    
    console.log('📤 Offer sent to display');
    
    videoSessionRef.child('answer').on('value', async (snapshot) => {
      if (!snapshot.exists() || peerConnection.currentRemoteDescription) return;
      
      const answer = snapshot.val();
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    });
    
    videoSessionRef.child('displayCandidates').on('child_added', async (snapshot) => {
      const candidate = snapshot.val();
      
      if (peerConnection && candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    });
    
  } catch (error) {
    console.error('❌ WebRTC error:', error);
  }
}

// ========= FLIP CAMERA =========
async function flipCamera() {
  try {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
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
    
    if (peerConnection) {
      const senders = peerConnection.getSenders();
      const videoSender = senders.find(s => s.track?.kind === 'video');
      const audioSender = senders.find(s => s.track?.kind === 'audio');
      
      if (videoSender) {
        videoSender.replaceTrack(localStream.getVideoTracks()[0]);
      }
      
      if (audioSender) {
        audioSender.replaceTrack(localStream.getAudioTracks()[0]);
      }
    }
    
    console.log('🔄 Camera flipped');
    
  } catch (error) {
    console.error('❌ Flip error:', error);
    await customError('Gagal membalik kamera');
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
    
    recordBtn.classList.add('recording');
    recordIcon.textContent = '⏹️';
    recordText.textContent = 'Stop Rekam';
    recordingStatusBar.style.display = 'flex';
    
    recordingStartTime = Date.now();
    recordingInterval = setInterval(updateRecordingTime, 1000);
    
    console.log('🔴 Recording started');
    
  } catch (error) {
    console.error('❌ Recording error:', error);
    customError('Gagal memulai rekaman: ' + error.message);
  }
}

// ========= STOP RECORDING =========
function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    
    recordBtn.classList.remove('recording');
    recordIcon.textContent = '⏺️';
    recordText.textContent = 'Mulai Rekam';
    recordingStatusBar.style.display = 'none';
    
    clearInterval(recordingInterval);
    recordingTime.textContent = '00:00';
    
    console.log('⏹️ Recording stopped');
  }
}

// ========= UPDATE RECORDING TIME =========
function updateRecordingTime() {
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  recordingTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ========= 📱 iOS COMPATIBLE: SHOW VIDEO PREVIEW =========
async function showVideoPreview() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const videoUrl = URL.createObjectURL(blob);
  
  console.log('💾 Video blob created:', blob.size, 'bytes');
  
  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Create modal with video preview
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
  
  // Download button (non-iOS)
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
  
  console.log('✅ Video preview displayed');
  
  // Auto play for easier saving on iOS
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
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  if (peerConnection) {
    peerConnection.close();
  }
  
  await videoSessionRef.child('cameraStatus').set('disconnected');
});

// ========= START =========
init();

console.log('✅ Video-panel.js loaded (iOS Compatible)');