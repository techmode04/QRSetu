// QRSetu Application Logic - Robust UPI & Multi-User Support

// Default Configuration (Clean & Neutral for Public Deployment)
const DEFAULT_CONFIG = {
    vpa: '',
    name: '',
    bank: '',
    activeAccountIndex: 0,
    accounts: [
        { bank: '', upi: '' },
        { bank: '', upi: '' },
        { bank: '', upi: '' }
    ]
};

// Global State Variables
let merchantConfig = { ...DEFAULT_CONFIG };
let generatedPaymentUri = '';
let currentAmount = 0;
let isAmountVisible = true;
let deferredPrompt = null;
let toastTimeout = null;
let currentNavState = 'home'; // Navigation state: 'home' | 'qr' | 'success' | 'settings'

// Initialize Application
window.addEventListener('load', () => {
    initTheme();
    loadSettings();
    initPWA();
    registerServiceWorker();
    initNavigationHistory();
    if (window.lucide) {
        lucide.createIcons();
    }

    // First-time onboarding check: if no UPI ID is saved, open setup modal gracefully
    const saved = localStorage.getItem('qp_merchant_settings');
    if (!saved || !merchantConfig.vpa) {
        setTimeout(() => {
            const modal = document.getElementById('settingsModal');
            // Only open if not already open
            if (modal && modal.classList.contains('hidden')) {
                openSettingsModal(true);
            }
        }, 400);
    }
});

// ==========================================
// Mobile Back Button / Navigation History Manager
// ==========================================
function initNavigationHistory() {
    if (window.history && window.history.replaceState) {
        history.replaceState({ view: 'home' }, '');
    }
    currentNavState = 'home';

    window.addEventListener('popstate', () => {
        handleMobileBackPress();
    });
}

function handleMobileBackPress() {
    // 1. If Payment Success Modal is open -> close modal and return to home screen
    const successModal = document.getElementById('paymentSuccessModal');
    if (successModal && !successModal.classList.contains('hidden')) {
        successModal.classList.add('hidden');
        performResetToHome();
        currentNavState = 'home';
        return;
    }

    // 2. If Settings Modal is open -> close settings modal
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal && !settingsModal.classList.contains('hidden')) {
        settingsModal.classList.add('hidden');
        const qrDisplay = document.getElementById('qrDisplaySection');
        if (qrDisplay && !qrDisplay.classList.contains('hidden')) {
            currentNavState = 'qr';
        } else {
            currentNavState = 'home';
        }
        return;
    }

    // 3. If QR Screen is open -> return to home screen
    const qrDisplay = document.getElementById('qrDisplaySection');
    if (qrDisplay && !qrDisplay.classList.contains('hidden')) {
        performResetToHome();
        currentNavState = 'home';
        return;
    }

    currentNavState = 'home';
}

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
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => {
                    console.log('QRSetu ServiceWorker registered:', reg.scope);
                })
                .catch(err => {
                    console.warn('ServiceWorker registration error:', err);
                });
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
        showToast('QRSetu installed on your phone!', 'smartphone');
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
                showToast('Installing QRSetu...', 'download');
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

// Settings Handling - Multi-Account UPI Support
function detectBankName(upi) {
    if (!upi) return '';
    const lower = upi.toLowerCase().trim();
    if (lower.includes('@oksbi') || lower.includes('@sbi')) return 'SBI';
    if (lower.includes('@okhdfcbank') || lower.includes('@hdfcbank') || lower.includes('@hdfc')) return 'HDFC';
    if (lower.includes('@okaxis') || lower.includes('@axisbank')) return 'Axis';
    if (lower.includes('@okicici') || lower.includes('@icici')) return 'ICICI';
    if (lower.includes('@paytm')) return 'Paytm';
    if (lower.includes('@ybl') || lower.includes('@ibl')) return 'PhonePe';
    if (lower.includes('@kotak')) return 'Kotak';
    if (lower.includes('@barodampay') || lower.includes('@bob')) return 'BOB';
    if (lower.includes('@pnb')) return 'PNB';
    if (lower.includes('@postbank') || lower.includes('@ippb')) return 'IPPB';
    return '';
}

function syncActiveAccount() {
    const activeAcc = getActiveAccount();
    merchantConfig.vpa = activeAcc.upi || '';
    merchantConfig.bank = activeAcc.bank || '';
}

function getActiveAccount() {
    if (!merchantConfig.accounts || !Array.isArray(merchantConfig.accounts) || merchantConfig.accounts.length === 0) {
        return { bank: merchantConfig.bank || '', upi: merchantConfig.vpa || '' };
    }
    const idx = merchantConfig.activeAccountIndex || 0;
    const acc = merchantConfig.accounts[idx];
    if (acc && acc.upi) return acc;

    // Fallback to first non-empty account
    const firstNonEmpty = merchantConfig.accounts.find(a => a && a.upi);
    if (firstNonEmpty) return firstNonEmpty;

    return { bank: merchantConfig.bank || '', upi: merchantConfig.vpa || '' };
}

