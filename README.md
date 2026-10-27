# 💳 QRSetu - Simple UPI Payments (PWA)

A fast, lightweight, and modern Progressive Web App (PWA) to generate dynamic UPI QR codes with custom amounts for Indian businesses, shopkeepers, freelancers, and individuals.

![QRSetu Logo](logo.png)

---

## 🌟 100% Public & Multi-User Ready

QRSetu is designed to be **publicly shared and installed by anyone**:
- 🔒 **Client-Side & Private**: Every user sets their **own UPI ID** and **Shop / Business Name**.
- 💾 **Local Storage**: User details are saved securely on their own device (`localStorage`). No backend or database required.
- 👋 **Automatic Onboarding**: First-time visitors are welcomed with a setup popup to enter their UPI ID and shop name.
- ⚡ **Instant UPI QR**: Generates dynamic NPCI-compliant QR codes (`upi://pay`) for exact amounts.

---

## ✨ Features

- 📱 **Mobile App Installable (PWA)**: Works like a native mobile app on Android, iOS (iPhone/iPad), and Desktop.
- ⚡ **Dynamic UPI QR Code**: Enter any amount, and the QR code updates automatically with that fixed amount.
- 🏪 **Customizable Merchant Profile**: Easily edit Shop Name & UPI ID anytime with a single tap.
- 💰 **Quick Amount Chips**: Instant one-tap chips (`₹100`, `₹200`, `₹500`, `₹1,000`, `₹2,000`, `₹5,000`).
- 🌓 **OLED Dark & Clean Light Mode**: Automatic preference detection and manual toggle.
- 📥 **Download & Share**: Save QR code image or share payment links via WhatsApp / Telegram / SMS.
- 📴 **Offline Ready**: Powered by Service Worker (`sw.js`) and Web App Manifest (`manifest.json`).

---

## 📁 Project Structure

```text
Quick-Pay/
├── index.html          # Clean HTML structure
├── css/
│   └── style.css       # Custom styles, fonts, and animations
├── js/
│   └── app.js          # App logic, multi-user storage, and QR generator
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
2. Tap the **"Install"** button at the top header, OR tap the Chrome menu (3 dots) in the top-right corner.
3. Select **"Install app"** or **"Add to Home screen"**.
4. The app will be installed on your home screen with `logo.png`.

### 🍎 iPhone / iPad (iOS Safari)
1. Open the website URL in **Safari**.
2. Tap the **Share** button (box with an arrow pointing up) at the bottom toolbar.
3. Scroll down and tap **"Add to Home Screen"** (`होम स्क्रीन पर जोड़ें`).
4. Tap **Add**. The QRSetu app will be installed with `logo.png` as its icon.

Anyone who opens this link can install it and use it with their own UPI ID!

---

## 📄 License
MIT License. Created with ❤️ for merchants and businesses everywhere.
