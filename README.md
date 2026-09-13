# WhizAuth Mobile 📱

Modern, cross-platform mobile app for **WhizAuth** built with **React Native** & **Expo** (TypeScript).
Supports iOS, Android, and Web browsers.

---

## ⚡ Features

### 👤 Customer Portal
* **Instant License Check**: View expiration, days remaining, linked product, and status.
* **1-Click HWID Reset**: Reset bound hardware ID directly from the phone.
* **Discord Integration**: Automatic account linking and authorization.
* **Product Downloads**: Direct access to client releases & universal loaders.

### 🛡️ Admin & Reseller Management (PIN/Token Protected)
* **Live License Overview**: Instant search by key, Discord tag, or HWID.
* **Quick Key Generator**: Generate keys for any product (`whizard_ai`, `whizard_v1`, `whizard_v2`, `whizard_toolbox`, etc.) with customized durations and prefixes.
* **Remote License Controls**:
  * 🔄 **HWID Reset**
  * ⏸️ **Pause / Unpause**
  * 🚫 **Ban & Revoke**
* **Active Sessions Monitor**: Real-time heartbeat tracker with 1-click session termination (`/api/session/kill`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Expo Development Server
```bash
# Start Metro bundler (scan QR code with Expo Go on your phone!)
npx expo start

# Or test directly in your browser:
npx expo start --web
```

---

## ⚙️ Configuration
The default backend points to `https://api.whizard.dev`. You can change the target server in real-time by tapping the **Settings ⚙️** icon in the app header.