function loadSettings() {
    const saved = localStorage.getItem('qp_merchant_settings');
    if (saved) {
        try {
            merchantConfig = JSON.parse(saved);
        } catch (e) {
            merchantConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
    } else {
        merchantConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }

    // Auto-migration for multi-account support:
    if (!merchantConfig.accounts || !Array.isArray(merchantConfig.accounts)) {
        merchantConfig.accounts = [
            { bank: merchantConfig.bank || detectBankName(merchantConfig.vpa || ''), upi: merchantConfig.vpa || '' },
            { bank: '', upi: '' },
            { bank: '', upi: '' }
        ];
        merchantConfig.activeAccountIndex = 0;
    } else {
        while (merchantConfig.accounts.length < 3) {
            merchantConfig.accounts.push({ bank: '', upi: '' });
        }
    }

    if (typeof merchantConfig.activeAccountIndex !== 'number' || merchantConfig.activeAccountIndex < 0 || merchantConfig.activeAccountIndex > 2) {
        merchantConfig.activeAccountIndex = 0;
    }

    syncActiveAccount();
    updateMerchantUI();
}

function updateMerchantUI() {
    syncActiveAccount();
    const activeAcc = getActiveAccount();
    const isConfigured = Boolean(activeAcc.upi);
    const merchantName = merchantConfig.name || (isConfigured ? 'My Business' : 'Set Up Business Name');
    const upiId = activeAcc.upi || 'Tap here to add your UPI ID';
    const bankName = activeAcc.bank || '';

    const nameEl = document.getElementById('displayMerchantName');
    const upiEl = document.getElementById('displayUpiId');
    const bankBadge = document.getElementById('displayBankBadge');
    const qrShopEl = document.getElementById('qrShopName');
    const qrUpiEl = document.getElementById('qrUpiId');
    const qrBankBadge = document.getElementById('qrBankBadge');
    const verifiedBadge = document.getElementById('merchantVerifiedBadge');
    const avatarInitial = document.getElementById('merchantAvatarInitial');
    const setupAlert = document.getElementById('setupRequiredAlert');

    if (nameEl) nameEl.textContent = merchantName;
    if (upiEl) upiEl.textContent = upiId;
    if (qrShopEl) qrShopEl.textContent = merchantName;
    if (qrUpiEl) qrUpiEl.textContent = upiId;

    if (bankBadge) {
        if (bankName) {
            bankBadge.textContent = bankName;
            bankBadge.classList.remove('hidden');
        } else {
            bankBadge.classList.add('hidden');
        }
    }

    if (qrBankBadge) {
        if (bankName) {
            qrBankBadge.textContent = bankName;
            qrBankBadge.classList.remove('hidden');
        } else {
            qrBankBadge.classList.add('hidden');
        }
    }

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

// Robust UPI Parser & Validator
function parseAndValidateUpi(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') {
        return { valid: false, error: 'Please enter your UPI ID.' };
    }

    let cleaned = rawInput.trim();

    // Case 1: Pasted UPI link (e.g. upi://pay?pa=user@bank&...)
    if (cleaned.includes('pa=')) {
        const match = cleaned.match(/pa=([^&]+)/i);
        if (match && match[1]) {
            cleaned = decodeURIComponent(match[1]).trim();
        }
    }

    // Case 2: Pasted text like "UPI ID: xxx@yyy" or "VPA: xxx@yyy"
    cleaned = cleaned.replace(/^(upi\s*id|vpa|upi)\s*[:=-]\s*/i, '');

    // Case 3: Accidental spaces anywhere (e.g. "user@ okaxis" or "98765 43210")
    cleaned = cleaned.replace(/\s+/g, '');

    // Case 4: Strip leading "+91" or "0" if user pasted Indian mobile number
    if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
        cleaned = cleaned.replace(/^\+91/, '');
    } else if (/^0[6-9]\d{9}$/.test(cleaned)) {
        cleaned = cleaned.replace(/^0/, '');
    }

    // Check 1: Standard Indian UPI VPA (e.g. user@bank, 9876543210@paytm, name.surname@okhdfcbank)
    const vpaPattern = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z0-9]{2,32}$/;
    if (vpaPattern.test(cleaned)) {
        return { valid: true, upi: cleaned.toLowerCase() };
    }

    // Check 2: Indian 8 to 12 digit UPI Number (NPCI officially allows numeric UPI ID)
    const numericPattern = /^[0-9]{8,12}$/;
    if (numericPattern.test(cleaned)) {
        return { valid: true, upi: cleaned };
    }

    // Check 3: If it contains '@' and has valid characters on both sides
    if (cleaned.includes('@')) {
        const parts = cleaned.split('@');
        if (parts.length === 2 && parts[0].length > 0 && parts[1].length > 0) {
            const cleanUser = parts[0].replace(/[^a-zA-Z0-9.\-_]/g, '');
            const cleanHandle = parts[1].replace(/[^a-zA-Z0-9]/g, '');
            if (cleanUser && cleanHandle) {
                return { valid: true, upi: `${cleanUser}@${cleanHandle}`.toLowerCase() };
            }
        }
    }

    return {
        valid: false,
        error: 'Please enter a valid UPI ID (e.g. mobile@ybl, name@okhdfcbank or 10-digit UPI number)'
    };
}

// Active slot index tracking for Modal
let focusedAccountIndex = 0;
let modalSelectedAccountIndex = 0;

function setActiveAccountInput(index) {
    focusedAccountIndex = index;
}

