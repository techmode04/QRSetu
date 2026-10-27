# 💳 QuickPay - Simple UPI Payments (PWA)

A fast, lightweight, and responsive Progressive Web App (PWA) to generate dynamic UPI QR codes with custom amounts for Indian businesses and merchants.

![QuickPay Logo](logo.png)

---

## ✨ Features

- 📱 **Mobile App Installable (PWA)**: Works like a native mobile app on Android, iOS (iPhone/iPad), and Desktop.
- ⚡ **Dynamic UPI QR Code**: Generates standard NPCI-compliant UPI payment QR codes (`upi://pay`) for any entered amount.
- 🏪 **Customizable Merchant Settings**: Easily configure Shop Name and UPI ID (VPA), saved locally in browser storage.
- 💰 **Quick Amount Chips**: One-tap quick selection buttons (₹100, ₹200, ₹500, ₹1,000).
- 🌓 **Dark & Light Mode**: Seamless theme switching with saved preference.
- 📥 **Download QR Code**: Download the generated QR code directly as a PNG image for sharing or printing.
- 📴 **Offline Ready**: Powered by Service Worker (`sw.js`) and Web App Manifest (`manifest.json`).

---

## 📁 Project Structure

```text
Quick-Pay/
├── index.html          # Clean HTML structure
├── css/
│   └── style.css       # Custom styles, fonts, and animations
├── js/
│   └── app.js          # Application logic, PWA handlers, and QR generator
├── manifest.json       # Web App Manifest for mobile installation
├── sw.js               # Service Worker for offline capability & PWA install
├── logo.png            # 512x512 Main App Icon (used for installed app logo)
├── logo-192.png        # 192x192 Standard App Icon
├── .gitignore          # Git ignore rules
└── README.md           # Documentation & GitHub deployment guide
```

---

## 📲 How to Install as an App on Mobile

### 🤖 Android (Google Chrome / Brave / Edge)
1. Open the website URL in Google Chrome.
2. Tap the **"Install App"** button at the top header, OR tap the Chrome menu (3 dots) in the top-right corner.
3. Select **"Install app"** or **"Add to Home screen"**.
4. The app icon will appear on your home screen with `logo.png`.

### 🍎 iPhone / iPad (iOS Safari)
1. Open the website URL in **Safari**.
2. Tap the **Share** button (box with an arrow pointing up) at the bottom toolbar.
3. Scroll down and tap **"Add to Home Screen"** (`होम स्क्रीन पर जोड़ें`).
4. Tap **Add**. The QuickPay app will be installed with `logo.png` as its icon.

---

## 🚀 How to Upload to GitHub and Host with GitHub Pages

### 1. Initialize Git and Commit

Open PowerShell or Terminal inside the `Quick-Pay` folder and run:

```bash
git init
git add .
git commit -m "Initial commit: QuickPay UPI Generator PWA"
git branch -M main
```

### 2. Connect to your GitHub Repository

Create a new repository on [GitHub](https://github.com/new) (e.g. `quick-pay`), then run:

```bash
git remote add origin https://github.com/<YOUR-USERNAME>/quick-pay.git
git push -u origin main
```

### 3. Enable GitHub Pages (Free Live URL)

1. Go to your repository on GitHub.
2. Click on **Settings** > **Pages** (in the left sidebar).
3. Under **Build and deployment** > **Branch**, select `main` and root `/ (root)`.
4. Click **Save**.
5. Within 1-2 minutes, your live site will be ready at:
   `https://<YOUR-USERNAME>.github.io/quick-pay/`

Now open this link on your phone to install it as an app!

---

## 🎨 Changing Your App Logo or Merchant Details

- **Change App Icon / Logo**: Simply replace `logo.png` (and `logo-192.png`) with your own image (recommended size: 512x512 PNG).
- **Change Default Merchant**: Click the ⚙️ (Settings) icon inside the app to change your UPI ID and Shop Name anytime.

---

## 📄 License
MIT License. Created with ❤️ for Indian merchants and small businesses.
