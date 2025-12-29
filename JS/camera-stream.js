/*************************************************
 * CAMERA-STREAM.JS - Camera Side (Sender)
 * WebRTC Video Streaming + Recording
 *************************************************/

// ========= GET ROOM ID =========
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

if (!roomId) {
  alert('Room ID tidak ditemukan!');
  window.location.href = 'index.html';
}

// ========= ELEMENTS =========
const localVideo = document.getElementById('local-video');
const loadingOverlay = document.getElementById('loading-overlay');
const recordBtn = document.getElementById('record-btn');
const flipBtn = document.getElementById('flip-btn');
const closeBtn = document.getElementById('close-btn');
const connectionDot = document.getElementById('connection-dot');
const connectionText = document.getElementById('connection-text');
const recordingIndicator = document.getElementById('recording-indicator');
const recordingTime = document.getElementById('recording-time');

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
let currentFacingMode = 'user'; // 'user' = front, 'environment' = back

// ========= INIT =========
async function init() {
  console.log('📱 Initializing camera stream...');
  
  try {
    // Setup Firebase reference
    videoSessionRef = db.ref(`karaoke/room/${roomId}/videoSession`);
    
    // Get camera stream
    await startCamera();
    
    // Setup WebRTC
    await setupWebRTC();
    
    // Hide loading
    loadingOverlay.classList.add('hidden');
    
    // Update status
    await videoSessionRef.child('cameraStatus').set('connected');
    
    console.log('✅ Camera ready');
    
  } catch (error) {
    console.error('❌ Init error:', error);
    alert('Gagal mengakses kamera: ' + error.message);
    window.close();
  }
}

// ========= START CAMERA =========
async function startCamera(facingMode = 'user') {
  try {
    // Stop existing stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    // Get new stream
    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: true
    };
    
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = localStream;
    
    console.log('📹 Camera started');
    
    return localStream;
    
  } catch (error) {
    console.error('❌ Camera error:', error);
    throw new Error('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
  }
}

// ========= SETUP WEBRTC =========
async function setupWebRTC() {
  try {
    // Create peer connection
    peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        videoSessionRef.child('cameraCandidates').push(event.candidate.toJSON());
      }
    };
    
    // Handle connection state
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      updateConnectionStatus(peerConnection.connectionState);
    };
    
    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // Send offer
    await videoSessionRef.child('offer').set(peerConnection.localDescription.toJSON());
    
    console.log('📤 Offer sent');
    
    // Listen for answer
    videoSessionRef.child('answer').on('value', async (snapshot) => {
      if (!snapshot.exists() || peerConnection.currentRemoteDescription) return;
      
      const answer = snapshot.val();
      console.log('📩 Received answer');
      
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
    console.error('❌ WebRTC setup error:', error);
    throw error;
  }
}

// ========= UPDATE CONNECTION STATUS =========
function updateConnectionStatus(state) {
  if (state === 'connected') {
    connectionDot.style.background = '#22c55e';
    connectionText.textContent = 'Terhubung';
  } else if (state === 'connecting') {
    connectionDot.style.background = '#fbbf24';
    connectionText.textContent = 'Menghubungkan...';
  } else {
    connectionDot.style.background = '#ef4444';
    connectionText.textContent = 'Terputus';
  }
}

// ========= RECORDING FUNCTIONS =========
function startRecording() {
  try {
    recordedChunks = [];
    
    // Create media recorder
    const options = {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000 // 2.5 Mbps
    };
    
    // Fallback for iOS
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
    recordBtn.textContent = '⏹️';
    recordBtn.classList.add('recording');
    recordingIndicator.style.display = 'flex';
    
    // Start timer
    recordingStartTime = Date.now();
    recordingInterval = setInterval(updateRecordingTime, 1000);
    
    console.log('🔴 Recording started');
    
  } catch (error) {
    console.error('❌ Recording error:', error);
    alert('Gagal memulai rekaman: ' + error.message);
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    
    // Update UI
    recordBtn.textContent = '⏺️';
    recordBtn.classList.remove('recording');
    recordingIndicator.style.display = 'none';
    
    // Stop timer
    clearInterval(recordingInterval);
    recordingTime.textContent = '00:00';
    
    console.log('⏹️ Recording stopped');
  }
}

function updateRecordingTime() {
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  
  recordingTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function saveRecording() {
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = `karaoke-${roomId}-${Date.now()}.webm`;
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  
  console.log('💾 Recording saved');
  
  // Show success message
  alert('✅ Video berhasil disimpan ke galeri!');
}

// ========= FLIP CAMERA =========
async function flipCamera() {
  try {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    await startCamera(currentFacingMode);
    
    // Re-add tracks to peer connection
    if (peerConnection) {
      const senders = peerConnection.getSenders();
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      const audioSender = senders.find(sender => sender.track?.kind === 'audio');
      
      if (videoSender) {
        const videoTrack = localStream.getVideoTracks()[0];
        videoSender.replaceTrack(videoTrack);
      }
      
      if (audioSender) {
        const audioTrack = localStream.getAudioTracks()[0];
        audioSender.replaceTrack(audioTrack);
      }
    }
    
    console.log('🔄 Camera flipped');
    
  } catch (error) {
    console.error('❌ Flip error:', error);
    alert('Gagal membalik kamera');
  }
}

// ========= EVENT LISTENERS =========
recordBtn.addEventListener('click', () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

flipBtn.addEventListener('click', flipCamera);

closeBtn.addEventListener('click', async () => {
  if (isRecording) {
    if (!confirm('Rekaman sedang berjalan. Yakin ingin keluar?')) {
      return;
    }
    stopRecording();
  }
  
  // Cleanup
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  if (peerConnection) {
    peerConnection.close();
  }
  
  await videoSessionRef.child('cameraStatus').set('disconnected');
  
  window.close();
});

// ========= CLEANUP ON PAGE UNLOAD =========
window.addEventListener('beforeunload', async () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  
  if (peerConnection) {
    peerConnection.close();
  }
  
  await videoSessionRef.child('cameraStatus').set('disconnected');
  await videoSessionRef.child('offer').remove();
  await videoSessionRef.child('cameraCandidates').remove();
});

// ========= START =========
init();

console.log('✅ Camera-stream.js loaded');