function updateAccountBankLabel(index) {
    const bankInput = document.getElementById(`settingBankName_${index}`);
    const labelSpan = document.getElementById(`accountLabelBank_${index}`);
    if (bankInput && labelSpan) {
        const val = bankInput.value.trim();
        labelSpan.textContent = val ? `(${val})` : '';
    }
}

function handleUpiTyping(index) {
    const upiInput = document.getElementById(`settingUpiId_${index}`);
    const bankInput = document.getElementById(`settingBankName_${index}`);
    if (!upiInput || !bankInput) return;

    if (!bankInput.value.trim()) {
        const detected = detectBankName(upiInput.value);
        if (detected) {
            bankInput.value = detected;
            updateAccountBankLabel(index);
        }
    }
}

// Quick Bank Handle Chip Appender
function appendUpiHandle(handle) {
    triggerHaptic(10);
    const upiInput = document.getElementById(`settingUpiId_${focusedAccountIndex}`);
    const bankInput = document.getElementById(`settingBankName_${focusedAccountIndex}`);
    if (!upiInput) return;

    let currentVal = upiInput.value.trim().replace(/\s+/g, '');
    if (currentVal.includes('@')) {
        currentVal = currentVal.split('@')[0];
    }

    upiInput.value = currentVal + handle;
    upiInput.focus();

    if (bankInput && !bankInput.value.trim()) {
        const detected = detectBankName(upiInput.value);
        if (detected) {
            bankInput.value = detected;
            updateAccountBankLabel(focusedAccountIndex);
        }
    }
}

function selectActiveAccount(index, haptic = true) {
    if (haptic) triggerHaptic(12);
    modalSelectedAccountIndex = index;
    focusedAccountIndex = index;

    for (let i = 0; i < 3; i++) {
        const card = document.getElementById(`accountCard_${i}`);
        const radio = document.getElementById(`radioAcc_${i}`);
        const badge = document.getElementById(`badgeActive_${i}`);

        if (i === index) {
            if (radio) radio.checked = true;
            if (badge) badge.classList.remove('hidden');
            if (card) {
                card.className = 'p-3 rounded-2xl border transition relative cursor-pointer border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500/30';
            }
        } else {
            if (radio) radio.checked = false;
            if (badge) badge.classList.add('hidden');
            if (card) {
                card.className = 'p-3 rounded-2xl border transition relative cursor-pointer border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 opacity-85';
            }
        }
    }
}

function openSettingsModal(isFirstTime = false) {
    triggerHaptic(15);
    const nameInput = document.getElementById('settingMerchantName');
    if (nameInput) nameInput.value = merchantConfig.name || '';

    // Populate the 3 accounts
    for (let i = 0; i < 3; i++) {
        const acc = (merchantConfig.accounts && merchantConfig.accounts[i]) ? merchantConfig.accounts[i] : { bank: '', upi: '' };
        const bankInput = document.getElementById(`settingBankName_${i}`);
        const upiInput = document.getElementById(`settingUpiId_${i}`);
        if (bankInput) bankInput.value = acc.bank || '';
        if (upiInput) upiInput.value = acc.upi || '';
        updateAccountBankLabel(i);
    }

    modalSelectedAccountIndex = merchantConfig.activeAccountIndex || 0;
    focusedAccountIndex = modalSelectedAccountIndex;
    selectActiveAccount(modalSelectedAccountIndex, false);

    const modalTitle = document.getElementById('settingsModalTitle');
    const modalSubtitle = document.getElementById('settingsModalSubtitle');

    if (isFirstTime || !merchantConfig.vpa) {
        if (modalTitle) modalTitle.textContent = 'Welcome! Setup QRSetu';
        if (modalSubtitle) modalSubtitle.textContent = 'Enter your Shop Name and UPI ID to start accepting direct bank payments.';
    } else {
        if (modalTitle) modalTitle.textContent = 'Merchant & UPI Accounts';
        if (modalSubtitle) modalSubtitle.textContent = 'Add up to 3 bank UPI IDs. Select which account is active to receive payments.';
    }

    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();

        // Push state for Settings modal so mobile back button closes modal smoothly
        if (currentNavState !== 'settings') {
            if (window.history && window.history.pushState) {
                history.pushState({ view: 'settings' }, '');
            }
            currentNavState = 'settings';
        }

        setTimeout(() => {
            const activeUpiInput = document.getElementById(`settingUpiId_${modalSelectedAccountIndex}`);
            if (activeUpiInput) activeUpiInput.focus();
        }, 150);
    }
}

function closeSettingsModal() {
    triggerHaptic(10);
    const modal = document.getElementById('settingsModal');
    if (modal) modal.classList.add('hidden');

    if (currentNavState === 'settings') {
        const qrDisplay = document.getElementById('qrDisplaySection');
        currentNavState = (qrDisplay && !qrDisplay.classList.contains('hidden')) ? 'qr' : 'home';
        if (window.history && window.history.back) {
            history.back();
        }
    }
}

