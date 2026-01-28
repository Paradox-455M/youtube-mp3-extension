class YouTubeConverter {
  constructor() {
    this.urlInput = document.getElementById('urlInput');
    this.convertBtn = document.getElementById('convertBtn');
    this.status = document.getElementById('status');
    this.statusContainer = document.getElementById('statusContainer');
    this.progressBar = document.getElementById('progressBar');
    this.progressBarFill = document.getElementById('progressBarFill');
    
    this.convertBtn.addEventListener('click', () => this.handleConversion());
    this.urlInput.addEventListener('input', () => this.validateUrl());

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'conversionProgress') {
        this.updateProgress(message.progress, message.status);
      } else if (message.type === 'conversionComplete') {
        this.showSuccess(`Download completed! File: ${message.fileName || 'download.mp3'}`);
        this.resetProgress();
      } else if (message.type === 'conversionError') {
        this.showError(message.error || 'An error occurred during conversion');
        this.resetProgress();
      }
    });

    // Add close button handler
    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        window.close();
      });
    }
    
    // Auto-detect URL from current tab
    this.autoDetectUrl();
    
    // Allow Enter key to trigger conversion
    this.urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.convertBtn.disabled) {
        this.handleConversion();
      }
    });

    // Settings button - show modal
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showSettingsModal();
      });
    }

    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        this.hideSettingsModal();
      });
    }

    if (modalCancelBtn) {
      modalCancelBtn.addEventListener('click', () => {
        this.hideSettingsModal();
      });
    }

    if (modalSaveBtn) {
      modalSaveBtn.addEventListener('click', () => {
        this.saveSettings();
      });
    }

    // Close modal when clicking outside
    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
          this.hideSettingsModal();
        }
      });
    }

    // Load settings when modal opens
    this.loadSettingsIntoModal();

    // Make popup draggable
    this.makeDraggable(document.querySelector('.container'));
  }

  // Add draggable functionality
  makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = document.querySelector('.title');
    
    header.style.cursor = 'move';
    header.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      window.moveTo(
        window.screenX - pos1,
        window.screenY - pos2
      );
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  validateUrl() {
    const url = this.urlInput.value.trim();
    
    // More comprehensive YouTube URL validation
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/,
      /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/
    ];
    
    const isValid = patterns.some(pattern => pattern.test(url));
    this.convertBtn.disabled = !isValid;
    
    // Visual feedback
    if (url && !isValid) {
      this.urlInput.style.borderColor = '#ff6b6b';
    } else {
      this.urlInput.style.borderColor = '';
    }
    
    return isValid;
  }

  async handleConversion() {
    if (!this.validateUrl()) {
      this.showError('Please enter a valid YouTube URL');
      return;
    }

    try {
      this.showProgress();
      this.convertBtn.disabled = true;
      this.urlInput.disabled = true;  // Disable input during conversion

      // Send message to background script
      chrome.runtime.sendMessage({
        action: 'startDownload',
        url: this.urlInput.value.trim()
      });

    } catch (error) {
      this.showError('An error occurred during conversion');
      console.error(error);
      this.resetState();
    }
  }

  showProgress() {
    this.statusContainer.className = 'status-container active';
    this.progressBar.className = 'progress-bar active';
    this.status.textContent = 'Converting...';
  }

  updateProgress(progress, status = 'processing') {
    const clampedProgress = Math.min(Math.max(progress, 0), 100);
    this.progressBarFill.style.width = `${clampedProgress}%`;
    
    if (status === 'processing') {
      this.status.textContent = `Converting... ${Math.round(clampedProgress)}%`;
    } else if (status === 'completed') {
      this.status.textContent = 'Conversion complete!';
    } else {
      this.status.textContent = `Processing... ${Math.round(clampedProgress)}%`;
    }
  }

  resetProgress() {
    this.progressBar.className = 'progress-bar';
    this.progressBarFill.style.width = '0%';
    this.resetState();
  }

  resetState() {
    this.convertBtn.disabled = false;
    this.urlInput.disabled = false;
    this.urlInput.value = '';
  }

  showError(message) {
    this.statusContainer.className = 'status-container active error';
    this.status.textContent = message;
    setTimeout(() => {
      this.statusContainer.className = 'status-container';
    }, 3000);
  }

  showSuccess(message) {
    this.statusContainer.className = 'status-container active success';
    this.status.textContent = message;
    setTimeout(() => {
      this.statusContainer.className = 'status-container';
    }, 3000);
  }
  
  async autoDetectUrl() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        const url = tab.url;
        // Check if current tab is a YouTube video
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
          this.urlInput.value = url;
          this.validateUrl();
        }
      }
    } catch (error) {
      console.error('Error detecting URL:', error);
    }
  }

  showSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.classList.add('active');
      this.loadSettingsIntoModal();
    }
  }

  hideSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.classList.remove('active');
    }
  }

  async loadSettingsIntoModal() {
    try {
      const settings = await this.getSettings();
      const audioFormat = document.getElementById('modalAudioFormat');
      const audioQuality = document.getElementById('modalAudioQuality');
      const autoDownload = document.getElementById('modalAutoDownload');

      if (audioFormat) audioFormat.value = settings.audioFormat || 'mp3';
      if (audioQuality) audioQuality.value = settings.audioQuality || '0';
      if (autoDownload) autoDownload.checked = settings.autoDownload !== false;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async getSettings() {
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

  async saveSettings() {
    try {
      const audioFormat = document.getElementById('modalAudioFormat');
      const audioQuality = document.getElementById('modalAudioQuality');
      const autoDownload = document.getElementById('modalAutoDownload');
      const settingsStatus = document.getElementById('settingsStatus');

      const settings = {
        audioFormat: audioFormat ? audioFormat.value : 'mp3',
        audioQuality: audioQuality ? audioQuality.value : '0',
        autoDownload: autoDownload ? autoDownload.checked : true
      };

      await new Promise((resolve) => {
        chrome.storage.local.set({ settings }, resolve);
      });

      // Show success message
      if (settingsStatus) {
        settingsStatus.textContent = 'Settings saved successfully!';
        settingsStatus.className = 'settings-status active success';
        setTimeout(() => {
          settingsStatus.className = 'settings-status';
          this.hideSettingsModal();
        }, 1000);
      } else {
        this.hideSettingsModal();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      const settingsStatus = document.getElementById('settingsStatus');
      if (settingsStatus) {
        settingsStatus.textContent = 'Error saving settings';
        settingsStatus.className = 'settings-status active error';
        setTimeout(() => {
          settingsStatus.className = 'settings-status';
        }, 3000);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new YouTubeConverter();
}); 