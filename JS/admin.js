/*************************************************
 * ADMIN.JS – COMPLETE FIXED VERSION
 * Rendering antrean sudah benar
 *************************************************/

// ============ GLOBAL STATE ============
let queueRef = null;
let roomId = null;
let dragSourceKey = null;

// ============ WAIT FOR DOM ============
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdmin);
} else {
  initAdmin();
}

// ============ INIT ADMIN ============
function initAdmin() {
  console.log("🚀 Init Admin...");

  if (!window.RoomManager) {
    console.error("❌ RoomManager tidak ditemukan");
    alert("RoomManager tidak ditemukan");
    return;
  }

  const params = new URLSearchParams(location.search);
  roomId = params.get("room") || localStorage.getItem("karaoke_room_id");

  if (!roomId) {
    console.error("❌ Room ID tidak ditemukan");
    alert("Room ID tidak ditemukan");
    location.href = "index.html";
    return;
  }

  localStorage.setItem("karaoke_room_id", roomId);
  console.log("✅ Room ID:", roomId);

  if (!RoomManager.initRoomSystem()) {
    console.error("❌ Gagal init room");
    alert("Gagal init room");
    return;
  }

  queueRef = RoomManager.getQueueRef();
  if (!queueRef) {
    console.error("❌ Queue tidak tersedia");
    alert("Queue tidak tersedia");
    return;
  }

  console.log("✅ Queue ref ready");
  
  setupQueueListener();
  setupQRCode();
  setupKeyboard();
  
  console.log("✅ Admin system ready");
}

// ============ QR CODE ============
function setupQRCode() {
  try {
    RoomManager.generateRoomQR();
    console.log("✅ QR generated");
  } catch (e) {
    console.error("❌ QR error:", e);
  }
}

// ============ LISTENER ============
function setupQueueListener() {
  console.log("👂 Setting up queue listener...");
  
  queueRef.orderByChild("order").on("value", snap => {
    console.log("📊 Queue updated, items:", snap.numChildren());
    renderQueue(snap);
  }, error => {
    console.error("❌ Listener error:", error);
  });
}

// ============ RENDER ============
function renderQueue(snapshot) {
  console.log("🎨 Rendering queue...");
  
  const list = document.getElementById("queue-list");
  const now = document.getElementById("now-playing-section");
  const count = document.getElementById("queue-count");
  const totalCount = document.getElementById("total-count");

  if (!list || !now) {
    console.error("❌ DOM elements not found");
    return;
  }

  list.innerHTML = "";

  if (!snapshot.exists()) {
    console.log("📭 Queue empty");
    now.innerHTML = "";
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><p>Belum ada antrean</p></div>`;
    if (count) count.textContent = "0";
    if (totalCount) totalCount.textContent = "0";
    return;
  }

  const items = [];
  snapshot.forEach(c => {
    items.push({ key: c.key, ...c.val() });
  });

  console.log(`✅ ${items.length} items in queue`);

  if (count) count.textContent = items.length;
  if (totalCount) totalCount.textContent = items.length;

  // NOW PLAYING
  const first = items[0];
  now.innerHTML = `
    <div class="now-playing-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
        <h2 style="margin:0;">🎵 Sedang Diputar</h2>
        <button onclick="resetAllQueue()" style="background:rgba(255,255,255,0.2); border:1px solid white; color:white; padding:8px 16px; border-radius:8px; cursor:pointer; font-weight:600;">🗑️ Reset Semua</button>
      </div>
      <div class="now-playing-content">
        <div class="now-playing-info">
          <h3>${first.name}</h3>
          <p style="opacity:0.8;">Device: ${(first.deviceId || 'Unknown').substring(0, 12)}</p>
        </div>
        <button class="skip-button" onclick="skipCurrent()">⏭️ Skip</button>
      </div>
    </div>
  `;

  // WAITING LIST
  const waitList = items.slice(1);
  
  if (waitList.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">✅</div><p>Tidak ada antrean selanjutnya</p></div>`;
  } else {
    waitList.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "queue-item";
      div.draggable = true;

      // Drag events
      div.addEventListener("dragstart", () => {
        dragSourceKey = item.key;
        console.log("🎯 Drag start:", item.key);
      });
      
      div.addEventListener("dragover", e => {
        e.preventDefault();
      });
      
      div.addEventListener("drop", () => {
        if (dragSourceKey && dragSourceKey !== item.key) {
          console.log("📍 Drop on:", item.key);
          swapOrder(dragSourceKey, item.key);
        }
        dragSourceKey = null;
      });

      div.innerHTML = `
        <div class="drag-handle" style="cursor:grab; color:#94a3b8; font-size:24px;">☰</div>
        <div class="queue-number">${i + 1}</div>
        <div class="queue-details">
          <h4>${item.name}</h4>
          <p>Device: ${(item.deviceId || 'Manual').substring(0, 12)}</p>
        </div>
        <button class="delete-button" onclick="deleteFromQueue('${item.key}')">🗑️ Hapus</button>
      `;

      list.appendChild(div);
    });
  }
  
  console.log("✅ Render complete");
}