function saveSettings() {
    triggerHaptic(25);
    const nameInput = document.getElementById('settingMerchantName');
    const nameVal = nameInput ? nameInput.value.trim() : '';

    const newAccounts = [];
    for (let i = 0; i < 3; i++) {
        let bank = (document.getElementById(`settingBankName_${i}`)?.value || '').trim();
        let upi = (document.getElementById(`settingUpiId_${i}`)?.value || '').trim().replace(/\s+/g, '');

        // Smart Auto-Swap: If user accidentally typed UPI in the Bank field and Bank in the UPI field
        if (bank.includes('@') && (!upi || !upi.includes('@'))) {
            const temp = upi;
            upi = bank;
            bank = temp;
            if (document.getElementById(`settingBankName_${i}`)) document.getElementById(`settingBankName_${i}`).value = bank;
            if (document.getElementById(`settingUpiId_${i}`)) document.getElementById(`settingUpiId_${i}`).value = upi;
        }

        // Auto-detect bank name if bank empty but UPI present
        if (!bank && upi) {
            bank = detectBankName(upi);
            if (document.getElementById(`settingBankName_${i}`)) document.getElementById(`settingBankName_${i}`).value = bank;
        }

        newAccounts.push({ bank, upi });
    }

    // Validate the chosen active account
    const activeAcc = newAccounts[modalSelectedAccountIndex];
    if (!activeAcc || !activeAcc.upi) {
        showToast(`Account ${modalSelectedAccountIndex + 1} UPI ID cannot be empty`, 'alert-circle');
        const upiEl = document.getElementById(`settingUpiId_${modalSelectedAccountIndex}`);
        if (upiEl) upiEl.focus();
        return;
    }

    const validationResult = parseAndValidateUpi(activeAcc.upi);
    if (!validationResult.valid) {
        showToast(validationResult.error, 'alert-circle');
        const upiEl = document.getElementById(`settingUpiId_${modalSelectedAccountIndex}`);
        if (upiEl) upiEl.focus();
        return;
    }
    activeAcc.upi = validationResult.upi;

    // Validate any other non-empty accounts
    for (let i = 0; i < 3; i++) {
        if (i !== modalSelectedAccountIndex && newAccounts[i].upi) {
            const res = parseAndValidateUpi(newAccounts[i].upi);
            if (res.valid) {
                newAccounts[i].upi = res.upi;
            }
        }
    }

    merchantConfig.name = nameVal || 'QRSetu Merchant';
    merchantConfig.accounts = newAccounts;
    merchantConfig.activeAccountIndex = modalSelectedAccountIndex;
    syncActiveAccount();

    localStorage.setItem('qp_merchant_settings', JSON.stringify(merchantConfig));
    updateMerchantUI();
    closeSettingsModal();

    const bankLabel = activeAcc.bank ? ` [${activeAcc.bank}]` : '';
    showToast(`Active: ${activeAcc.upi}${bankLabel}`, 'check-check');
}

