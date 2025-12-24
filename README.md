# 🎤 Sistem Karaoke Bus Pariwisata

Sistem antrean karaoke untuk bus pariwisata dengan tampilan layar TV, form penumpang, dan panel admin kontrol.

## 📂 Struktur Folder

```
karaoke-bus/
├── index.html          # Halaman menu utama
├── display.html        # Layar antrean untuk TV bus
├── form.html          # Form input penumpang
├── admin.html         # Panel admin kontrol
├── css/
│   ├── index.css      # Style untuk menu utama
│   ├── display.css    # Style untuk layar TV
│   ├── form.css       # Style untuk form penumpang
│   └── admin.css      # Style untuk panel admin
└── js/
    ├── display.js     # JavaScript untuk layar TV
    ├── form.js        # JavaScript untuk form penumpang
    └── admin.js       # JavaScript untuk panel admin
```

## 🚀 Cara Install di Visual Studio Code

### Langkah 1: Buat Folder Project
1. Buka **Visual Studio Code**
2. Klik **File** → **Open Folder**
3. Buat folder baru: `karaoke-bus`
4. Buka folder tersebut

### Langkah 2: Buat Struktur Folder
Di dalam folder `karaoke-bus`, buat:
- Folder `css/`
- Folder `js/`

### Langkah 3: Copy File-File
Copy semua file dari artifacts ke folder yang sesuai:

#### File HTML (di root folder):
- `index.html`
- `display.html`
- `form.html`
- `admin.html`

#### File CSS (di folder `css/`):
- `css/index.css`
- `css/display.css`
- `css/form.css`
- `css/admin.css`

#### File JavaScript (di folder `js/`):
- `js/display.js`
- `js/form.js`
- `js/admin.js`

### Langkah 4: Jalankan Website
1. Install extension **"Live Server"** di VS Code
2. Klik kanan pada `index.html`
3. Pilih **"Open with Live Server"**
4. Browser akan otomatis terbuka!

## 🎯 Cara Menggunakan

### 1️⃣ Setup Awal
- Buka `index.html` di browser
- Pilih menu sesuai kebutuhan

### 2️⃣ Panel Admin (Untuk Pemandu Wisata)
**URL:** `admin.html`

**Fitur:**
- ✅ QR Code otomatis untuk penumpang
- ✅ Tambah lagu manual
- ✅ Skip lagu yang sedang bermain
- ✅ Hapus antrean
- ✅ Drag & drop untuk ubah urutan (seret dari ☰)
- ✅ Monitor real-time

**Cara Pakai:**
1. Buka di HP/Tablet pemandu
2. QR Code akan muncul otomatis
3. Tunjukkan QR ke penumpang untuk scan
4. Kontrol antrean dari sini

### 3️⃣ Form Penumpang
**URL:** `form.html`

**Cara Pakai:**
1. Scan QR Code dari admin
2. Isi nama
3. Paste link YouTube lagu
4. Klik "Tambah ke Antrean"

**Format Link YouTube:**
- ✅ `https://www.youtube.com/watch?v=VIDEO_ID`
- ✅ `https://youtu.be/VIDEO_ID`
- ❌ BUKAN link playlist atau channel

### 4️⃣ Layar Antrean (TV Bus)
**URL:** `display.html`

**Fitur:**
- 📺 Video YouTube fullscreen auto-play
- 🎵 Info penyanyi yang sedang bernyanyi
- 📋 Daftar 5 antrean berikutnya
- ⚡ Auto lanjut ke lagu berikutnya
- ⚠️ Auto skip jika video error

**Cara Pakai:**
1. Buka di TV/Monitor bus
2. Klik "Mulai Lagu Pertama" (hanya sekali)
3. Setelah itu semua otomatis!

## ✨ Fitur Unggulan

### 🎵 Auto-Play Otomatis
- Setelah lagu selesai, otomatis lanjut ke lagu berikutnya
- Tidak perlu refresh atau klik manual
- Tunggu 2 detik transisi antar lagu

### ⚠️ Auto-Skip Video Error
- Jika video error (privat/dihapus/tidak valid)
- Muncul notifikasi merah
- Otomatis skip ke lagu berikutnya dalam 2 detik

### 🔄 Real-Time Sync
- Semua layar update otomatis
- Tambah lagu langsung muncul di semua device
- Tidak perlu refresh manual

