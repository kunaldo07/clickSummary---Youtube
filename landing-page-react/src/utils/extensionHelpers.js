import config from '../config/environment';

/**
 * Check if the ClickSummary Chrome extension is installed
 */
export const isExtensionInstalled = () => {
  return new Promise((resolve) => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.chrome || !window.chrome.runtime) {
        resolve(false);
        return;
      }

      // Try to send a message to the extension
      window.chrome.runtime.sendMessage(
        config.EXTENSION_ID,
        { action: 'ping' },
        (response) => {
          if (window.chrome.runtime.lastError) {
            // Extension not installed or not responding
            resolve(false);
          } else {
            // Extension responded
            resolve(true);
          }
        }
      );
    } catch (error) {
      console.log('Extension check failed:', error);
      resolve(false);
    }
  });
};

/**
 * Get the Chrome Web Store URL for the extension
 */
export const getExtensionStoreUrl = () => {
  return `https://chrome.google.com/webstore/detail/${config.EXTENSION_ID}`;
};

/**
 * Get the extension popup URL (for direct access)
 */
export const getExtensionPopupUrl = () => {
  return `chrome-extension://${config.EXTENSION_ID}/popup.html`;
};

/**
 * Smart extension redirect - checks if installed, then redirects appropriately
 */
export const redirectToExtension = async () => {
  try {
    const installed = await isExtensionInstalled();
    
    if (installed) {
      // Extension is installed, try to open it directly
      console.log('✅ Extension detected, attempting to open...');
      
      // Method 1: Try to send a message to open the extension
      try {
        window.chrome.runtime.sendMessage(
          config.EXTENSION_ID,
          { action: 'openPopup' },
          (response) => {
            if (window.chrome.runtime.lastError) {
              console.log('Could not open extension popup directly');
              // Fallback: Open Chrome Web Store page
              window.open(getExtensionStoreUrl(), '_blank');
            } else {
              console.log('Extension popup opened successfully');
            }
          }
        );
      } catch (error) {
        console.log('Direct extension communication failed, opening store page');
        window.open(getExtensionStoreUrl(), '_blank');
      }
    } else {
      // Extension not installed, open Chrome Web Store
      console.log('❌ Extension not detected, opening Chrome Web Store...');
      window.open(getExtensionStoreUrl(), '_blank');
    }
  } catch (error) {
    console.error('Extension redirect failed:', error);
    // Fallback: Always open Chrome Web Store
    window.open(getExtensionStoreUrl(), '_blank');
  }
};

/**
 * Show extension installation status
 */
export const getExtensionStatus = async () => {
  const installed = await isExtensionInstalled();
  return {
    installed,
    storeUrl: getExtensionStoreUrl(),
    popupUrl: installed ? getExtensionPopupUrl() : null,
    message: installed 
      ? '✅ ClickSummary extension is installed!' 
      : '⬇️ Install ClickSummary extension'
  };
};