// Reset Stored Details
function resetSavedMerchantDetails() {
    if (confirm('Do you want to reset all saved UPI accounts and Shop Name?')) {
        localStorage.removeItem('qp_merchant_settings');
        merchantConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        merchantConfig.accounts = [
            { bank: '', upi: '' },
            { bank: '', upi: '' },
            { bank: '', upi: '' }
        ];
        merchantConfig.activeAccountIndex = 0;
        syncActiveAccount();
        updateMerchantUI();
        closeSettingsModal();
        showToast('All accounts reset to default', 'refresh-cw');
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
    if (!merchantConfig.vpa) {
        showToast('Please set your UPI ID first!', 'alert-circle');
        openSettingsModal(true);
        return;
    }

    const inputVal = document.getElementById('paymentAmount').value;
    const amount = parseFloat(inputVal);

    if (isNaN(amount) || amount <= 0) {
        showToast('Please enter an amount greater than ₹0', 'alert-circle');
        document.getElementById('paymentAmount').focus();
        return;
    }

    currentAmount = amount;
    const formattedAmount = amount.toFixed(2);

    // Standard NPCI compliant UPI URI (clean parameters for 100% scannability across all UPI apps)
    const pa = encodeURIComponent(merchantConfig.vpa.trim());
    const pn = encodeURIComponent((merchantConfig.name || 'Merchant').trim());
    const am = encodeURIComponent(formattedAmount);

    generatedPaymentUri = `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR`;

    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) {
        qrContainer.innerHTML = '';

        // Generate clean high-contrast scannable QR Code
        new QRCode(qrContainer, {
            text: generatedPaymentUri,
            width: 240,
            height: 240,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    }

    // Ensure Shop Name & UPI ID are updated on QR screen
    const qrShopNameEl = document.getElementById('qrShopName');
    const qrUpiIdEl = document.getElementById('qrUpiId');
    if (qrShopNameEl) qrShopNameEl.textContent = merchantConfig.name || 'Merchant Payment';
    if (qrUpiIdEl) qrUpiIdEl.textContent = merchantConfig.vpa;

    document.getElementById('displayAmount').textContent = `₹${formattedAmount}`;
    isAmountVisible = true;
    const eyeIcon = document.getElementById('amountEyeIcon');
    if (eyeIcon) eyeIcon.setAttribute('data-lucide', 'eye');

    document.getElementById('amountInputSection').classList.add('hidden');
    const qrDisplay = document.getElementById('qrDisplaySection');
    qrDisplay.classList.remove('hidden');
    qrDisplay.classList.add('animate-pop-in');

    // Start 5-Minute Expiry Countdown Timer
    startQRTimer();

    // Push history state so mobile back button returns to home screen
    if (currentNavState !== 'qr') {
        if (window.history && window.history.pushState) {
            history.pushState({ view: 'qr' }, '');
        }
        currentNavState = 'qr';
    }

    if (window.lucide) lucide.createIcons();
    showToast(`QR Code generated for ₹${formattedAmount}`, 'qr-code');
}

// Download QR Code as a High-Resolution Merchant Payment Card
function downloadQR() {
    triggerHaptic(20);
    const qrCanvas = document.querySelector('#qrcode canvas');
    const qrImg = document.querySelector('#qrcode img');

    let qrSource = null;
    if (qrCanvas && qrCanvas.width > 0) {
        qrSource = qrCanvas;
    } else if (qrImg && qrImg.src) {
        qrSource = qrImg;
    }

    if (!qrSource) {
        showToast('QR Code not ready for download', 'alert-circle');
        return;
    }

    // High resolution canvas for sharp printing & scanning (720x980)
    const cardCanvas = document.createElement('canvas');
    const W = 720;
    const H = 980;
    cardCanvas.width = W;
    cardCanvas.height = H;
    const ctx = cardCanvas.getContext('2d');

    // 1. Clean White Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // 2. Top Header Accent Banner
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#4338ca');
    grad.addColorStop(1, '#6366f1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 110);

    // Header Title & Tagline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QRSetu - SCAN & PAY', W / 2, 54);

    ctx.fillStyle = '#c7d2fe';
    ctx.font = '16px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('Accepting Payments via Any UPI App', W / 2, 85);

    // 3. Shop Name Display (Configured by user)
    const shopName = (merchantConfig.name || 'Merchant Payment').trim();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';

    let displayShop = shopName;
    if (displayShop.length > 28) {
        displayShop = displayShop.slice(0, 26) + '...';
    }
    ctx.fillText(displayShop, W / 2, 175);

    // UPI ID subtitle
    ctx.fillStyle = '#64748b';
    ctx.font = '600 20px "JetBrains Mono", Courier, monospace';
    const bankPrefix = merchantConfig.bank ? `[${merchantConfig.bank}] ` : '';
    ctx.fillText(`${bankPrefix}${merchantConfig.vpa}`, W / 2, 212);

    // Amount Badge Box
    const amtBoxY = 238;
    const amtBoxW = 340;
    const amtBoxH = 54;
    const amtBoxX = (W - amtBoxW) / 2;

    ctx.fillStyle = '#eef2ff';
    roundRect(ctx, amtBoxX, amtBoxY, amtBoxW, amtBoxH, 14);
    ctx.fill();

    ctx.strokeStyle = '#c7d2fe';
    ctx.lineWidth = 1.5;
    roundRect(ctx, amtBoxX, amtBoxY, amtBoxW, amtBoxH, 14);
    ctx.stroke();

    ctx.fillStyle = '#4338ca';
    ctx.font = 'bold 26px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(`Amount: ₹${currentAmount.toFixed(2)}`, W / 2, amtBoxY + 36);

    // 4. QR Code Box (with large white quiet-zone padding for 100% scan guarantee)
    const qrSize = 440;
    const qrX = (W - qrSize) / 2;
    const qrY = 320;

    // QR Outer Frame
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 22);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    roundRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 22);
    ctx.stroke();

    // Draw QR Code
    ctx.drawImage(qrSource, qrX, qrY, qrSize, qrSize);

    // 5. Supported UPI Apps Banner
    const appsY = 820;
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, 40, appsY, W - 80, 50, 12);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    roundRect(ctx, 40, appsY, W - 80, 50, 12);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '600 17px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('Google Pay   •   PhonePe   •   Paytm   •   BHIM   •   Cred', W / 2, appsY + 32);

    // 6. Footer - Exact requested attribution: "Developed by sachindhisle04"
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 18px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('Developed by sachindhisle04', W / 2, 915);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('Scan with any UPI app to complete payment', W / 2, 945);

    // Helper for rounded rectangles
    function roundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
    }

    // Trigger Download
    const dataUrl = cardCanvas.toDataURL('image/png');
    const safeName = (merchantConfig.name || 'QRSetu').replace(/[^a-zA-Z0-9]/g, '-');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${safeName}-QR-₹${currentAmount.toFixed(2)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Payment QR Card downloaded!', 'check');
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

// Perform Clean Reset Back to Home Screen (Idempotent UI Reset)
function performResetToHome() {
    stopQRTimer();

    const amountInput = document.getElementById('paymentAmount');
    if (amountInput) {
        amountInput.value = '';
        toggleClearBtn();
    }

    // Reset Calculator so new payment starts with a clean slate
    clearCalculator();

    const qrDisplay = document.getElementById('qrDisplaySection');
    if (qrDisplay) {
        qrDisplay.classList.add('hidden');
        qrDisplay.classList.remove('animate-pop-in');
    }

    const inputSection = document.getElementById('amountInputSection');
    if (inputSection) {
        inputSection.classList.remove('hidden');
        inputSection.classList.add('animate-pop-in');
    }

    // Reset QR container & expired overlay
    const overlay = document.getElementById('qrExpiredOverlay');
    const qrBox = document.getElementById('qrcode');
    if (overlay) overlay.classList.add('hidden');
    if (qrBox) {
        qrBox.classList.remove('opacity-20', 'blur-sm', 'pointer-events-none');
        qrBox.innerHTML = '';
    }

    if (amountInput) amountInput.focus();
}

// Reset Back to Input View (Triggered by in-app button)
function resetQR() {
    triggerHaptic(15);
    performResetToHome();

    // If QR view was in browser history, pop it so stack stays clean
    if (currentNavState === 'qr') {
        currentNavState = 'home';
        if (window.history && window.history.back) {
            history.back();
        }
    }
}

// ==========================================
// Quick Billing Calculator Engine
// ==========================================
let calcExpression = '';
let calcResult = '0';
let isEvaluated = false;

function clearCalculator() {
    calcExpression = '';
    calcResult = '0';
    isEvaluated = false;
    updateCalcDisplay();
}

function updateCalcDisplay() {
    const histEl = document.getElementById('calcHistory');
    const outEl = document.getElementById('calcOutput');
    if (histEl) histEl.textContent = calcExpression || '0';
    if (outEl) outEl.textContent = calcResult || '0';
}

function calcInput(char) {
    triggerHaptic(10);
    if (isEvaluated) {
        if (!isNaN(char) || char === '.') {
            calcExpression = '';
            calcResult = '0';
        }
        isEvaluated = false;
    }

    if (char === '.') {
        const parts = calcExpression.split(/[\+\-\×\÷]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) return;
        if (!lastPart) calcExpression += '0';
    }

    calcExpression += char;
    calcResult = calcExpression;
    updateCalcDisplay();
}

function calcAction(action) {
    triggerHaptic(12);
    if (action === 'C') {
        clearCalculator();
        return;
    }

    if (action === 'DEL') {
        if (calcExpression.length > 0) {
            calcExpression = calcExpression.slice(0, -1);
            calcResult = calcExpression || '0';
        } else {
            calcResult = '0';
        }
        updateCalcDisplay();
        return;
    }

    // Operators (+, -, ×, ÷, %)
    if (['+', '-', '×', '÷', '%'].includes(action)) {
        if (calcExpression === '') {
            if (calcResult !== '0' && isEvaluated) {
                calcExpression = calcResult;
            } else if (action === '-') {
                calcExpression = '-';
                calcResult = '-';
                updateCalcDisplay();
                return;
            } else {
                return;
            }
        }

        const lastChar = calcExpression.slice(-1);
        if (['+', '-', '×', '÷', '%'].includes(lastChar)) {
            calcExpression = calcExpression.slice(0, -1) + action;
        } else {
            calcExpression += action;
        }
        isEvaluated = false;
        calcResult = calcExpression;
        updateCalcDisplay();
    }
}

function safeEvaluate(expr) {
    if (!expr) return 0;
    let clean = expr.trim();
    clean = clean.replace(/[\+\-\×\÷%]+$/, '');
    clean = clean.replace(/×/g, '*').replace(/÷/g, '/');

    // Handle percentage additions / discounts (e.g. 100 + 18% or 100 - 10%)
    clean = clean.replace(/(\d+(?:\.\d+)?)\s*([\+\-])\s*(\d+(?:\.\d+)?)%/g, '($1 $2 ($1 * ($3 / 100)))');
    clean = clean.replace(/(\d+(?:\.\d+)?)%/g, '($1 / 100)');

    if (!/^[0-9\.\+\-\*\/\(\)\s]+$/.test(clean)) {
        return 0;
    }

    try {
        const fn = new Function(`return (${clean})`);
        const res = fn();
        if (isNaN(res) || !isFinite(res)) return 0;
        return Math.round(res * 100) / 100;
    } catch (e) {
        return 0;
    }
}

function calcEquals() {
    triggerHaptic(20);
    if (!calcExpression) return;
    const total = safeEvaluate(calcExpression);
    const historyText = calcExpression + ' =';
    calcResult = total.toString();
    calcExpression = total.toString();
    isEvaluated = true;

    const histEl = document.getElementById('calcHistory');
    const outEl = document.getElementById('calcOutput');
    if (histEl) histEl.textContent = historyText;
    if (outEl) outEl.textContent = '₹ ' + calcResult;
}

function applyCalcToAmount() {
    triggerHaptic(25);
    let finalVal = 0;
    if (!isEvaluated && calcExpression) {
        finalVal = safeEvaluate(calcExpression);
        calcResult = finalVal.toString();
        calcExpression = finalVal.toString();
        isEvaluated = true;
        updateCalcDisplay();
    } else {
        finalVal = parseFloat(calcResult.replace(/[^0-9.]/g, '')) || 0;
    }

    if (finalVal <= 0) {
        showToast('Calculate an amount greater than 0 first', 'alert-circle');
        return;
    }

    const amtInput = document.getElementById('paymentAmount');
    if (amtInput) {
        amtInput.value = finalVal.toFixed(2);
        toggleClearBtn();
        amtInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast(`Total ₹${finalVal.toFixed(2)} applied to QR!`, 'check');
    }
}

// ==========================================
// 5-Minute Live Countdown Timer Engine
// ==========================================
let qrTimerInterval = null;
let qrTimeLeft = 300; // 5 minutes = 300 seconds
const QR_TOTAL_SECONDS = 300;

function startQRTimer() {
    stopQRTimer();
    qrTimeLeft = QR_TOTAL_SECONDS;
    updateTimerDisplay();

    // Ensure expired overlay is hidden and QR is active
    const overlay = document.getElementById('qrExpiredOverlay');
    const qrBox = document.getElementById('qrcode');
    if (overlay) overlay.classList.add('hidden');
    if (qrBox) {
        qrBox.classList.remove('opacity-20', 'blur-sm', 'pointer-events-none');
    }

    qrTimerInterval = setInterval(() => {
        qrTimeLeft--;
        updateTimerDisplay();

        if (qrTimeLeft <= 0) {
            stopQRTimer();
            expireQR();
        }
    }, 1000);
}

function stopQRTimer() {
    if (qrTimerInterval) {
        clearInterval(qrTimerInterval);
        qrTimerInterval = null;
    }
}

function updateTimerDisplay() {
    const timerText = document.getElementById('qrTimer');
    const progressBar = document.getElementById('qrTimerProgressBar');

    const mins = Math.floor(Math.max(0, qrTimeLeft) / 60);
    const secs = Math.max(0, qrTimeLeft) % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (timerText) {
        timerText.textContent = formatted;
        const parentPill = timerText.closest('span');
        if (parentPill) {
            if (qrTimeLeft < 60) {
                parentPill.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60';
            } else {
                parentPill.className = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60';
            }
        }
    }

    if (progressBar) {
        const pct = Math.max(0, (qrTimeLeft / QR_TOTAL_SECONDS) * 100);
        progressBar.style.width = `${pct}%`;
        if (qrTimeLeft < 60) {
            progressBar.className = 'h-full bg-rose-500 rounded-full transition-all duration-1000';
        } else {
            progressBar.className = 'h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-1000';
        }
    }
}

function expireQR() {
    triggerHaptic([30, 50, 30]);
    const overlay = document.getElementById('qrExpiredOverlay');
    const qrBox = document.getElementById('qrcode');

    if (overlay) overlay.classList.remove('hidden');
    if (qrBox) {
        qrBox.classList.add('opacity-20', 'blur-sm', 'pointer-events-none');
    }
    if (window.lucide) lucide.createIcons();
    showToast('QR Code expired (5 mins). Tap Regenerate.', 'alert-triangle');
}

function regenerateExpiredQR() {
    triggerHaptic(20);
    generateQRCode();
}

// ==========================================
// Payment Confirmation, Soundbox & Receipt
// ==========================================
let currentReceiptData = null;

function confirmPaymentReceived() {
    triggerHaptic(40);
    stopQRTimer();

    const formattedAmount = currentAmount.toFixed(2);
    const shopName = merchantConfig.name || 'Merchant';
    const upiId = merchantConfig.vpa || 'merchant@upi';

    // Format current live date and time
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const timeFormatted = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
    const fullDateTime = `${dateFormatted}, ${timeFormatted}`;

    // Generate standard 12-digit UPI UTR reference number
    const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
    const utrNumber = `UPI/43${randomDigits}`;

    const displayUpiText = merchantConfig.bank ? `[${merchantConfig.bank}] ${upiId}` : upiId;

    currentReceiptData = {
        amount: formattedAmount,
        shopName: shopName,
        upiId: displayUpiText,
        dateTime: fullDateTime,
        utr: utrNumber
    };

    // Update modal displays
    const amtEl = document.getElementById('successAmountDisplay');
    const shopEl = document.getElementById('successMerchantDisplay');
    const upiEl = document.getElementById('successUpiDisplay');
    const timeEl = document.getElementById('successTimeDisplay');
    const utrEl = document.getElementById('successUtrDisplay');

    if (amtEl) amtEl.textContent = `₹ ${formattedAmount}`;
    if (shopEl) shopEl.textContent = `Paid to ${shopName}`;
    if (upiEl) upiEl.textContent = displayUpiText;
    if (timeEl) timeEl.textContent = fullDateTime;
    if (utrEl) utrEl.textContent = utrNumber;

    // Trigger Soundbox chime & voice announcement
    playSoundboxChime(Math.round(currentAmount));

    // Show Payment Success Modal
    const modal = document.getElementById('paymentSuccessModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }

    // Update history state: replace 'qr' with 'success' so pressing mobile back returns directly to home screen
    if (window.history) {
        if (currentNavState === 'qr') {
            history.replaceState({ view: 'success' }, '');
        } else {
            history.pushState({ view: 'success' }, '');
        }
    }
    currentNavState = 'success';
}

function closeSuccessAndNewPayment() {
    triggerHaptic(15);
    const modal = document.getElementById('paymentSuccessModal');
    if (modal) modal.classList.add('hidden');
    performResetToHome();

    if (currentNavState === 'success') {
        currentNavState = 'home';
        if (window.history && window.history.back) {
            history.back();
        }
    }
}

// Number to Hindi Words Converter for Pure Hindi Soundbox Announcement
function numberToHindiWords(num) {
    num = Math.floor(num);
    if (num <= 0) return 'शून्य';

    const ones = [
        '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
        'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
        'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाइस', 'उनतीस', 'तीस',
        'इकत्तीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
        'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
        'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
        'इकसठ', 'बासठ', 'तिरेसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
        'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'अस्सी',
        'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
        'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे'
    ];

    function convertBelowThousand(n) {
        let res = '';
        if (n >= 100) {
            const h = Math.floor(n / 100);
            res += (ones[h] || '') + ' सौ ';
            n %= 100;
        }
        if (n > 0) {
            res += (ones[n] || '');
        }
        return res.trim();
    }

    let words = '';

    // Crores
    if (num >= 10000000) {
        const cr = Math.floor(num / 10000000);
        words += convertBelowThousand(cr) + ' करोड़ ';
        num %= 10000000;
    }
    // Lakhs
    if (num >= 100000) {
        const lk = Math.floor(num / 100000);
        words += (ones[lk] || convertBelowThousand(lk)) + ' लाख ';
        num %= 100000;
    }
    // Thousands
    if (num >= 1000) {
        const th = Math.floor(num / 1000);
        words += (ones[th] || convertBelowThousand(th)) + ' हज़ार ';
        num %= 1000;
    }
    // Below 1000
    if (num > 0) {
        words += convertBelowThousand(num);
    }

    return words.trim() || String(num);
}

// Soundbox Chime (Web Audio API) + Pure Hindi Voice Announcement
function playSoundboxChime(amount) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            const now = ctx.currentTime;

            // Tone 1: 587.33Hz (D5) bell tone
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now);
            gain1.gain.setValueAtTime(0.3, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.35);

            // Tone 2: 880Hz (A5) high chime tone
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, now + 0.16);
            gain2.gain.setValueAtTime(0.35, now + 0.16);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.16);
            osc2.stop(now + 0.65);
        }
    } catch (e) {
        console.log('AudioContext not supported');
    }

    // Pure Hindi Voice Announcement: "क्यूआर सेतु पर [संख्या] रुपये प्राप्त हुए"
    try {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech first
            window.speechSynthesis.cancel();

            setTimeout(() => {
                const numericAmt = Math.round(amount);
                const hindiWords = numberToHindiWords(numericAmt);
                const speechText = `क्यूआर सेतु पर ${hindiWords} रुपये प्राप्त हुए`;

                const utterance = new SpeechSynthesisUtterance(speechText);
                utterance.lang = 'hi-IN'; // Explicit Hindi (India) language
                utterance.rate = 0.88;    // Natural soundbox cadence
                utterance.pitch = 1.0;

                // Pick native Hindi voice if available
                const voices = window.speechSynthesis.getVoices();
                const hiVoice = voices.find(v => v.lang === 'hi-IN' || (v.lang && v.lang.startsWith('hi')) || (v.name && v.name.toLowerCase().includes('hindi')));
                if (hiVoice) {
                    utterance.voice = hiVoice;
                }

                window.speechSynthesis.speak(utterance);
            }, 380);
        }
    } catch (e) {
        console.log('Speech synthesis unavailable');
    }
}

