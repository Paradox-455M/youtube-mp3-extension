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
        this.updateProgress(message.progress);
      } else if (message.type === 'conversionComplete') {
        this.showSuccess('Download completed!');
        this.resetProgress();
      } else if (message.type === 'conversionError') {
        this.showError(message.error);
        this.resetProgress();
      }
    });

    // Add close button handler
    const closeBtn = document.getElementById('closeBtn');
    closeBtn.addEventListener('click', () => {
      window.close();
    });

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
    const isValid = url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/);
    this.convertBtn.disabled = !isValid;
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

  updateProgress(progress) {
    this.progressBarFill.style.width = `${progress}%`;
    this.status.textContent = `Converting... ${progress}%`;
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
}

document.addEventListener('DOMContentLoaded', () => {
  new YouTubeConverter();
}); 