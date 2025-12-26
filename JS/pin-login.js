/*************************************************
 * PIN-LOGIN.JS - PIN Verification Logic
 *************************************************/

// ========= GET ROOM ID =========
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');

if (!roomId) {
  window.location.href = 'index.html';
}

// ========= HAPUS TOKEN LAMA (Agar selalu diminta PIN) =========
sessionStorage.removeItem(`room_token_${roomId}`);
sessionStorage.removeItem(`room_pin_verified_${roomId}`);

// ========= ELEMENTS =========
const pinInput = document.getElementById('pin');
const submitBtn = document.getElementById('submit-btn');
const errorEl = document.getElementById('error');

// ========= EVENT LISTENERS =========
pinInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    verifyPin();
  }
});

submitBtn.addEventListener('click', verifyPin);

// ========= VERIFY PIN =========
async function verifyPin() {
  const pinValue = pinInput.value.trim();
  
  if (pinValue.length !== 6 || !/^\d{6}$/.test(pinValue)) {
    errorEl.textContent = 'PIN harus 6 digit angka';
    errorEl.style.display = 'block';
    return;
  }
  
  // Disable button
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memverifikasi...';
  
  const pin = Number(pinValue);
  const pinRef = db.ref(`karaoke/room/${roomId}/Setting/pin`);
  
  try {
    const snap = await pinRef.once('value');
    
    if (snap.exists() && snap.val() === pin) {
      // ✅ PIN BENAR
      const token = generateSecureToken(roomId, pin);
      
      sessionStorage.setItem(`room_token_${roomId}`, token);
      sessionStorage.setItem(`room_pin_verified_${roomId}`, Date.now());
      localStorage.setItem('karaoke_room_id', roomId);
      
      console.log('✅ PIN verified, token generated');
      
      // Redirect
      window.location.href = `bus-menu.html?room=${roomId}`;
    } else {
      // ❌ PIN SALAH
      errorEl.textContent = 'PIN salah';
      errorEl.style.display = 'block';
      pinInput.value = '';
      pinInput.focus();
      
      setTimeout(() => { 
        errorEl.style.display = 'none'; 
      }, 3000);
      
      submitBtn.disabled = false;
      submitBtn.textContent = 'Masuk';
    }
  } catch (e) {
    await customError('Gagal memeriksa PIN. Silakan coba lagi.', 'Koneksi Error');
    console.error('PIN verification error:', e);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Masuk';
  }
}

// ========= GENERATE TOKEN =========
function generateSecureToken(roomId, pin) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const data = `${roomId}-${pin}-${timestamp}-${random}`;
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `TOKEN_${Math.abs(hash).toString(36)}_${timestamp}`;
}

console.log('✅ Pin-login.js loaded');