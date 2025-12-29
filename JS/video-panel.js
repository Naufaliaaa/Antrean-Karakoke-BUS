/*************************************************
 * VIDEO-PANEL.JS - Display Side (Receiver)
 * WebRTC Video Streaming Receiver
 *************************************************/

// ========= GET ROOM ID =========
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room') || localStorage.getItem('karaoke_room_id');

if (!roomId) {
  alert('Room ID tidak ditemukan!');
  window.location.href = 'index.html';
}

// ========= ELEMENTS =========
const remoteVideo = document.getElementById('remote-video');
const videoOverlay = document.getElementById('video-overlay');
const connectionStatus = document.getElementById('connection-status');
const roomIdDisplay = document.getElementById('room-id-display');
const viewerInfo = document.getElementById('viewer-info');
const qualityInfo = document.getElementById('quality-info');
const cameraLink = document.getElementById('camera-link');
const qrImage = document.getElementById('qr-image');
const backBtn = document.getElementById('back-btn');

// ========= WEBRTC CONFIG =========
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

let peerConnection = null;
let videoSessionRef = null;

// ========= INIT =========
async function init() {
  console.log('🎥 Initializing video panel...');
  
  // Set room ID
  roomIdDisplay.textContent = roomId;
  
  // Generate camera link
  const cameraUrl = `${window.location.origin}${window.location.pathname.replace('video-panel.html', '')}camera-stream.html?room=${roomId}`;
  cameraLink.textContent = cameraUrl;
  
  // Generate QR code
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cameraUrl)}`;
  qrImage.src = qrUrl;
  
  // Setup Firebase reference
  videoSessionRef = db.ref(`karaoke/room/${roomId}/videoSession`);
  
  // Listen for incoming stream
  listenForStream();
  
  console.log('✅ Video panel ready');
}

// ========= LISTEN FOR STREAM =========
function listenForStream() {
  console.log('👂 Listening for camera stream...');
  
  // Listen for offer from camera
  videoSessionRef.child('offer').on('value', async (snapshot) => {
    if (!snapshot.exists()) return;
    
    const offer = snapshot.val();
    console.log('📩 Received offer from camera');
    
    await handleOffer(offer);
  });
  
  // Listen for ICE candidates
  videoSessionRef.child('cameraCandidates').on('child_added', async (snapshot) => {
    const candidate = snapshot.val();
    console.log('🧊 Received ICE candidate');
    
    if (peerConnection && candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    }
  });
  
  // Listen for camera status
  videoSessionRef.child('cameraStatus').on('value', (snapshot) => {
    const status = snapshot.val();
    updateConnectionStatus(status);
  });
}

// ========= HANDLE OFFER =========
async function handleOffer(offer) {
  try {
    // Create peer connection
    peerConnection = new RTCPeerConnection(configuration);
    
    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log('📹 Received remote stream');
      remoteVideo.srcObject = event.streams[0];
      videoOverlay.classList.add('hidden');
      updateConnectionStatus('connected');
      
      // Get video stats
      monitorVideoQuality();
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        videoSessionRef.child('displayCandidates').push(event.candidate.toJSON());
      }
    };
    
    // Handle connection state
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'disconnected' || 
          peerConnection.connectionState === 'failed') {
        handleDisconnection();
      }
    };
    
    // Set remote description
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    
    // Send answer to camera
    await videoSessionRef.child('answer').set(peerConnection.localDescription.toJSON());
    
    console.log('✅ Answer sent to camera');
    
  } catch (error) {
    console.error('❌ Error handling offer:', error);
    updateConnectionStatus('error');
  }
}

// ========= MONITOR VIDEO QUALITY =========
function monitorVideoQuality() {
  setInterval(async () => {
    if (!peerConnection) return;
    
    try {
      const stats = await peerConnection.getStats();
      
      stats.forEach(report => {
        if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
          const width = report.frameWidth || 0;
          const height = report.frameHeight || 0;
          const fps = report.framesPerSecond || 0;
          
          qualityInfo.textContent = `${width}x${height} @ ${fps}fps`;
        }
      });
    } catch (e) {
      console.error('Error getting stats:', e);
    }
  }, 2000);
}

// ========= UPDATE CONNECTION STATUS =========
function updateConnectionStatus(status) {
  const statusText = connectionStatus.querySelector('.status-text');
  
  connectionStatus.className = 'status';
  
  if (status === 'connected') {
    connectionStatus.classList.add('connected');
    statusText.textContent = 'Terhubung';
    viewerInfo.textContent = 'Kamera Aktif';
  } else if (status === 'disconnected') {
    connectionStatus.classList.add('disconnected');
    statusText.textContent = 'Terputus';
    viewerInfo.textContent = 'Tidak Ada';
  } else if (status === 'waiting') {
    statusText.textContent = 'Menunggu Kamera...';
    viewerInfo.textContent = 'Menunggu...';
  } else {
    statusText.textContent = 'Error';
    viewerInfo.textContent = 'Error';
  }
}

// ========= HANDLE DISCONNECTION =========
function handleDisconnection() {
  console.log('⚠️ Camera disconnected');
  
  remoteVideo.srcObject = null;
  videoOverlay.classList.remove('hidden');
  updateConnectionStatus('disconnected');
  
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  
  // Clear Firebase session
  videoSessionRef.child('answer').remove();
  videoSessionRef.child('displayCandidates').remove();
}

// ========= BACK BUTTON =========
backBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  // Close connection
  if (peerConnection) {
    peerConnection.close();
  }
  
  // Clear session
  await videoSessionRef.remove();
  
  // Go back
  const roomId = localStorage.getItem('karaoke_room_id');
  window.location.href = `bus-menu.html?room=${roomId}`;
});

// ========= CLEANUP ON PAGE UNLOAD =========
window.addEventListener('beforeunload', () => {
  if (peerConnection) {
    peerConnection.close();
  }
  videoSessionRef.child('answer').remove();
  videoSessionRef.child('displayCandidates').remove();
});

// ========= START =========
init();

console.log('✅ Video-panel.js loaded');