// Download Payment Receipt as Image
function downloadReceipt() {
    triggerHaptic(20);
    if (!currentReceiptData) {
        showToast('Receipt details unavailable', 'alert-circle');
        return;
    }

    const W = 620;
    const H = 760;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // 1. Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // 2. Top Header Accent
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#059669');
    grad.addColorStop(1, '#0d9488');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 100);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QRSetu - PAYMENT RECEIPT', W / 2, 50);

    ctx.fillStyle = '#d1fae5';
    ctx.font = '15px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('Instant UPI Payment Completed', W / 2, 78);

    // 3. Amount Section
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 44px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(`₹ ${currentReceiptData.amount}`, W / 2, 175);

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 16px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('✓ Payment Successful', W / 2, 210);

    // 4. Receipt Details Box
    const boxX = 40;
    const boxY = 245;
    const boxW = W - 80;
    const boxH = 340;

    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, boxX, boxY, boxW, boxH, 18);
    ctx.fill();

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    roundRect(ctx, boxX, boxY, boxW, boxH, 18);
    ctx.stroke();

    // Details rows
    const rows = [
        ['Payment Method', 'UPI Instant Pay'],
        ['Merchant / Shop', currentReceiptData.shopName],
        ['UPI ID (VPA)', currentReceiptData.upiId],
        ['Date & Time', currentReceiptData.dateTime],
        ['UPI Ref / UTR', currentReceiptData.utr],
        ['Status', 'Completed (0% Fee)']
    ];

    let rowY = boxY + 45;
    ctx.font = '14px "Plus Jakarta Sans", Arial, sans-serif';

    rows.forEach(([label, val], idx) => {
        // Label
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(label, boxX + 25, rowY);

        // Value
        ctx.fillStyle = idx === 4 ? '#4f46e5' : '#0f172a';
        ctx.font = idx === 4 ? 'bold 14px "JetBrains Mono", monospace' : 'bold 14px "Plus Jakarta Sans", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val, boxX + boxW - 25, rowY);

        if (idx < rows.length - 1) {
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(boxX + 25, rowY + 12);
            ctx.lineTo(boxX + boxW - 25, rowY + 12);
            ctx.stroke();
        }

        rowY += 48;
    });

    // 5. Footer Attribution
    ctx.fillStyle = '#475569';
    ctx.font = '600 16px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Developed by sachindhisle04', W / 2, 645);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('QRSetu - Verified UPI Transaction Terminal', W / 2, 675);

    // Helper for rounded rectangles
    function roundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
    }

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Receipt-₹${currentReceiptData.amount}-${currentReceiptData.utr.replace('/', '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Payment receipt downloaded!', 'check');
}