### 🖱️ Drag & Drop Antrean
- Admin bisa ubah urutan dengan drag & drop
- Seret dari icon ☰ di sebelah kiri
- Drop di posisi yang diinginkan

## 🔧 Troubleshooting

### Video YouTube Tidak Muncul?
1. **Cek koneksi internet** - YouTube butuh internet
2. **Klik sekali di layar** - Browser mungkin block auto-play
3. **Cek link YouTube** - Pastikan format link benar
4. **Lihat Console** - Tekan F12, lihat tab Console untuk error

### Video Tidak Auto-Play ke Lagu Berikutnya?
1. **Interaksi pertama** - Klik sekali di layar saat pertama buka
2. **Tunggu sebentar** - Ada delay 2 detik antar lagu
3. **Cek queue** - Pastikan ada lagu di antrean

### QR Code Tidak Muncul?
1. **Cek koneksi internet** - QR generate online
2. **Tunggu beberapa detik** - Butuh waktu load
3. **Refresh halaman** - Tekan F5

### Data Hilang/Reset?
1. **Jangan clear browser data** - Data tersimpan di localStorage
2. **Gunakan browser yang sama** - Data tidak sync antar browser
3. **Untuk reset manual:** Buka Console (F12) → ketik `localStorage.clear()` → Enter

## 💡 Tips & Tricks

### Untuk Pemandu Wisata:
1. Test sistem sebelum perjalanan dimulai
2. Siapkan beberapa lagu backup di admin
3. Klik sekali di layar TV saat pertama kali
4. Monitor queue dari admin panel

### Untuk Penumpang:
1. Copy link lagu dari YouTube app
2. Pastikan bukan link playlist
3. Bisa request lebih dari 1 lagu
4. Tunggu giliran dengan sabar 😊

### Untuk Setting TV Bus:
1. Fullscreen mode (tekan F11)
2. Volume di remote TV
3. Koneksi internet stabil
4. Brightness layar cukup terang

## 📱 Device yang Dibutuhkan

### Minimum:
- **1 TV/Monitor** - Untuk display layar antrean
- **1 HP/Tablet** - Untuk admin panel
- **Internet Connection** - Untuk YouTube & QR Code

### Recommended:
- **TV 32" ke atas** - Layar lebih besar lebih jelas
- **Tablet 10"** - Admin panel lebih nyaman
- **WiFi/Hotspot** - Internet stabil

## 🎨 Customisasi

### Ubah Warna Tema:
Edit file CSS di folder `css/`:
- `index.css` - Warna menu utama
- `display.css` - Warna layar TV
- `form.css` - Warna form penumpang
- `admin.css` - Warna panel admin

Cari bagian `background: linear-gradient(...)` dan ubah warnanya.

### Ubah Maksimal Antrean:
Di file JavaScript (`js/form.js` dan `js/admin.js`):
```javascript
if (data.queue.length >= 20) {  // Ubah angka 20
```

### Ubah Delay Antar Lagu:
Di file `js/display.js`:
```javascript
setTimeout(() => {
    playNext();
}, 2000);  // Ubah 2000 (2 detik) sesuai keinginan
```

## ❓ FAQ

**Q: Apakah butuh internet?**  
A: Ya, untuk YouTube API dan QR Code generator.

**Q: Apakah data tersimpan di server?**  
A: Tidak, semua data tersimpan di browser (localStorage).

**Q: Bisa pakai di HP?**  
A: Bisa! Tapi lebih optimal di TV/Monitor untuk display.

**Q: Maksimal berapa lagu?**  
A: 20 lagu dalam antrean.

**Q: Bisa offline?**  
A: Tidak bisa, YouTube butuh internet.

## 📞 Support

Jika ada pertanyaan atau masalah:
1. Cek troubleshooting di atas
2. Lihat Console browser (F12) untuk error
3. Screenshot error dan konsultasikan

## 📝 Changelog

### Version 1.0 (Current)
- ✅ Menu utama dengan 3 pilihan
- ✅ Layar antrean dengan YouTube player
- ✅ Form penumpang dengan validasi
- ✅ Panel admin dengan drag & drop
- ✅ Auto-play antar lagu
- ✅ Auto-skip video error
- ✅ Real-time sync
- ✅ QR Code generator
- ✅ Responsive design

## 📄 License

Free to use untuk keperluan pribadi dan komersial.

---

**Dibuat dengan ❤️ untuk pengalaman karaoke bus yang lebih seru!**