// ============ ADD MANUAL ============
window.addManual = function () {
  console.log("➕ Add manual triggered");
  
  const nameInput = document.getElementById("admin-name");
  const linkInput = document.getElementById("admin-link");

  if (!nameInput || !linkInput) {
    console.error("❌ Input elements not found");
    alert("❌ Input tidak ditemukan");
    return;
  }

  const name = nameInput.value.trim();
  const link = linkInput.value.trim();

  if (!name || !link) {
    alert("❌ Nama & link wajib diisi!");
    return;
  }

  const videoId = extractVideoId(link);
  if (!videoId) {
    alert("❌ Link YouTube tidak valid!");
    return;
  }

  console.log("✅ Adding:", name, videoId);

  queueRef.once("value", snap => {
    let max = 0;
    
    if (snap.exists()) {
      snap.forEach(c => {
        const order = c.val().order || 0;
        max = Math.max(max, order);
      });
    }

    queueRef.push({
      name: name,
      videoId: videoId,
      order: max + 1,
      deviceId: "ADMIN-MANUAL",
      createdAt: Date.now()
    }, error => {
      if (error) {
        console.error("❌ Add failed:", error);
        alert("❌ Gagal menambahkan: " + error.message);
      } else {
        console.log("✅ Added successfully");
        alert("✅ Lagu berhasil ditambahkan!");
        nameInput.value = "";
        linkInput.value = "";
        nameInput.focus();
      }
    });
  }).catch(error => {
    console.error("❌ Database error:", error);
    alert("❌ Error: " + error.message);
  });
};

// ============ DELETE ============
window.deleteFromQueue = function (key) {
  console.log("🗑️ Delete:", key);
  
  if (!confirm("❓ Hapus lagu ini?")) {
    return;
  }

  queueRef.child(key).remove()
    .then(() => {
      console.log("✅ Deleted");
    })
    .catch(error => {
      console.error("❌ Delete error:", error);
      alert("❌ Gagal hapus: " + error.message);
    });
};

// ============ SKIP ============
window.skipCurrent = function () {
  console.log("⏭️ Skip triggered");
  
  if (!confirm("⏭️ Skip lagu yang sedang diputar?")) {
    return;
  }

  queueRef.orderByChild("order").limitToFirst(1).once("value", snap => {
    if (!snap.exists()) {
      alert("❌ Tidak ada lagu");
      return;
    }

    snap.forEach(c => {
      queueRef.child(c.key).remove()
        .then(() => {
          console.log("✅ Skipped");
        })
        .catch(error => {
          console.error("❌ Skip error:", error);
          alert("❌ Gagal skip: " + error.message);
        });
    });
  }).catch(error => {
    console.error("❌ Database error:", error);
    alert("❌ Error: " + error.message);
  });
};

// ============ RESET ============
window.resetAllQueue = function () {
  console.log("🗑️ Reset all triggered");
  
  if (!confirm("⚠️ HAPUS SELURUH ANTREAN?\n\nSemua lagu akan dihapus!")) {
    return;
  }

  queueRef.remove()
    .then(() => {
      console.log("✅ Reset complete");
      alert("✅ Semua antrean dihapus!");
    })
    .catch(error => {
      console.error("❌ Reset error:", error);
      alert("❌ Gagal reset: " + error.message);
    });
};

// ============ DRAG & DROP ============
function swapOrder(sourceKey, targetKey) {
  console.log("🔄 Swapping:", sourceKey, "↔️", targetKey);
  
  queueRef.once("value", snap => {
    const data = snap.val();
    
    if (!data || !data[sourceKey] || !data[targetKey]) {
      console.error("❌ Invalid keys");
      return;
    }

    const updates = {};
    updates[`${sourceKey}/order`] = data[targetKey].order;
    updates[`${targetKey}/order`] = data[sourceKey].order;
    
    queueRef.update(updates)
      .then(() => {
        console.log("✅ Order swapped");
      })
      .catch(error => {
        console.error("❌ Swap error:", error);
        alert("❌ Gagal ubah urutan: " + error.message);
      });
  }).catch(error => {
    console.error("❌ Database error:", error);
    alert("❌ Error: " + error.message);
  });
}

// ============ UTIL ============
function extractVideoId(url) {
  const m = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return m ? m[1] : null;
}

// ============ KEYBOARD ============
function setupKeyboard() {
  const name = document.getElementById("admin-name");
  const link = document.getElementById("admin-link");

  if (name) {
    name.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (link) link.focus();
      }
    });
  }

  if (link) {
    link.addEventListener("keypress", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        window.addManual();
      }
    });
  }
}

console.log("✅ Admin.js loaded");