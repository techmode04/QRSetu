// QuickPay Application Logic - Public Multi-User Version

// Default Configuration (Clean & Neutral for Public Deployment)
const DEFAULT_CONFIG = {
    vpa: '',
    name: ''
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

    // First time onboarding check: if no UPI ID is saved, welcome user and open setup modal
    const saved = localStorage.getItem('qp_merchant_settings');
    if (!saved || !merchantConfig.vpa) {
        setTimeout(() => {
            openSettingsModal(true);
        }, 500);
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
    }, 2800);
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
        showToast('QuickPay installed on your phone!', 'smartphone');
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

// Settings Handling - User Specific
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
    const isConfigured = Boolean(merchantConfig.vpa);
    const merchantName = merchantConfig.name || (isConfigured ? 'My Business' : 'Set Up Business Name');
    const upiId = merchantConfig.vpa || 'Tap here to add your UPI ID';

    const nameEl = document.getElementById('displayMerchantName');
    const upiEl = document.getElementById('displayUpiId');
    const qrShopEl = document.getElementById('qrShopName');
    const qrUpiEl = document.getElementById('qrUpiId');
    const verifiedBadge = document.getElementById('merchantVerifiedBadge');
    const avatarInitial = document.getElementById('merchantAvatarInitial');
    const setupAlert = document.getElementById('setupRequiredAlert');

    if (nameEl) nameEl.textContent = merchantName;
    if (upiEl) upiEl.textContent = upiId;
    if (qrShopEl) qrShopEl.textContent = merchantName;
    if (qrUpiEl) qrUpiEl.textContent = upiId;

    // Avatar Letter or Icon
    if (avatarInitial) {
        if (isConfigured && merchantConfig.name) {
            avatarInitial.innerHTML = `<span>${merchantConfig.name.trim().charAt(0).toUpperCase()}</span>`;
        } else {
            avatarInitial.innerHTML = `<i data-lucide="store" class="w-5 h-5 text-indigo-500"></i>`;
        }
    }

    // Verified badge check
    if (verifiedBadge) {
        if (isConfigured) {
            verifiedBadge.classList.remove('hidden');
        } else {
            verifiedBadge.classList.add('hidden');
        }
    }

    // Top alert banner if not configured yet
    if (setupAlert) {
        if (isConfigured) {
            setupAlert.classList.add('hidden');
        } else {
            setupAlert.classList.remove('hidden');
        }
    }

    if (window.lucide) lucide.createIcons();
}

function copyUpiId() {
    triggerHaptic(20);
    if (!merchantConfig.vpa) {
        openSettingsModal(true);
        return;
    }

    const upi = merchantConfig.vpa;
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

function openSettingsModal(isFirstTime = false) {
    triggerHaptic(15);
    document.getElementById('settingUpiId').value = merchantConfig.vpa || '';
    document.getElementById('settingMerchantName').value = merchantConfig.name || '';

    const modalTitle = document.getElementById('settingsModalTitle');
    const modalSubtitle = document.getElementById('settingsModalSubtitle');

    if (isFirstTime || !merchantConfig.vpa) {
        if (modalTitle) modalTitle.textContent = 'Welcome! Setup Your UPI';
        if (modalSubtitle) modalSubtitle.textContent = 'Enter your own Shop Name & UPI ID to start receiving payments directly to your account.';
    } else {
        if (modalTitle) modalTitle.textContent = 'Merchant Settings';
        if (modalSubtitle) modalSubtitle.textContent = 'Edit your receiver details anytime. Payments go directly to your account.';
    }

    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
            const inputTarget = merchantConfig.name ? document.getElementById('settingUpiId') : document.getElementById('settingMerchantName');
            if (inputTarget) inputTarget.focus();
        }, 150);
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
        showToast('Please enter a valid UPI ID (e.g. name@okhdfcbank or 9876543210@paytm)', 'alert-circle');
        document.getElementById('settingUpiId').focus();
        return;
    }

    merchantConfig.vpa = upiId;
    merchantConfig.name = merchantName || 'QuickPay Merchant';

    localStorage.setItem('qp_merchant_settings', JSON.stringify(merchantConfig));
    updateMerchantUI();
    closeSettingsModal();
    showToast('Your details saved successfully!', 'check-check');
}

// Reset Stored Details
function resetSavedMerchantDetails() {
    if (confirm('Do you want to reset your saved UPI ID and Shop Name?')) {
        localStorage.removeItem('qp_merchant_settings');
        merchantConfig = { ...DEFAULT_CONFIG };
        updateMerchantUI();
        closeSettingsModal();
        showToast('Settings reset to default', 'refresh-cw');
    }
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

    // Validate if user has configured their UPI ID first
    if (!merchantConfig.vpa || !merchantConfig.vpa.includes('@')) {
        showToast('Please set your own UPI ID first!', 'alert-circle');
        openSettingsModal(true);
        return;
    }

    const inputVal = document.getElementById('paymentAmount').value;
    const amount = parseFloat(inputVal);

    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter a payment amount greater than ₹0', 'alert-circle');
        document.getElementById('paymentAmount').focus();
        return;
    }

    currentAmount = amount;
    const formattedAmount = amount.toFixed(2);

    // Standard NPCI compliant UPI URI with user's customized details
    const pa = encodeURIComponent(merchantConfig.vpa);
    const pn = encodeURIComponent(merchantConfig.name || 'Merchant');
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

    const safeName = (merchantConfig.name || 'QuickPay').replace(/[^a-zA-Z0-9]/g, '-');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${safeName}-₹${currentAmount.toFixed(2)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('QR Code saved to gallery/downloads!', 'check');
}

// Share QR Code / Payment via Web Share API
function sharePayment() {
    triggerHaptic(20);
    const shopName = merchantConfig.name || 'Merchant';
    const shareText = `Pay ₹${currentAmount.toFixed(2)} to ${shopName} via UPI:\n${generatedPaymentUri}`;

    if (navigator.share) {
        navigator.share({
            title: `Payment to ${shopName}`,
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
