// QuickPay Application Script

// Default Merchant Configuration
const DEFAULT_CONFIG = {
    vpa: 'dhislesachin04@ybl',
    name: 'Dhisle Hardware And Traders'
};

// Global State Variables
let merchantConfig = { ...DEFAULT_CONFIG };
let generatedPaymentUri = '';
let currentAmount = 0;
let isAmountVisible = true;
let deferredPrompt = null;

// Initialize Application
window.addEventListener('load', () => {
    initTheme();
    loadSettings();
    initPWA();
    registerServiceWorker();
    if (window.lucide) {
        lucide.createIcons();
    }
});

// Register Service Worker for PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('ServiceWorker registered successfully with scope:', reg.scope);
                })
                .catch(err => {
                    console.warn('ServiceWorker registration failed:', err);
                });
        });
    }
}

// PWA Setup & Installation Handlers
function initPWA() {
    // Android / Chrome / Desktop install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) {
            installBtn.classList.remove('hidden');
        }
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        const installBtn = document.getElementById('pwaInstallBtn');
        if (installBtn) installBtn.classList.add('hidden');
        console.log('QuickPay successfully installed as PWA');
    });

    // iOS Safari Detection
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isIos && !isStandalone && !localStorage.getItem('qp_ios_banner_dismissed')) {
        const iosBanner = document.getElementById('iosInstallBanner');
        if (iosBanner) {
            iosBanner.classList.remove('hidden');
        }
    }
}

function triggerPWAInstall() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the PWA install prompt');
            }
            deferredPrompt = null;
            const installBtn = document.getElementById('pwaInstallBtn');
            if (installBtn) installBtn.classList.add('hidden');
        });
    }
}

function dismissIosBanner() {
    localStorage.setItem('qp_ios_banner_dismissed', 'true');
    const iosBanner = document.getElementById('iosInstallBanner');
    if (iosBanner) {
        iosBanner.classList.add('hidden');
    }
}

// Theme Toggle (Light/Dark Mode)
function initTheme() {
    const savedTheme = localStorage.getItem('qp_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeIcon();
}

function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('qp_theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.documentElement.classList.contains('dark');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        if (window.lucide) lucide.createIcons();
    }
}

// Settings Handling
function loadSettings() {
    const saved = localStorage.getItem('qp_merchant_settings');
    if (saved) {
        try {
            merchantConfig = JSON.parse(saved);
        } catch (e) {
            merchantConfig = { ...DEFAULT_CONFIG };
        }
    } else {
        merchantConfig = { ...DEFAULT_CONFIG };
    }
    updateMerchantUI();
}

function updateMerchantUI() {
    const merchantName = merchantConfig.name || DEFAULT_CONFIG.name;
    const upiId = merchantConfig.vpa || DEFAULT_CONFIG.vpa;

    const nameEl = document.getElementById('displayMerchantName');
    const upiEl = document.getElementById('displayUpiId');
    const qrShopEl = document.getElementById('qrShopName');
    const qrUpiEl = document.getElementById('qrUpiId');

    if (nameEl) nameEl.textContent = merchantName;
    if (upiEl) upiEl.textContent = upiId;
    if (qrShopEl) qrShopEl.textContent = merchantName;
    if (qrUpiEl) qrUpiEl.textContent = upiId;

    // Reset logo image visibility check
    const imgEl = document.getElementById('merchantLogoImg');
    const fallbackEl = document.getElementById('merchantLogoFallback');
    if (imgEl) imgEl.classList.remove('hidden');
    if (fallbackEl) fallbackEl.classList.add('hidden');
}

function handleLogoError(img) {
    if (img) img.classList.add('hidden');
    const fallback = document.getElementById('merchantLogoFallback');
    if (fallback) {
        fallback.textContent = (merchantConfig.name || 'D').charAt(0).toUpperCase();
        fallback.classList.remove('hidden');
    }
}

function openSettingsModal() {
    document.getElementById('settingUpiId').value = merchantConfig.vpa || '';
    document.getElementById('settingMerchantName').value = merchantConfig.name || '';
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.remove('hidden');
}

function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
}

function saveSettings() {
    const upiId = document.getElementById('settingUpiId').value.trim();
    const merchantName = document.getElementById('settingMerchantName').value.trim();

    if (!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. name@upi)');
        return;
    }

    merchantConfig.vpa = upiId;
    merchantConfig.name = merchantName || 'Merchant Payment';

    localStorage.setItem('qp_merchant_settings', JSON.stringify(merchantConfig));
    updateMerchantUI();
    closeSettingsModal();
}

// Quick Amount Selectors
function setQuickAmount(val) {
    const amountInput = document.getElementById('paymentAmount');
    if (amountInput) {
        amountInput.value = val;
        amountInput.focus();
    }
}

// Amount Visibility Toggle
function toggleAmountVisibility() {
    isAmountVisible = !isAmountVisible;
    const amountEl = document.getElementById('displayAmount');
    const eyeIcon = document.getElementById('amountEyeIcon');

    if (amountEl && eyeIcon) {
        if (isAmountVisible) {
            amountEl.textContent = `₹${currentAmount.toFixed(2)}`;
            eyeIcon.setAttribute('data-lucide', 'eye');
        } else {
            amountEl.textContent = '₹ ••••';
            eyeIcon.setAttribute('data-lucide', 'eye-off');
        }
        if (window.lucide) lucide.createIcons();
    }
}

// QR Code Logic
function generateQRCode() {
    const inputVal = document.getElementById('paymentAmount').value;
    const amount = parseFloat(inputVal);

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid payment amount greater than 0.');
        return;
    }

    currentAmount = amount;
    const formattedAmount = amount.toFixed(2);

    // Standard NPCI compliant UPI URI with fixed amount parameters
    const pa = encodeURIComponent(merchantConfig.vpa);
    const pn = encodeURIComponent(merchantConfig.name);
    const am = encodeURIComponent(formattedAmount);

    generatedPaymentUri = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&mode=02&orgid=000000`;

    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
        qrContainer.innerHTML = '';

        // Generate high quality scannable QR Code
        new QRCode(qrContainer, {
            text: generatedPaymentUri,
            width: 220,
            height: 220,
            colorDark: '#0f172a',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    document.getElementById('displayAmount').textContent = `₹${formattedAmount}`;
    isAmountVisible = true;
    const eyeIcon = document.getElementById('amountEyeIcon');
    if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');

    document.getElementById('amountInputSection').classList.add('hidden');
    document.getElementById('qrDisplaySection').classList.remove('hidden');
    document.getElementById('qrDisplaySection').classList.add('fade-in');

    if (window.lucide) lucide.createIcons();
}

function downloadQR() {
    const img = document.querySelector('#qrcode img');
    const canvas = document.querySelector('#qrcode canvas');

    let dataUrl = '';
    if (img && img.src) {
        dataUrl = img.src;
    } else if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
    }

    if (!dataUrl) {
        alert('QR code image unavailable for download.');
        return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QuickPay-QR-₹${currentAmount.toFixed(2)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetQR() {
    document.getElementById('paymentAmount').value = '';
    document.getElementById('qrDisplaySection').classList.add('hidden');
    document.getElementById('amountInputSection').classList.remove('hidden');
    document.getElementById('amountInputSection').classList.add('fade-in');
    document.getElementById('qrcode').innerHTML = '';
}
