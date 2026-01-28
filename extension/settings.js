class SettingsManager {
    constructor() {
        this.audioFormat = document.getElementById('audioFormat');
        this.audioQuality = document.getElementById('audioQuality');
        this.autoDownload = document.getElementById('autoDownload');
        this.saveBtn = document.getElementById('saveBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.status = document.getElementById('status');

        this.loadSettings();
        this.setupEventListeners();
    }

    async loadSettings() {
        try {
            const settings = await this.getSettings();
            this.audioFormat.value = settings.audioFormat || 'mp3';
            this.audioQuality.value = settings.audioQuality || '0';
            this.autoDownload.checked = settings.autoDownload !== false;
        } catch (error) {
            console.error('Error loading settings:', error);
            this.showStatus('Error loading settings', 'error');
        }
    }

    setupEventListeners() {
        this.saveBtn.addEventListener('click', () => this.save());
        this.cancelBtn.addEventListener('click', () => window.close());
    }

    async save() {
        try {
            const settings = {
                audioFormat: this.audioFormat.value,
                audioQuality: this.audioQuality.value,
                autoDownload: this.autoDownload.checked
            };

            await this.saveSettings(settings);
            this.showStatus('Settings saved successfully!', 'success');
            
            setTimeout(() => {
                window.close();
            }, 1000);
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showStatus('Error saving settings', 'error');
        }
    }

    showStatus(message, type) {
        this.status.textContent = message;
        this.status.className = `status active ${type}`;
        setTimeout(() => {
            this.status.className = 'status';
        }, 3000);
    }

    // Browser-compatible storage access
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

    async saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ settings }, resolve);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SettingsManager();
});
