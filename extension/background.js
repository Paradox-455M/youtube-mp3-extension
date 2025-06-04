let converterWindow = null;

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

// Handle download
async function handleDownload(youtubeUrl) {
  try {
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      if (progress <= 90) {
        chrome.runtime.sendMessage({ 
          type: 'conversionProgress', 
          progress 
        });
      }
    }, 500);

    const response = await fetch('http://localhost:4000/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: youtubeUrl })
    });

    clearInterval(progressInterval);

    if (!response.ok) {
      throw new Error('Conversion failed');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Conversion failed');
    }

    chrome.runtime.sendMessage({ 
      type: 'conversionProgress', 
      progress: 100 
    });

    await chrome.downloads.download({
      url: data.downloadUrl,
      filename: `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp3`,
      saveAs: false
    });

    chrome.runtime.sendMessage({ 
      type: 'conversionComplete' 
    });

  } catch (error) {
    console.error('Error:', error);
    chrome.runtime.sendMessage({ 
      type: 'conversionError',
      error: error.message 
    });
    throw error;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startDownload') {
    handleDownload(request.url);
    return true;
  }
});