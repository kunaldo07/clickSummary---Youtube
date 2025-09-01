// Modern Popup JavaScript

// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:3001/api',
    TIMEOUT: 10000
};

// Global state
let currentUser = null;
let userSubscription = null;
let backendStatus = 'checking';

// Initialize popup when DOM loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing YouTube Summarizer popup...');
    
    // Load user authentication state
    await loadUserState();
    
    // Update UI based on user state
    updateUI();
    
    // Show quick actions if user is authenticated
    if (currentUser) {
        document.getElementById('quick-actions').style.display = 'block';
    }
});



// Load user state from extension storage
async function loadUserState() {
    try {
        const result = await chrome.storage.local.get(['userToken', 'currentUser']);
        
        if (result.userToken && result.currentUser) {
            currentUser = result.currentUser;
            console.log('✅ User loaded:', currentUser.name);
            
            // Fetch latest subscription status
            await fetchUserSubscription();
        } else {
            console.log('ℹ️ No user session found');
        }
    } catch (error) {
        console.error('❌ Error loading user state:', error);
    }
}

// Fetch user subscription from backend
async function fetchUserSubscription() {
    try {
        const response = await callSecureAPI('/payment/subscription-status');
        
        if (response && response.success) {
            userSubscription = response.subscription;
            console.log('✅ Subscription loaded:', userSubscription.status);
        }
    } catch (error) {
        console.warn('⚠️ Could not fetch subscription status:', error);
    }
}

// Make secure API calls
async function callSecureAPI(endpoint, options = {}) {
    const result = await chrome.storage.local.get(['userToken']);
    const token = result.userToken;
    
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const config = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
        ...options
    };
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
    }
    
    return await response.json();
}

// Update UI based on user state
function updateUI() {
    hideAllAuthStates();
    
    if (!currentUser) {
        showNotSignedIn();
    } else if (!userSubscription || userSubscription.status === 'inactive') {
        showFreePlan();
    } else if (userSubscription.plan === 'premium') {
        showPremiumPlan();
    } else {
        showFreePlan();
    }
}

// Hide all auth states
function hideAllAuthStates() {
    document.getElementById('not-signed-in').style.display = 'none';
    document.getElementById('signed-in-free').style.display = 'none';
    document.getElementById('signed-in-premium').style.display = 'none';
}

// Show not signed in state
function showNotSignedIn() {
    document.getElementById('not-signed-in').style.display = 'block';
}

// Show free plan state
function showFreePlan() {
    const section = document.getElementById('signed-in-free');
    section.style.display = 'block';
    
    // Update user info
    document.getElementById('user-avatar-free').src = currentUser.picture;
    document.getElementById('user-name-free').textContent = currentUser.name;
    
    // Update usage (mock data for now)
    const usageCount = userSubscription?.usage?.summariesThisMonth || 0;
    const usageLimit = 5;
    document.getElementById('usage-count').textContent = `${usageCount} / ${usageLimit}`;
    
    const progressPercentage = (usageCount / usageLimit) * 100;
    document.getElementById('usage-progress').style.width = `${progressPercentage}%`;
}

// Show premium plan state  
function showPremiumPlan() {
    const section = document.getElementById('signed-in-premium');
    section.style.display = 'block';
    
    // Update user info
    document.getElementById('user-avatar-premium').src = currentUser.picture;
    document.getElementById('user-name-premium').textContent = currentUser.name;
    
    // Update subscription info
    if (userSubscription) {
        const nextBilling = new Date(userSubscription.currentPeriodEnd).toLocaleDateString();
        document.getElementById('next-billing').textContent = `Next billing: ${nextBilling}`;
        
        // Update stats
        const summariesCount = userSubscription.usage?.summariesThisMonth || 0;
        document.getElementById('summaries-count').textContent = summariesCount;
        
        const timeSaved = Math.round(summariesCount * 12.5); // ~12.5 minutes per summary
        document.getElementById('cost-saved').textContent = `${timeSaved}min`;
    }
}



// Open authentication page
function openAuthPage() {
    chrome.tabs.create({ url: chrome.runtime.getURL('auth-bridge.html') });
    window.close();
}

// Open pricing page
function openPricingPage() {
    chrome.tabs.create({ url: 'http://localhost:3000/pricing' });
    window.close();
}

// Open landing page dashboard
function openLandingPage() {
    chrome.tabs.create({ url: 'http://localhost:3000' });
    window.close();
}

// Get current video summary
async function getCurrentVideoSummary() {
    try {
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.url.includes('youtube.com/watch')) {
            showMessage('Please navigate to a YouTube video first!', 'warning');
            return;
        }
        
        // Send message to content script to trigger summary
        chrome.tabs.sendMessage(tab.id, { action: 'triggerSummary' }, (response) => {
            if (chrome.runtime.lastError) {
                showMessage('Please refresh the YouTube page and try again.', 'error');
            } else if (response && response.success) {
                showMessage('Summary started! Check the video page.', 'success');
                window.close();
            } else {
                showMessage('Failed to start summary. Please try again.', 'error');
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting current video summary:', error);
        showMessage('Error starting summary. Please try again.', 'error');
    }
}

// Open support page
function openSupportPage() {
    chrome.tabs.create({ url: 'mailto:support@youtubesummarizer.com' });
    window.close();
}

// Open about page
function openAboutPage() {
    chrome.tabs.create({ url: 'http://localhost:8000/index.html#about' });
    window.close();
}

// Show popup messages
function showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        right: 10px;
        padding: 12px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
        z-index: 1000;
        animation: slideDown 0.3s ease;
    `;
    
    // Set styling based on type
    switch (type) {
        case 'success':
            messageEl.style.background = '#10b981';
            messageEl.style.color = 'white';
            break;
        case 'error':
            messageEl.style.background = '#ef4444';
            messageEl.style.color = 'white';
            break;
        case 'warning':
            messageEl.style.background = '#f59e0b';
            messageEl.style.color = 'white';
            break;
        default:
            messageEl.style.background = '#3b82f6';
            messageEl.style.color = 'white';
            break;
    }
    
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (messageEl && messageEl.parentNode) {
            messageEl.remove();
        }
    }, 3000);
}

// Add CSS for slide animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Handle external link clicks
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.href && e.target.href.startsWith('http')) {
        e.preventDefault();
        chrome.tabs.create({ url: e.target.href });
        window.close();
    }
});

// Export functions for use in HTML onclick handlers
window.openAuthPage = openAuthPage;
window.openPricingPage = openPricingPage;
window.openLandingPage = openLandingPage;
window.getCurrentVideoSummary = getCurrentVideoSummary;
window.openSupportPage = openSupportPage;
window.openAboutPage = openAboutPage;
