let converterWindow = null;
const API_BASE_URL = 'http://localhost:4000';

chrome.action.onClicked.addListener(() => {
  if (converterWindow) {
    chrome.windows.update(converterWindow.id, {
      focused: true
    });
  } else {
    chrome.windows.create({
      url: chrome.runtime.getURL('converter.html'),
      type: 'popup',
      width: 340,
      height: 450,
      focused: true,
      state: 'normal'
    }, (window) => {
      converterWindow = window;
    });
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (converterWindow && converterWindow.id === windowId) {
    converterWindow = null;
  }
});

/**
 * Poll conversion status for progress updates
 */
async function pollConversionStatus(conversionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/status/${conversionId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch conversion status');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error polling conversion status:', error);
    throw error;
  }
}

/**
 * Get user settings
 */
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get('settings', (result) => {
      resolve(result.settings || {
        audioQuality: '0',
        audioFormat: 'mp3',
        autoDownload: true
      });
    });
  });
}

/**
 * Add to download history
 */
async function addToHistory(item) {
  return new Promise((resolve) => {
    chrome.storage.local.get('downloadHistory', (result) => {
      const history = result.downloadHistory || [];
      history.unshift({
        ...item,
        timestamp: Date.now()
      });
      if (history.length > 100) history.splice(100);
      chrome.storage.local.set({ downloadHistory: history }, resolve);
    });
  });
}

/**
 * Handle download with real progress tracking
 */
async function handleDownload(youtubeUrl) {
  let conversionId = null;
  let statusCheckInterval = null;
  
  try {
    // Get user settings
    const settings = await getSettings();
    
    // Start conversion
    const response = await fetch(`${API_BASE_URL}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: youtubeUrl,
        audioQuality: settings.audioQuality,
        audioFormat: settings.audioFormat
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Conversion failed');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Conversion failed');
    }

    conversionId = data.conversionId;
    
    // Poll for progress updates
    statusCheckInterval = setInterval(async () => {
      try {
        const status = await pollConversionStatus(conversionId);
        
        // Send progress update
        chrome.runtime.sendMessage({
          type: 'conversionProgress',
          progress: status.progress || 0,
          status: status.status
        });

        // Check if conversion is complete
        if (status.status === 'completed') {
          clearInterval(statusCheckInterval);
          
          const settings = await getSettings();
          
          // Add to download history
          await addToHistory({
            title: status.fileName,
            url: youtubeUrl,
            fileName: status.fileName,
            downloadUrl: status.downloadUrl
          });
          
          // Download the file if auto-download is enabled
          if (settings.autoDownload !== false) {
            await chrome.downloads.download({
              url: status.downloadUrl,
              filename: `${status.fileName.replace(/[^a-z0-9._-]/gi, '_')}`,
              saveAs: false
            });
          }

          chrome.runtime.sendMessage({
            type: 'conversionComplete',
            fileName: status.fileName,
            downloadUrl: status.downloadUrl
          });
        } else if (status.status === 'failed') {
          clearInterval(statusCheckInterval);
          throw new Error(status.error || 'Conversion failed');
        }
      } catch (error) {
        clearInterval(statusCheckInterval);
        console.error('Error checking conversion status:', error);
        chrome.runtime.sendMessage({
          type: 'conversionError',
          error: error.message || 'Failed to check conversion status'
        });
      }
    }, 1000); // Poll every second

    // Set timeout to prevent infinite polling (10 minutes max)
    setTimeout(() => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        chrome.runtime.sendMessage({
          type: 'conversionError',
          error: 'Conversion timeout. Please try again.'
        });
      }
    }, 10 * 60 * 1000);

  } catch (error) {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    
    console.error('Conversion error:', error);
    
    // Extract error message from response if available
    let errorMessage = error.message || 'An error occurred during conversion';
    if (error.response) {
      try {
        const errorData = await error.response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    
    chrome.runtime.sendMessage({
      type: 'conversionError',
      error: errorMessage
    });
    
    throw error;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startDownload') {
    handleDownload(request.url);
    return true; // Keep channel open for async response
  }
});
