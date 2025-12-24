/*************************************************
 * ROOM.JS – FINAL FIXED VERSION
 * Path Firebase sudah benar dengan template literal
 *************************************************/

// ================= GET ROOM ID =================
function getRoomId() {
  const params = new URLSearchParams(window.location.search);
  let roomId = params.get("room");
  
  if (!roomId) {
    roomId = localStorage.getItem("karaoke_room_id");
  }
  
  if (!roomId) {
    console.warn("⚠️ Room ID tidak ditemukan");
    window.location.href = "index.html";
    return null;
  }
  
  localStorage.setItem("karaoke_room_id", roomId);
  console.log("✅ Room ID:", roomId);
  return roomId;
}

// ================= ROOM REF =================
function getRoomRef() {
  const roomId = getRoomId();
  if (!roomId) return null;
  
  // ✅ FIX: Gunakan template literal dengan backtick
  const path = `karaoke/room/${roomId}`;
  console.log("📁 Room path:", path);
  return db.ref(path);
}

// ================= QUEUE REF =================
function getQueueRef() {
  const roomRef = getRoomRef();
  if (!roomRef) {
    console.error("❌ Room ref is null");
    return null;
  }
  
  const queueRef = roomRef.child("queue");
  console.log("📋 Queue ref created");
  return queueRef;
}

// ================= DISPLAY ROOM INFO =================
function displayRoomInfo() {
  const roomRef = getRoomRef();
  if (!roomRef) return;
  
  roomRef.child("Setting").once("value")
    .then(snap => {
      if (!snap.exists()) {
        console.log("⚠️ No settings found");
        return;
      }
      
      const setting = snap.val();
      console.log("⚙️ Settings loaded:", setting);
      
      document.querySelectorAll(".bus-name").forEach(el => {
        el.textContent = setting.busName || "BUS";
      });
    })
    .catch(error => {
      console.error("❌ Error loading settings:", error);
    });
}

// ================= VERIFY PASSWORD =================
function verifyRoomPassword(roomId, password) {
  return new Promise(resolve => {
    // ✅ FIX: Gunakan template literal dengan backtick
    const path = `karaoke/room/${roomId}/Setting/password`;
    console.log("🔐 Verifying password for:", path);
    
    db.ref(path).once("value")
      .then(snap => {
        const isValid = snap.exists() && snap.val() === password;
        console.log("🔐 Password valid:", isValid);
        resolve(isValid);
      })
      .catch(error => {
        console.error("❌ Password verification error:", error);
        resolve(false);
      });
  });
}

// ================= CURRENT ROOM URL =================
function getCurrentRoomUrl(page) {
  const roomId = getRoomId();
  if (!roomId) return "#";
  
  const base = window.location.origin + window.location.pathname.replace(/[^/]*$/, "");
  const url = `${base}${page}?room=${roomId}`;
  console.log("🔗 Generated URL:", url);
  return url;
}

// ================= QR GENERATOR =================
function generateRoomQR() {
  console.log("📱 Generating QR code...");
  
  const roomId = getRoomId();
  if (!roomId) {
    console.error("❌ No room ID for QR");
    return;
  }
  
  const url = getCurrentRoomUrl("form.html");
  const img = document.getElementById("qr-image");
  const txt = document.getElementById("form-url");
  
  if (img) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    img.src = qrUrl;
    console.log("🖼️ QR URL:", qrUrl);
    
    // Test if image loads
    img.onload = () => console.log("✅ QR image loaded");
    img.onerror = () => console.error("❌ QR image failed to load");
  } else {
    console.error("❌ QR image element not found");
  }
  
  if (txt) {
    txt.textContent = url;
    console.log("✅ Form URL displayed");
  } else {
    console.error("❌ Form URL element not found");
  }
}

// ================= INIT ROOM =================
function initRoomSystem() {
  console.log("🚀 Initializing room system...");
  
  const roomId = getRoomId();
  if (!roomId) {
    console.error("❌ Cannot initialize - no room ID");
    return false;
  }
  
  displayRoomInfo();
  console.log("✅ Room system ready for:", roomId);
  return true;
}

// ================= EXPORT =================
window.RoomManager = {
  getRoomId,
  getRoomRef,
  getQueueRef,
  displayRoomInfo,
  verifyRoomPassword,
  getCurrentRoomUrl,
  generateRoomQR,
  initRoomSystem
};

console.log("✅ RoomManager module loaded");