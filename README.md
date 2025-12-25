# 🎤 Karaoke Bus - Queue Management System

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-production-brightgreen.svg)

Sistem manajemen antrean karaoke modern untuk bus pariwisata dengan fitur real-time synchronization, multi-room support, dan keamanan berlapis.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Struktur Proyek](#-struktur-proyek)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Penggunaan](#-penggunaan)
- [Keamanan](#-keamanan)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### 🚌 Multi-Room Support
- **7 Bus Pre-configured** (BUS-001 hingga BUS-007)
- **Custom Room ID** untuk bus tambahan
- **PIN Protection** 6 digit per room
- **Isolasi data** antar room

### 🎵 Queue Management
- **Real-time synchronization** via Firebase
- **Drag & drop** untuk reorder antrean
- **Auto-play** lagu berikutnya
- **Manual add** oleh admin
- **Device tracking** untuk mencegah spam
- **Order management** dengan numbering otomatis

### 🎬 Display System
- **YouTube Player** terintegrasi
- **Auto-play** dengan error handling
- **10 menit timer** per lagu
- **Error overlay** 3 detik untuk link bermasalah
- **Queue preview** untuk antrean selanjutnya
- **Fullscreen support**

### 👥 User Experience
- **QR Code generator** untuk akses cepat
- **Custom modal** untuk semua notifikasi
- **Responsive design** (mobile & desktop)
- **Real-time queue status** di form
- **Device-based** request limiting

### 🔐 Security Features
- **Session-based authentication** untuk room, admin, dan display
- **Token generation** untuk mencegah URL bypass
- **Auto-logout** setelah timeout:
  - Admin: 2 jam
  - Display: 8 jam
- **Password protection** untuk admin & display
- **Firebase security rules**

### 🎨 Modern UI/UX
- **Gradient backgrounds**
- **Smooth animations**
- **Custom modal system** (no browser alerts)
- **Hover effects**
- **Loading states**
- **Empty states**

---

## 🛠️ Teknologi

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling dengan gradient & animations
- **JavaScript (ES6+)** - Logic & interactivity
- **YouTube IFrame API** - Video player

### Backend
- **Firebase Realtime Database** - Data storage & sync
- **Firebase Hosting** (optional) - Deployment

### Libraries
- **QR Server API** - QR code generation
- **Custom Modal System** - Alert/confirm replacement

---

## 📁 Struktur Proyek

```
karaoke-bus/
├── index.html              # Landing page - pilih bus
├── pin-login.html          # PIN verification untuk room
├── bus-menu.html           # Menu utama room (display/form/admin)
├── form.html               # Form request lagu untuk user
├── display.html            # Display layar karaoke
├── display-login.html      # Login display
├── admin.html              # Admin panel
├── admin-login.html        # Login admin
│
├── css/
│   ├── index.css           # Style landing page
│   ├── bus-menu.css        # Style menu bus
│   ├── form.css            # Style form request
│   ├── display.css         # Style display
│   └── admin.css           # Style admin panel
│
├── js/
│   ├── firebase.js         # Firebase config & init
│   ├── room.js             # Room management system
│   ├── custom-modal.js     # Custom modal/alert system
│   ├── form.js             # Form logic
│   ├── display.js          # Display player logic
│   └── admin.js            # Admin panel logic
│
└── README.md               # Dokumentasi
```

---

## 🚀 Instalasi

### Prerequisites
- Web browser modern (Chrome, Firefox, Edge, Safari)
- Web server (untuk development: Live Server, XAMPP, atau Python SimpleHTTPServer)
- Akun Firebase (gratis)

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/karaoke-bus.git
cd karaoke-bus
```

### Step 2: Setup Firebase

1. Buat project baru di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan **Realtime Database**
3. Copy konfigurasi Firebase
4. Paste ke `js/firebase.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. Setup Firebase Rules (lihat bagian [Konfigurasi](#-konfigurasi))

### Step 3: Jalankan Project

**Menggunakan Live Server (VSCode):**
```bash
# Install extension Live Server di VSCode
# Klik kanan index.html → "Open with Live Server"
```

**Menggunakan Python:**
```bash
python -m http.server 8000
# Buka http://localhost:8000
```

**Menggunakan Node.js:**
```bash
npx http-server -p 8000
# Buka http://localhost:8000
```

---

## ⚙️ Konfigurasi

### Firebase Realtime Database Rules

Paste rules ini ke Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "karaoke": {
      "room": {
        "$roomId": {
          ".read": true,
          ".write": true,
          "queue": {
            ".read": true,
            ".write": true,
            "$songId": {
              ".validate": "
                newData.hasChildren(['name','videoId','order','deviceId','createdAt']) &&
                newData.child('name').isString() &&
                newData.child('videoId').isString() &&
                newData.child('order').isNumber()
              "
            }
          },
          "Setting": {
            ".read": true,
            ".write": true
          }
        }
      }
    }
  }
}
```

### Struktur Data Firebase

```
karaoke/
  room/
    BUS-001/
      Setting/
        pin: 101010                    # PIN 6 digit (number)
        busName: "Bus 1"               # Nama bus
      queue/
        -Nxxx123/
          name: "John Doe"             # Nama penyanyi
          videoId: "dQw4w9WgXcQ"       # YouTube video ID
          order: 1                      # Urutan (number)
          deviceId: "DEV_xxx"          # Device identifier
          createdAt: 1234567890        # Timestamp
```

### Setup PIN untuk Bus

Tambahkan PIN di Firebase Console:

```
karaoke/room/BUS-001/Setting/pin = 101010
karaoke/room/BUS-002/Setting/pin = 202020
karaoke/room/BUS-003/Setting/pin = 303030
...
```

### Password Default

**Admin Panel:**
```javascript
// admin-login.html line 99
const ADMIN_PASSWORD = "karaokebushioo0001";
```

**Display:**
```javascript
// display-login.html line 72
const DISPLAY_PASSWORD = "displaybus9999";
```

⚠️ **SECURITY WARNING:** Ganti password ini di production!

---

## 📱 Penggunaan

### Untuk Penumpang (User)

1. **Akses Form Request**
   - Scan QR code yang ditampilkan admin, ATAU
   - Buka URL: `https://your-domain.com/form.html?room=BUS-001`

2. **Request Lagu**
   - Masukkan nama Anda
   - Paste link YouTube lagu
   - Klik "Tambah ke Antrean"

3. **Cek Status**
   - Lihat posisi Anda di antrean
   - Status real-time (sedang bernyanyi/menunggu)

### Untuk Driver/Operator (Admin)

1. **Login ke Room**
   - Pilih bus dari homepage
   - Masukkan PIN 6 digit
   - Pilih "Panel Admin"
   - Masukkan password admin

2. **Kelola Antrean**
   - **Tambah manual:** Form di atas daftar antrean
   - **Drag & drop:** Geser untuk ubah urutan
   - **Skip:** Lewati lagu yang sedang diputar
   - **Hapus:** Delete lagu dari antrean
   - **Reset:** Hapus semua antrean

3. **Monitoring**
   - Lihat total antrean
   - Cek lagu yang sedang diputar
   - Share QR code untuk penumpang

### Untuk Display (Layar Karaoke)

1. **Setup Display**
   - Pilih bus dari homepage
   - Masukkan PIN 6 digit
   - Pilih "Layar Karaoke"
   - Masukkan password display

2. **Aktivasi**
   - Klik "MULAI KARAOKE" pada overlay
   - Player akan auto-play lagu pertama

3. **Auto Management**
   - Lagu otomatis berganti setelah selesai
   - Timer 10 menit per lagu
   - Error handling untuk link bermasalah
   - Preview antrean selanjutnya

---

## 🔐 Keamanan

### Layer Keamanan

#### 1. Room Access Protection
- **PIN 6 digit** wajib untuk masuk room
- **Session token** disimpan di sessionStorage
- **Token validation** di setiap halaman
- Token **dihapus** saat logout atau timeout

#### 2. Admin Protection
- **Password authentication**
- **Session timeout** 2 jam
- **Token-based** access control
- Logout confirmation required

#### 3. Display Protection
- **Password authentication**
- **Session timeout** 8 jam
- **Token-based** access control
- Direct URL access blocked

#### 4. Anti-Spam
- **Device ID tracking** (localStorage)
- **One request per device** di antrean
- Nama & link validation

#### 5. Firebase Rules
- Read/write rules per room
- Data validation schema
- No anonymous auth required

### Best Practices

**Untuk Production:**

1. **Ganti semua password default**
   ```javascript
   // admin-login.html
   const ADMIN_PASSWORD = "your-strong-password-here";
   
   // display-login.html
   const DISPLAY_PASSWORD = "another-strong-password";
   ```

2. **Setup environment variables**
   - Jangan commit Firebase config ke Git
   - Gunakan .env file

3. **Enable HTTPS**
   - Firebase Hosting otomatis HTTPS
   - Atau gunakan SSL certificate

4. **Perketat Firebase Rules**
   - Tambahkan auth requirement
   - Rate limiting untuk write operations

5. **Monitor logs**
   - Firebase Console → Usage
   - Track suspicious activities

---

## 📖 API Reference

### RoomManager (js/room.js)

**Core Functions:**

```javascript
// Get current room ID
const roomId = RoomManager.getRoomId();

// Get Firebase room reference
const roomRef = RoomManager.getRoomRef();

// Get queue reference
const queueRef = RoomManager.getQueueRef();

// Initialize room system
const success = RoomManager.initRoomSystem();

// Verify room password (returns Promise)
const isValid = await RoomManager.verifyRoomPassword(roomId, password);

// Generate QR code
RoomManager.generateRoomQR();

// Get room URL for specific page
const url = RoomManager.getCurrentRoomUrl('form.html');
```

### Custom Modal (js/custom-modal.js)

**Alert Functions:**

```javascript
// Basic alert
await customAlert("Your message");

// Custom alert with options
await customAlert("Message", {
  title: "Custom Title",
  icon: "🎉",
  buttonText: "OK",
  buttonClass: "custom-modal-btn-primary"
});

// Success alert (green)
await customSuccess("Operation successful!");

// Error alert (red)
await customError("Something went wrong!");

// Warning alert (yellow)
await customWarning("Please be careful!");

// Info alert (blue)
await customInfo("Did you know?");
```

**Confirm Function:**

```javascript
// Basic confirm
const result = await customConfirm("Are you sure?");
if (result) {
  // User clicked "Ya"
} else {
  // User clicked "Batal"
}

// Custom confirm with options
const result = await customConfirm("Delete this item?", {
  title: "Confirm Delete",
  icon: "🗑️",
  confirmText: "Yes, Delete",
  cancelText: "Cancel",
  confirmClass: "custom-modal-btn-danger"
});
```

### Firebase Queue Structure

**Add to Queue:**

```javascript
queueRef.push({
  name: "Singer Name",
  videoId: "YouTube_Video_ID",
  order: 1,
  deviceId: "DEVICE_ID",
  createdAt: Date.now()
});
```

**Listen to Queue:**

```javascript
queueRef.orderByChild("order").on("value", snapshot => {
  snapshot.forEach(child => {
    const data = child.val();
    console.log(data.name, data.order);
  });
});
```

**Remove from Queue:**

```javascript
queueRef.child(songKey).remove();
```

**Update Order:**

```javascript
queueRef.child(songKey).update({ order: newOrder });
```

---

## 🐛 Troubleshooting

### Masalah Umum

**1. Firebase Connection Failed**

❌ Error: "Firebase SDK belum dimuat"

✅ Solusi:
- Pastikan urutan script benar di HTML
- `firebase-app-compat.js` harus dimuat pertama
- Cek koneksi internet
- Verify Firebase config di `js/firebase.js`

---

**2. PIN Tidak Valid**

❌ Error: "PIN salah" padahal sudah benar

✅ Solusi:
- Cek di Firebase Console: `karaoke/room/BUS-XXX/Setting/pin`
- PIN harus bertipe **number**, bukan string
- Format: `101010` bukan `"101010"`
- Test dengan Firebase Console langsung

---

**3. Video Tidak Muncul**

❌ Error: Video player hitam/tidak load

✅ Solusi:
- Pastikan link YouTube valid
- Video tidak di-private/restricted
- Cek YouTube API quota
- Clear browser cache
- Coba video lain untuk testing

---

**4. Bypass PIN via URL**

❌ Problem: Bisa akses bus-menu langsung

✅ Solusi:
- Pastikan sudah pakai file `pin-login.html` dan `bus-menu.html` yang terbaru
- Cek sessionStorage di DevTools → Application → Session Storage
- Pastikan ada key `room_token_BUS-XXX`

---

**5. Modal Tidak Muncul**

❌ Error: Masih pakai alert() browser

✅ Solusi:
- Pastikan `<script src="js/custom-modal.js"></script>` ada di HTML
- Harus SEBELUM script yang pakai modal
- Cek console untuk error JavaScript
- Fungsi harus pakai `await` dan parent function harus `async`

---

**6. Queue Tidak Update**

❌ Problem: Tambah lagu tidak muncul di display

✅ Solusi:
- Cek Firebase Rules (read/write harus `true`)
- Verify Firebase connection
- Refresh display page
- Cek console untuk listener errors
- Pastikan order number unique

---

**7. Drag & Drop Tidak Kerja**

❌ Problem: Tidak bisa ubah urutan antrean

✅ Solusi:
- Pastikan pakai browser modern (Chrome/Firefox/Edge)
- Cek `draggable="true"` di element
- Mobile browser mungkin tidak support
- Gunakan desktop untuk admin

---

**8. Session Expired Terus**

❌ Problem: Harus login berulang kali

✅ Solusi:
- Jangan clear browser cache/data saat sedang pakai
- Cek timeout settings di code:
  - Admin: 2 jam (bisa diubah di `admin.html`)
  - Display: 8 jam (bisa diubah di `display.html`)
- SessionStorage hilang saat tutup tab (by design)

---

### Debug Mode

Enable console logs untuk debugging:

```javascript
// Tambahkan di awal file JS
const DEBUG = true;

if (DEBUG) {
  console.log('🐛 Debug info:', variable);
}
```

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Ikuti langkah berikut:

### Setup Development

```bash
# Fork repository
git clone https://github.com/YOUR-USERNAME/karaoke-bus.git
cd karaoke-bus

# Create branch
git checkout -b feature/amazing-feature

# Make changes
# ...

# Commit
git commit -m "Add amazing feature"

# Push
git push origin feature/amazing-feature

# Create Pull Request di GitHub
```

### Coding Standards

- **Indentasi:** 2 spaces
- **Naming:** camelCase untuk JS, kebab-case untuk CSS
- **Comments:** Jelaskan logic kompleks
- **Testing:** Test di Chrome, Firefox, Safari
- **Responsive:** Mobile-first approach

### Feature Requests

Punya ide fitur baru? Buat issue di GitHub dengan label `enhancement`:

**Format:**
```
Title: [FEATURE] Nama Fitur

Deskripsi:
- Masalah yang diselesaikan
- Solusi yang diusulkan
- Mockup (jika ada)

Expected Behavior:
- User story
- Acceptance criteria
```

---

## 📄 Lisensi

MIT License

Copyright (c) 2025 Karaoke Bus

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 📞 Kontak & Support

- **Email:** support@karaokebus.com
- **GitHub Issues:** [Report Bug](https://github.com/yourusername/karaoke-bus/issues)
- **Documentation:** [Wiki](https://github.com/yourusername/karaoke-bus/wiki)

---

## 🎉 Credits

Dibuat dengan ❤️ untuk komunitas karaoke bus Indonesia

**Contributors:**
- Your Name - Initial work

**Special Thanks:**
- Firebase Team - Real-time database
- YouTube - IFrame API
- Community testers

---

## 📊 Changelog

### v2.0.0 (2025-01-XX)
- ✨ Added custom modal system
- 🔐 Enhanced security (PIN + token-based auth)
- 🎨 UI/UX improvements
- 📱 Better responsive design
- 🐛 Fixed multiple bugs

### v1.0.0 (2024-XX-XX)
- 🎉 Initial release
- ✅ Basic queue management
- ✅ Multi-room support
- ✅ YouTube player integration

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with 🎤 for karaoke lovers

</div>