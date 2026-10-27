// QuickPay Application Logic - Mobile First & Clean UI

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
let toastTimeout = null;

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

// Haptic Feedback for Mobile Feel
function triggerHaptic(duration = 15) {
    if ('vibrate' in navigator) {
        try {
            navigator.vibrate(duration);
        } catch (e) {
            // Ignore unsupported permissions
        }
    }
}

// Lightweight Toast Notification
function showToast(message, iconName = 'check-circle') {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    if (!toast) return;

    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    if (toastMessage) toastMessage.textContent = message;
    if (toastIcon && iconName) {
        toastIcon.setAttribute('data-lucide', iconName);
        if (window.lucide) lucide.createIcons();
    }

    toast.classList.remove('hidden');
    toast.classList.add('animate-toast');

    toastTimeout = setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('animate-toast');
    }, 2500);
}

// Register Service Worker for PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('ServiceWorker registered with scope:', reg.scope);
            })
            .catch(err => {
                console.warn('ServiceWorker registration error:', err);
            });
    }
}

// PWA Setup & Installation Handlers
function initPWA() {
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
        showToast('App installed successfully!', 'smartphone');
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
    triggerHaptic(20);
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showToast('Installing QuickPay...', 'download');
            }
            deferredPrompt = null;
            const installBtn = document.getElementById('pwaInstallBtn');
            if (installBtn) installBtn.classList.add('hidden');
        });
    } else {
        showToast('Use browser menu to Install App', 'info');
    }
}

function dismissIosBanner() {
    triggerHaptic(10);
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
    triggerHaptic(15);
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

    // Reset logo fallback
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

function copyUpiId() {
    triggerHaptic(20);
    const upi = merchantConfig.vpa || DEFAULT_CONFIG.vpa;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upi).then(() => {
            showToast('UPI ID copied to clipboard!', 'check');
        }).catch(() => {
            fallbackCopy(upi);
        });
    } else {
        fallbackCopy(upi);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast('UPI ID copied!', 'check');
    } catch (err) {
        showToast('Copy failed, please copy manually', 'alert-circle');
    }
    document.body.removeChild(textArea);
}

function openSettingsModal() {
    triggerHaptic(15);
    document.getElementById('settingUpiId').value = merchantConfig.vpa || '';
    document.getElementById('settingMerchantName').value = merchantConfig.name || '';
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }
}

function closeSettingsModal() {
    triggerHaptic(10);
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');
}

function saveSettings() {
    triggerHaptic(25);
    const upiId = document.getElementById('settingUpiId').value.trim();
    const merchantName = document.getElementById('settingMerchantName').value.trim();

    if (!upiId || !upiId.includes('@')) {
        showToast('Please enter a valid UPI ID (e.g. name@upi)', 'alert-circle');
        return;
    }

    merchantConfig.vpa = upiId;
    merchantConfig.name = merchantName || 'QuickPay Merchant';

    localStorage.setItem('qp_merchant_settings', JSON.stringify(merchantConfig));
    updateMerchantUI();
    closeSettingsModal();
    showToast('Merchant settings saved!', 'check-check');
}

// Amount Input Helpers
function setQuickAmount(val) {
    triggerHaptic(15);
    const amountInput = document.getElementById('paymentAmount');
    if (amountInput) {
        amountInput.value = val;
        toggleClearBtn();
    }
}

function clearAmount() {
    triggerHaptic(10);
    const amountInput = document.getElementById('paymentAmount');
    if (amountInput) {
        amountInput.value = '';
        amountInput.focus();
        toggleClearBtn();
    }
}

function toggleClearBtn() {
    const amountInput = document.getElementById('paymentAmount');
    const clearBtn = document.getElementById('clearAmountBtn');
    if (amountInput && clearBtn) {
        if (amountInput.value && parseFloat(amountInput.value) > 0) {
            clearBtn.classList.remove('hidden');
        } else {
            clearBtn.classList.add('hidden');
        }
    }
}

// Amount Visibility Toggle
function toggleAmountVisibility() {
    triggerHaptic(15);
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

// QR Code Generation Logic
function generateQRCode() {
    triggerHaptic(30);
    const inputVal = document.getElementById('paymentAmount').value;
    const amount = parseFloat(inputVal);

    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a valid amount (greater than ₹0)', 'alert-circle');
        document.getElementById('paymentAmount').focus();
        return;
    }

    currentAmount = amount;
    const formattedAmount = amount.toFixed(2);

    // Standard NPCI compliant UPI URI
    const pa = encodeURIComponent(merchantConfig.vpa);
    const pn = encodeURIComponent(merchantConfig.name);
    const am = encodeURIComponent(formattedAmount);

    generatedPaymentUri = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&mode=02&orgid=000000`;

    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
        qrContainer.innerHTML = '';

        // Generate clean high-resolution QR
        new QRCode(qrContainer, {
            text: generatedPaymentUri,
            width: 230,
            height: 230,
            colorDark: '#090e17',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    document.getElementById('displayAmount').textContent = `₹${formattedAmount}`;
    isAmountVisible = true;
    const eyeIcon = document.getElementById('amountEyeIcon');
    if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');

    document.getElementById('amountInputSection').classList.add('hidden');
    const qrDisplay = document.getElementById('qrDisplaySection');
    qrDisplay.classList.remove('hidden');
    qrDisplay.classList.add('animate-pop-in');

    if (window.lucide) lucide.createIcons();
    showToast(`QR Code generated for ₹${formattedAmount}`, 'qr-code');
}

// Download QR Code as PNG
function downloadQR() {
    triggerHaptic(20);
    const img = document.querySelector('#qrcode img');
    const canvas = document.querySelector('#qrcode canvas');

    let dataUrl = '';
    if (img && img.src) {
        dataUrl = img.src;
    } else if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
    }

    if (!dataUrl) {
        showToast('QR Code not ready for download', 'alert-circle');
        return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QuickPay-₹${currentAmount.toFixed(2)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('QR Code saved to gallery/downloads!', 'check');
}

// Share QR Code / Payment via Web Share API
function sharePayment() {
    triggerHaptic(20);
    const shareText = `Pay ₹${currentAmount.toFixed(2)} to ${merchantConfig.name} via UPI:\n${generatedPaymentUri}`;

    if (navigator.share) {
        navigator.share({
            title: `Payment to ${merchantConfig.name}`,
            text: shareText,
            url: generatedPaymentUri
        }).then(() => {
            showToast('Shared successfully!', 'share-2');
        }).catch((err) => {
            if (err.name !== 'AbortError') {
                copyPaymentLink();
            }
        });
    } else {
        copyPaymentLink();
    }
}

function copyPaymentLink() {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(generatedPaymentUri).then(() => {
            showToast('Payment link copied to clipboard!', 'link');
        });
    }
}

// Reset Back to Input View
function resetQR() {
    triggerHaptic(15);
    const amountInput = document.getElementById('paymentAmount');
    amountInput.value = '';
    toggleClearBtn();

    const qrDisplay = document.getElementById('qrDisplaySection');
    qrDisplay.classList.add('hidden');
    qrDisplay.classList.remove('animate-pop-in');

    const inputSection = document.getElementById('amountInputSection');
    inputSection.classList.remove('hidden');
    inputSection.classList.add('animate-pop-in');

    document.getElementById('qrcode').innerHTML = '';
    amountInput.focus();
}
