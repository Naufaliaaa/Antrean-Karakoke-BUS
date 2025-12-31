# 🎤 Karaoke Bus System

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![YouTube API](https://img.shields.io/badge/YouTube_API-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://developers.google.com/youtube)

**Sistem Antrean Karaoke Bus Real-time dengan WebRTC Video Streaming**

Solusi lengkap untuk mengelola antrean karaoke di bus pariwisata dengan fitur streaming video real-time, emote interaktif, dan manajemen multi-bus yang powerful.

---

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage Guide](#-usage-guide)
- [Security](#-security)
- [API Reference](#-api-reference)
- [File Structure](#-file-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎵 **Queue Management**
- ✅ Real-time song queue synchronization
- ✅ Drag & drop reordering (Admin)
- ✅ Auto-play with 10-minute timer per song
- ✅ YouTube video embed validation
- ✅ Device-based request limiter (1 song per device)
- ✅ Manual song addition by admin
- ✅ Skip & delete song controls

### 📺 **Display System**
- ✅ Full-screen YouTube player
- ✅ Now playing indicator with countdown
- ✅ Queue preview (next songs)
- ✅ Real-time emote animations (RTL ↔ LTR)
- ✅ Picture-in-Picture (PiP) camera stream
- ✅ Auto error handling for broken videos

### 🎥 **Camera Panel**
- ✅ WebRTC live streaming to display
- ✅ Front/back camera flip
- ✅ Video recording with preview
- ✅ iOS-compatible manual save
- ✅ Picture-in-Picture integration
- ✅ Connection status monitoring

### 🎭 **Interactive Emotes**
- ✅ Real-time emote sending to display
- ✅ Smooth horizontal animations
- ✅ Multiple emote types (👏 😍 👍 😂 ❤️ 🔥)
- ✅ User name display with emote
- ✅ Auto-cleanup after display

### 🏢 **Multi-Bus Support**
- ✅ 7 pre-configured buses (expandable)
- ✅ Custom room ID support
- ✅ Isolated data per bus
- ✅ Unique PIN protection per bus
- ✅ QR code generation for passengers

### 🔐 **Security Layers**
- ✅ **PIN Authentication** - Bus access control
- ✅ **Admin Password** - Queue management access
- ✅ **Display Password** - Screen control access
- ✅ **Camera Password** - Video panel access
- ✅ Session management with timeout
- ✅ Direct URL access prevention
- ✅ Token-based authentication

### 🎨 **User Experience**
- ✅ Beautiful custom modal system (no browser alerts)
- ✅ Responsive mobile-first design
- ✅ Smooth animations & transitions
- ✅ Real-time status indicators
- ✅ Auto-save user names (localStorage)
- ✅ Offline-ready architecture

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  FIREBASE REALTIME DATABASE                 │
│                                                             │
│  karaoke/                                                   │
│    └── room/                                                │
│         ├── BUS-001/                                        │
│         │    ├── Setting/                                   │
│         │    │    ├── pin: 10****                           │
│         │    │    ├── busName: "Bus 1"                      │
│         │    │    ├── adminPassword: "ka************"       │
│         │    │    ├── displayPassword: "di************"     │
│         │    │    └── cameraPassword: "pa************"      │
│         │    ├── queue/                                     │
│         │    │    ├── {songId}/                             │
│         │    │    │    ├── name: "John Doe"                 │
│         │    │    │    ├── videoId: "dQw4w9WgXcQ"           │
│         │    │    │    ├── order: 1                         │
│         │    │    │    ├── deviceId: "DEV_..."             │
│         │    │    │    └── createdAt: 1234567890            │
│         │    ├── emotes/                                    │
│         │    │    └── {emoteId}/                            │
│         │    │         ├── name: "Alice"                    │
│         │    │         ├── emote: "👏"                      │
│         │    │         ├── emoteName: "Tepuk Tangan"        │
│         │    │         └── timestamp: 1234567890            │
│         │    └── videoSession/                              │
│         │         ├── cameraStatus: "connected"             │
│         │         ├── offer: {...}                          │
│         │         ├── answer: {...}                         │
│         │         ├── cameraCandidates: [...]               │
│         │         └── displayCandidates: [...]              │
│         ├── BUS-002/                                        │
│         └── ...                                             │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   ADMIN PANEL   │  │  DISPLAY SCREEN │  │  PASSENGER FORM │
│                 │  │                 │  │                 │
│ • Queue Control │  │ • YouTube Player│  │ • Song Request  │
│ • Drag & Drop   │  │ • PiP Camera    │  │ • Emote Sender  │
│ • Manual Add    │  │ • Emote Display │  │ • Queue Status  │
│ • Skip/Delete   │  │ • Real-time Sync│  │ • Device Limit  │
│ • QR Generator  │  │ • Auto-play     │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                                          
         ▼                                          
┌─────────────────────────────────────────────────┐
│              CAMERA PANEL (WebRTC)              │
│                                                 │
│ • Live Streaming to Display                     │
│ • Front/Back Camera                             │
│ • Recording (iOS Compatible)                    │
│ • Connection Monitoring                         │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### **Frontend**
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **Vanilla JavaScript** - No framework dependencies
- **YouTube IFrame API** - Video player integration

### **Backend & Database**
- **Firebase Realtime Database** - Real-time data synchronization
- **Firebase Hosting** (optional) - Static site hosting

### **Communication**
- **WebRTC** - Peer-to-peer video streaming
- **STUN Servers** - NAT traversal (Google STUN)

### **APIs & Libraries**
- **YouTube Data API v3** - Video validation
- **QR Server API** - QR code generation
- **MediaRecorder API** - Video recording

---

## 📦 Installation

### **Prerequisites**
```bash
# Required
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Firebase account (free tier works)

# Optional
- Node.js (for local development server)
- Git (for version control)
```

### **Step 1: Clone Repository**
```bash
git clone https://github.com/yourusername/karaoke-bus-system.git
cd karaoke-bus-system
```

### **Step 2: Firebase Setup**

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable **Realtime Database**
   - Go to Realtime Database
   - Click "Create Database"
   - Start in **Test Mode** (or configure rules later)
   - Choose region: **asia-southeast1** (Singapore)

3. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll to "Your apps" > Web app
   - Copy the configuration object

4. Update `js/firebase.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### **Step 3: Configure Firebase Database Rules**

Go to Firebase Console > Realtime Database > Rules:

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
          "emotes": {
            ".read": true,
            ".write": true,
            "$emoteId": {
              ".validate": "
                newData.hasChildren(['name','emote','timestamp']) &&
                newData.child('name').isString() &&
                newData.child('emote').isString() &&
                newData.child('timestamp').isNumber()
              "
            }
          },
          "Setting": {
            ".read": true,
            ".write": true
          },
          "videoSession": {
            ".read": true,
            ".write": true
          }
        }
      }
    }
  }
}
```

### **Step 4: Initialize Database Structure**

Manually add this data structure in Firebase Console:

```json
{
  "karaoke": {
    "room": {
      "BUS-001": {
        "Setting": {
          "pin": 101010,
          "busName": "Bus 1",
          "adminPassword": "ka****************",
          "displayPassword": "di***********",
          "cameraPassword": "pa*******************"
        }
      },
      "BUS-002": {
        "Setting": {
          "pin": 202020,
          "busName": "Bus 2",
          "adminPassword": "ka****************",
          "displayPassword": "di***********",
          "cameraPassword": "pa*******************"
        }
      }
    }
  }
}
```

### **Step 5: Run Local Server**

**Option A: Using Python**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B: Using Node.js**
```bash
npx http-server -p 8000
```

**Option C: Using VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` > Open with Live Server

### **Step 6: Access the System**

Open browser and navigate to:
```
http://localhost:8000
```

---

## ⚙️ Configuration

### **Bus Configuration** (`js/index.js`)

```javascript
const buses = [
  { id: 'BUS-001', name: 'Bus 1', color: '#667eea' },
  { id: 'BUS-002', name: 'Bus 2', color: '#f093fb' },
  { id: 'BUS-003', name: 'Bus 3', color: '#4facfe' },
  { id: 'BUS-004', name: 'Bus 4', color: '#43e97b' },
  { id: 'BUS-005', name: 'Bus 5', color: '#fa709a' },
  { id: 'BUS-006', name: 'Bus 6', color: '#feca57' },
  { id: 'BUS-007', name: 'Bus 7', color: '#ff6b6b' },
];
```

**To add more buses:**
1. Add new object to `buses` array
2. Create corresponding room in Firebase with Setting data
3. Set unique PIN for the bus

### **Password Configuration**

**Admin Panel** (`js/admin-login.js`):
```javascript
const ADMIN_PASSWORD = "ka****************";
```

**Display Screen** (`js/display-login.js`):
```javascript
const DISPLAY_PASSWORD = "di***********";
```

**Camera Panel** (`js/camera-login.js`):
```javascript
const CAMERA_PASSWORD = "pa*******************";
```

### **Session Timeout Configuration**

**Admin Session** (`js/admin-page.js`):
```javascript
const twoHours = 2 * 60 * 60 * 1000; // 2 hours
```

**Display Session** (`js/display-page.js`):
```javascript
const eightHours = 8 * 60 * 60 * 1000; // 8 hours
```

**Camera Session** (`js/video-panel-page.js`):
```javascript
const fourHours = 4 * 60 * 60 * 1000; // 4 hours
```

### **Video Timer** (`js/display.js`):
```javascript
const MAX_DURATION = 600; // 10 minutes (600 seconds)
```

---

## 📖 Usage Guide

### **For Passengers (Penumpang)**

1. **Access the System**
   - Scan QR code displayed in bus
   - OR open URL and select your bus
   - Enter 6-digit PIN (ask bus crew)

2. **Request a Song**
   - Click "Request Lagu" button
   - Enter your name
   - Paste YouTube video URL
   - Click "Tambah ke Antrean"
   - ✅ System validates video can be embedded
   - ✅ One song per device at a time

3. **Send Emotes**
   - Enter your name (same as song request)
   - Tap emote buttons (👏 😍 👍 😂 ❤️ 🔥)
   - Your emote appears on main display
   - Limit: 1 emote per 2 seconds

4. **Check Queue Status**
   - See total queue count
   - View your position
   - Get notified when you're up next

### **For Admin**

1. **Login**
   - Access bus menu
   - Click "Panel Admin"
   - Enter admin password: `ka********` (masked for security)

2. **Manage Queue**
   - **Drag & Drop** - Reorder songs by dragging
   - **Add Manual** - Add song without device limit
   - **Skip** - Skip currently playing song
   - **Delete** - Remove song from queue
   - **Reset All** - Clear entire queue

3. **View Statistics**
   - Total queue count (max 20 songs)
   - Now playing info
   - Device IDs for tracking

4. **Generate QR Code**
   - QR code auto-generated for passenger access
   - Share URL displayed below QR

### **For Display Operator**

1. **Login**
   - Click "Layar Karaoke"
   - Enter display password: `di*******` (masked for security)

2. **Activate System**
   - Click "MULAI KARAOKE" overlay button
   - YouTube player initializes
   - Auto-plays first song in queue

3. **Monitor Display**
   - YouTube video plays full-screen (55% height)
   - Queue list shows next songs (45% height)
   - Emotes animate across screen (RTL ↔ LTR)
   - PiP camera in bottom-right corner
   - Countdown timer shows remaining time

4. **Auto Features**
   - Auto-skip after 10 minutes
   - Auto-play next song
   - Error handling for broken videos
   - Connection status monitoring

### **For Camera Operator**

1. **Login**
   - Click "Video Panel"
   - Enter camera password: `pa*****************` (masked for security)

2. **Start Camera**
   - Click "Aktifkan Kamera"
   - Allow browser camera permission
   - Camera feed appears on display (PiP mode)

3. **Camera Controls**
   - **🔄 Balik Kamera** - Switch front/back camera
   - **⏺️ Mulai Rekam** - Start recording
   - **⏹️ Stop Rekam** - Stop and preview recording
   - **⏹️ Stop Kamera** - Disconnect camera

4. **Recording (iOS Compatible)**
   - Records video locally
   - Shows preview after recording
   - iOS users: Long press video > Save Video
   - Android: Auto-download button

---

## 🔐 Security

### **Authentication Flow**

```
┌─────────────────────────────────────────────────┐
│  LEVEL 1: PIN Authentication (Bus Access)      │
│  • 6-digit numeric PIN per bus                 │
│  • Session token stored in sessionStorage      │
│  • Required for bus menu access                │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  LEVEL 2: Role-Based Passwords                 │
│  ├─ Admin: ka************ (2h session)         │
│  ├─ Display: di*********** (8h session)        │
│  └─ Camera: pa******************* (4h session) │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  LEVEL 3: Token Validation                     │
│  • Secure token generation with hash           │
│  • Timestamp-based expiration                  │
│  • Stored in sessionStorage (tab-specific)     │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  LEVEL 4: Direct URL Prevention                │
│  • Auth check on page load                     │
│  • Auto-redirect if unauthorized               │
│  • Session cleanup on logout                   │
└─────────────────────────────────────────────────┘
```

### **Default Credentials**

> ⚠️ **IMPORTANT**: Change these passwords in production!

| Role | Default Password | Location | Session |
|------|-----------------|----------|---------|
| **Bus PIN** | `10****` (BUS-001) | Firebase Setting | Until logout |
| **Admin** | `ka****************` | `admin-login.js` | 2 hours |
| **Display** | `di***********` | `display-login.js` | 8 hours |
| **Camera** | `pa*******************` | `camera-login.js` | 4 hours |

### **Security Best Practices**

1. **Change Default Passwords**
   ```javascript
   // js/admin-login.js
   const ADMIN_PASSWORD = "your_secure_password_here";
   
   // js/display-login.js
   const DISPLAY_PASSWORD = "your_secure_password_here";
   
   // js/camera-login.js
   const CAMERA_PASSWORD = "your_secure_password_here";
   ```

2. **Secure Firebase Rules**
   - Set proper read/write permissions
   - Validate data structure
   - Limit request rates

3. **HTTPS Only**
   - Deploy with HTTPS (required for camera access)
   - WebRTC requires secure context

4. **Regular Password Updates**
   - Change passwords monthly
   - Use strong passwords (12+ characters)
   - Mix uppercase, lowercase, numbers, symbols

### **Rate Limiting**

```javascript
// Emote: 1 per 2 seconds
// Song Request: 1 per 10 seconds (per device)
// Queue Actions: No simultaneous requests
```

---

## 📚 API Reference

### **RoomManager** (`js/room.js`)

#### `getRoomId()`
Returns the current room ID from URL or localStorage.

```javascript
const roomId = RoomManager.getRoomId();
// Returns: "BUS-001"
```

#### `getRoomRef()`
Returns Firebase reference to current room.

```javascript
const roomRef = RoomManager.getRoomRef();
// Returns: firebase.database.Reference
```

#### `getQueueRef()`
Returns Firebase reference to queue.

```javascript
const queueRef = RoomManager.getQueueRef();
// Returns: firebase.database.Reference
```

#### `verifyRoomPassword(roomId, password)`
Verifies room password against Firebase.

```javascript
const isValid = await RoomManager.verifyRoomPassword('BUS-001', 'password');
// Returns: boolean
```

#### `generateRoomQR()`
Generates QR code for room access.

```javascript
RoomManager.generateRoomQR();
// Displays QR code in designated element
```

### **Custom Modal System** (`js/custom-modal.js`)

#### `customAlert(message, options)`
Shows custom alert dialog.

```javascript
await customAlert('Song added successfully!', {
  title: 'Success',
  icon: '✅',
  buttonText: 'OK'
});
```

#### `customConfirm(message, options)`
Shows custom confirmation dialog.

```javascript
const result = await customConfirm('Delete this song?', {
  title: 'Confirm Delete',
  icon: '🗑️',
  confirmText: 'Yes, Delete',
  cancelText: 'Cancel'
});
// Returns: boolean
```

#### `customSuccess(message, title)`
Shows success message.

```javascript
await customSuccess('Song deleted successfully!', 'Success!');
```

#### `customError(message, title)`
Shows error message.

```javascript
await customError('Failed to connect to database', 'Connection Error');
```

---

## 📁 File Structure

```
karaoke-bus-system/
│
├── index.html                 # Bus selection page
├── pin-login.html             # PIN authentication
├── bus-menu.html              # Main menu (4 options)
├── form.html                  # Passenger song request
├── emote.html                 # Emote sender (standalone)
├── admin-login.html           # Admin authentication
├── admin.html                 # Admin panel
├── display-login.html         # Display authentication
├── display.html               # Main karaoke display
├── camera-login.html          # Camera authentication
├── video-panel.html           # Camera panel
├── camera-stream.html         # Camera stream (legacy)
│
├── css/
│   ├── index.css              # Bus selection styles
│   ├── pin-login.css          # PIN login styles
│   ├── bus-menu.css           # Menu styles
│   ├── form.css               # Request form styles
│   ├── emote.css              # Emote page styles
│   ├── admin-login.css        # Admin login styles
│   ├── admin.css              # Admin panel styles
│   ├── display-login.css      # Display login styles
│   ├── display.css            # Display screen styles
│   ├── camera-login.css       # Camera login styles
│   └── video-panel.css        # Camera panel styles
│
├── js/
│   ├── firebase.js            # Firebase configuration
│   ├── room.js                # Room management (RoomManager)
│   ├── custom-modal.js        # Custom modal system
│   ├── index.js               # Bus selection logic
│   ├── pin-login.js           # PIN authentication
│   ├── bus-menu.js            # Menu navigation
│   ├── form.js                # Song request logic
│   ├── emote.js               # Emote logic (standalone page)
│   ├── admin-login.js         # Admin authentication
│   ├── admin-page.js          # Admin page init
│   ├── admin.js               # Admin panel logic
│   ├── display-login.js       # Display authentication
│   ├── display-page.js        # Display page init
│   ├── display.js             # Display logic (player + emotes)
│   ├── camera-login.js        # Camera authentication
│   ├── video-panel-page.js    # Camera page init
│   ├── video-panel.js         # Camera panel logic
│   └── camera-stream.js       # Camera stream (legacy)
│
└── README.md                  # This file
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Firebase Connection Failed**
```
Error: Unable to connect to Firebase
```

**Solution:**
- Check Firebase config in `js/firebase.js`
- Verify database URL is correct
- Check Firebase Database Rules
- Ensure internet connection is stable

#### **2. YouTube Video Won't Play**
```
Error: Video cannot be embedded
```

**Solution:**
- Video owner disabled embedding
- Try different video
- System shows error message automatically
- Admin can skip and play next song

#### **3. Camera Not Working**
```
Error: Camera access denied
```

**Solution:**
- Grant camera permission in browser
- Check if HTTPS is enabled (required for camera)
- Try different browser (Chrome recommended)
- Check if camera is used by another app

#### **4. WebRTC Connection Failed**
```
Error: Failed to establish connection
```

**Solution:**
- Check firewall settings
- Ensure STUN servers are accessible
- Try refreshing both camera and display
- Check network connectivity

#### **5. Session Expired**
```
Error: Session timeout
```

**Solution:**
- Login again with password
- Sessions expire after:
  - Admin: 2 hours
  - Display: 8 hours
  - Camera: 4 hours

#### **6. Direct URL Access Denied**
```
Error: Unauthorized access
```

**Solution:**
- This is intentional security feature
- Always login through proper flow:
  1. Select bus
  2. Enter PIN
  3. Choose function
  4. Enter function password

### **Browser Compatibility**

| Browser | Queue | Display | Camera | Recording |
|---------|-------|---------|--------|-----------|
| Chrome 90+ | ✅ | ✅ | ✅ | ✅ |
| Firefox 88+ | ✅ | ✅ | ✅ | ✅ |
| Safari 14+ | ✅ | ✅ | ✅ | ⚠️ Manual save |
| Edge 90+ | ✅ | ✅ | ✅ | ✅ |

⚠️ iOS Safari requires manual video save (long press > Save Video)

### **Performance Optimization**

**If experiencing lag:**

1. **Reduce queue size**
   ```javascript
   // Limit to 15 songs instead of 20
   if (queueCount >= 15) {
     showAlert('Queue is full!');
   }
   ```

2. **Clear old emotes faster**
   ```javascript
   // In display.js, reduce timeout from 10s to 6s
   setTimeout(() => {
     emoteEl.remove();
   }, 6000);
   ```

3. **Lower video quality**
   ```javascript
   // In display.js playerVars
   playerVars: { 
     autoplay: 1, 
     controls: 1,
     vq: 'medium' // Force medium quality
   }
   ```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### **Reporting Bugs**
1. Check existing issues first
2. Create detailed bug report with:
   - Browser & version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors (if any)

### **Suggesting Features**
1. Open an issue with [FEATURE] prefix
2. Describe the feature in detail
3. Explain use case and benefits

### **Pull Requests**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### **Code Style**
- Use camelCase for variables and functions
- Add comments for complex logic
- Follow existing code structure
- Test thoroughly before submitting

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Karaoke Bus System

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
```

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yNaufaliaaa](https://github.com/Naufaliaaa)
- Email: naufalzul45@gmail.com
- Website: [hiookaraoke.com](https://iridescent-alfajores-f0baae.netlify.app/index.html)

---

## 🙏 Acknowledgments

- **Firebase** - Real-time database and hosting
- **YouTube** - Video player API
- **Google** - STUN servers for WebRTC
- **QR Server** - QR code generation API
- **Community** - Thanks to all contributors!

---

## 📞 Support

Need help? Here's how to get support:

1. **Documentation** - Read this README thoroughly
2. **Issues** - Check [GitHub Issues](https://github.com/yourusername/karaoke-bus-system/issues)
3. **Discussions** - Join [GitHub Discussions](https://github.com/yourusername/karaoke-bus-system/discussions)
4. **Email** - Contact: support@example.