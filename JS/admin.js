/*************************************************
 * ADMIN.JS – WITH YOUTUBE EMBED VALIDATION
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
async function initAdmin() {
  console.log("🚀 Init Admin...");

  if (!window.RoomManager) {
    console.error("❌ RoomManager tidak ditemukan");
    await customError("RoomManager tidak ditemukan. Silakan refresh halaman.");
    return;
  }

  const params = new URLSearchParams(location.search);
  roomId = params.get("room") || localStorage.getItem("karaoke_room_id");

  if (!roomId) {
    console.error("❌ Room ID tidak ditemukan");
    await customError("Room ID tidak ditemukan. Kembali ke beranda.");
    location.href = "index.html";
    return;
  }

  localStorage.setItem("karaoke_room_id", roomId);
  console.log("✅ Room ID:", roomId);

  if (!RoomManager.initRoomSystem()) {
    console.error("❌ Gagal init room");
    await customError("Gagal menginisialisasi sistem room.");
    return;
  }

  queueRef = RoomManager.getQueueRef();
  if (!queueRef) {
    console.error("❌ Queue tidak tersedia");
    await customError("Tidak dapat terhubung ke database queue.");
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

// ============ 🆕 VALIDATE YOUTUBE EMBED ============
async function validateYouTubeEmbed(videoId) {
  try {
    console.log("🔍 Checking embed status for:", videoId);
    
    // Method 1: Check YouTube oEmbed API
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const response = await fetch(oEmbedUrl);
    
    if (response.ok) {
      console.log("✅ Video can be embedded");
      return { 
        canEmbed: true, 
        reason: null 
      };
    } else {
      console.warn("⚠️ Video cannot be embedded");
      return { 
        canEmbed: false, 
        reason: "Video ini tidak mengizinkan embed (diputar di website lain). Kemungkinan pemilik video menonaktifkan fitur embed atau video memiliki pembatasan copyright."
      };
    }
  } catch (error) {
    console.error("❌ Embed check failed:", error);
    // Jika gagal cek, tetap allow (network issue)
    return { 
      canEmbed: true, 
      reason: null,
      warning: "Tidak dapat memverifikasi status embed. Video akan dicoba diputar."
    };
  }
}

// ============ ADD MANUAL ============
window.addManual = async function () {
  console.log("➕ Add manual triggered");
  
  const nameInput = document.getElementById("admin-name");
  const linkInput = document.getElementById("admin-link");

  if (!nameInput || !linkInput) {
    console.error("❌ Input elements not found");
    await customError("Input tidak ditemukan.");
    return;
  }

  const name = nameInput.value.trim();
  const link = linkInput.value.trim();

  if (!name || !link) {
    await customWarning("Nama & link wajib diisi!", "Data Tidak Lengkap");
    return;
  }

  const videoId = extractVideoId(link);
  if (!videoId) {
    await customError("Link YouTube tidak valid!", "Format Salah");
    return;
  }

  console.log("✅ Video ID extracted:", videoId);

  // ✅ VALIDASI EMBED
  const embedCheck = await validateYouTubeEmbed(videoId);
  
  if (!embedCheck.canEmbed) {
    // Video tidak bisa di-embed, tampilkan warning
    const proceed = await customConfirm(
      `⚠️ ${embedCheck.reason}\n\nVideo ini kemungkinan besar TIDAK AKAN BISA DIPUTAR di display.\n\nApakah Anda tetap ingin menambahkannya?`,
      {
        title: "Video Mungkin Bermasalah",
        icon: "⚠️",
        confirmText: "Tetap Tambahkan",
        cancelText: "Batal",
        confirmClass: "custom-modal-btn-danger"
      }
    );
    
    if (!proceed) {
      console.log("❌ User cancelled due to embed warning");
      return;
    }
  } else if (embedCheck.warning) {
    // Ada warning tapi tetap allow
    await customWarning(embedCheck.warning, "Perhatian");
  }

  console.log("✅ Adding:", name, videoId);

  queueRef.once("value", async snap => {
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
    }, async error => {
      if (error) {
        console.error("❌ Add failed:", error);
        await customError(`Gagal menambahkan lagu: ${error.message}`, "Gagal Menambahkan");
      } else {
        console.log("✅ Added successfully");
        await customSuccess(`Lagu "${name}" berhasil ditambahkan ke antrean!`, "Berhasil!");
        nameInput.value = "";
        linkInput.value = "";
        nameInput.focus();
      }
    });
  }).catch(async error => {
    console.error("❌ Database error:", error);
    await customError(`Error database: ${error.message}`);
  });
};

// ============ DELETE ============
window.deleteFromQueue = async function (key) {
  console.log("🗑️ Delete:", key);
  
  const result = await customConfirm(
    "Lagu ini akan dihapus dari antrean.", 
    {
      title: "Hapus Lagu?",
      icon: "🗑️",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      confirmClass: "custom-modal-btn-danger"
    }
  );
  
  if (!result) return;

  queueRef.child(key).remove()
    .then(async () => {
      console.log("✅ Deleted");
    })
    .catch(async error => {
      console.error("❌ Delete error:", error);
      await customError(`Gagal hapus: ${error.message}`);
    });
};

// ============ SKIP ============
window.skipCurrent = async function () {
  console.log("⏭️ Skip triggered");
  
  const result = await customConfirm(
    "Lagu yang sedang diputar akan dilewati.", 
    {
      title: "Skip Lagu?",
      icon: "⏭️",
      confirmText: "Ya, Skip",
      cancelText: "Batal"
    }
  );
  
  if (!result) return;

  queueRef.orderByChild("order").limitToFirst(1).once("value", async snap => {
    if (!snap.exists()) {
      await customWarning("Tidak ada lagu yang sedang diputar.", "Tidak Ada Lagu");
      return;
    }

    snap.forEach(c => {
      queueRef.child(c.key).remove()
        .then(async () => {
          console.log("✅ Skipped");
          await customSuccess("Lagu berhasil di-skip!", "Berhasil!");
        })
        .catch(async error => {
          console.error("❌ Skip error:", error);
          await customError(`Gagal skip: ${error.message}`);
        });
    });
  }).catch(async error => {
    console.error("❌ Database error:", error);
    await customError(`Error: ${error.message}`);
  });
};

// ============ RESET ============
window.resetAllQueue = async function () {
  console.log("🗑️ Reset all triggered");
  
  const result = await customConfirm(
    "SEMUA lagu dalam antrean akan dihapus!\n\nTindakan ini tidak dapat dibatalkan.", 
    {
      title: "Reset Semua Antrean?",
      icon: "⚠️",
      confirmText: "Ya, Hapus Semua",
      cancelText: "Batal",
      confirmClass: "custom-modal-btn-danger"
    }
  );
  
  if (!result) return;

  queueRef.remove()
    .then(async () => {
      console.log("✅ Reset complete");
      await customSuccess("Semua antrean berhasil dihapus!", "Reset Selesai");
    })
    .catch(async error => {
      console.error("❌ Reset error:", error);
      await customError(`Gagal reset: ${error.message}`);
    });
};

// ============ DRAG & DROP ============
function swapOrder(sourceKey, targetKey) {
  console.log("🔄 Swapping:", sourceKey, "↔️", targetKey);
  
  queueRef.once("value", async snap => {
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
      .catch(async error => {
        console.error("❌ Swap error:", error);
        await customError(`Gagal ubah urutan: ${error.message}`);
      });
  }).catch(async error => {
    console.error("❌ Database error:", error);
    await customError(`Error: ${error.message}`);
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