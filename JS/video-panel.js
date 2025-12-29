/*************************************************
 * VIDEO-PANEL.JS - Admin Camera Panel with Recording
 * Stream ke Display + Record ke Device
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
    
    // Get camera stream
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
    
    // Setup WebRTC
    await setupWebRTC();
    
    // Update Firebase status
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
  
  // Stop recording if active
  if (isRecording) {
    stopRecording();
  }
  
  // Stop camera stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  
  // Close peer connection
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  // Clear video
  localVideo.srcObject = null;
  
  // Show overlay
  cameraOverlay.classList.remove('hidden');
  
  // Update UI
  isCameraActive = false;
  startCameraBtn.style.display = 'inline-flex';
  stopCameraBtn.style.display = 'none';
  recordBtn.disabled = true;
  flipCameraBtn.disabled = true;
  
  connectionStatus.textContent = 'Offline';
  statusDot.classList.remove('online');
  streamingStatus.textContent = 'Tidak Aktif';
  
  // Update Firebase
  await videoSessionRef.child('cameraStatus').set('disconnected');
  await videoSessionRef.child('offer').remove();
  await videoSessionRef.child('cameraCandidates').remove();
  
  console.log('⏹️ Camera stopped');
}

// ========= SETUP WEBRTC =========
async function setupWebRTC() {
  try {
    peerConnection = new RTCPeerConnection(configuration);
    
    // Add tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        videoSessionRef.child('cameraCandidates').push(event.candidate.toJSON());
      }
    };
    
    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Send offer
    await videoSessionRef.child('offer').set(peerConnection.localDescription.toJSON());
    
    console.log('📤 Offer sent to display');
    
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
    
    // Replace tracks in peer connection
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
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    };
    
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
      saveRecording();
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
    
    console.log('🔴 Recording started');
    
  } catch (error) {
    console.error('❌ Recording error:', error);
    customError('Gagal memulai rekaman');
  }
}

// ========= STOP RECORDING =========
function stopRecording() {
  if (mediaRecorder && isRecording) {
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

// ========= SAVE RECORDING =========
async function saveRecording() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `karaoke-${roomId}-${Date.now()}.webm`;
  
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  console.log('💾 Recording saved');
  
  await customSuccess('Video berhasil disimpan!', 'Rekaman Tersimpan');
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

console.log('✅ Video-panel.js loaded');