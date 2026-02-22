/**
 * Utility logic and App-level configuration state
 */

const AppState = {
    settings: {
        darkMode: false,
        autoDownload: true
    },

    init() {
        this.loadSettings();
        this.bindEvents();
        this.applyTheme();
    },

    loadSettings() {
        const stored = localStorage.getItem('fileUtilitySettings');
        if (stored) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(stored) };
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        } else {
            // Check system preference for dark mode initially
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.settings.darkMode = true;
            }
            this.saveSettings();
        }

        // Sync UI toggles
        const toggleDark = document.getElementById('toggle-dark-mode');
        const toggleAuto = document.getElementById('toggle-auto-download');

        if (toggleDark) toggleDark.checked = this.settings.darkMode;
        if (toggleAuto) toggleAuto.checked = this.settings.autoDownload;
    },

    saveSettings() {
        localStorage.setItem('fileUtilitySettings', JSON.stringify(this.settings));
        this.applyTheme();
    },

    applyTheme() {
        if (this.settings.darkMode) {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark');
        } else {
            document.body.classList.remove('theme-dark');
            document.body.classList.add('theme-light');
        }
    },

    bindEvents() {
        // Tab Navigation
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');
        const appTitle = document.getElementById('app-title');

        const openTab = (targetId) => {
            navItems.forEach(n => n.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');

                // Update active nav button (if opened via bottom nav)
                const activeNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
                if (activeNav) activeNav.classList.add('active');

                // Update TITLE bar
                appTitle.textContent = targetContent.getAttribute('data-title') || 'File Utility';
            }
        };

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                openTab(item.getAttribute('data-target'));
            });
        });

        // Settings Button from Top bar
        const btnSettings = document.getElementById('btn-settings-open');
        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                openTab('tab-settings');
            });
        }

        // Settings Toggles
        const toggleDark = document.getElementById('toggle-dark-mode');
        if (toggleDark) {
            toggleDark.addEventListener('change', (e) => {
                this.settings.darkMode = e.target.checked;
                this.saveSettings();
            });
        }

        const toggleAuto = document.getElementById('toggle-auto-download');
        if (toggleAuto) {
            toggleAuto.addEventListener('change', (e) => {
                this.settings.autoDownload = e.target.checked;
                this.saveSettings();
            });
        }

        // Reset Data
        const btnReset = document.getElementById('btn-reset-data');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                window.utils.confirmUI('Reset App Data', 'Menghapus semua data dan pengaturan aplikasi lokal?', () => {
                    localStorage.removeItem('fileUtilitySettings');
                    location.reload();
                });
            });
        }

        // Prevent Default Drag drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
    }
};

// Global Utilities
window.utils = {
    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },
    triggerDownload(blobContent, fileName) {
        const url = URL.createObjectURL(blobContent);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    },
    isAutoDownloadEnabled() {
        return AppState.settings.autoDownload;
    },
    showModal(title, message, isConfirm, onConfirm) {
        const overlay = document.getElementById('ui-modal-overlay');
        if (!overlay) return;

        const titleEl = document.getElementById('ui-modal-title');
        const msgEl = document.getElementById('ui-modal-message');
        const confirmActions = document.getElementById('ui-modal-actions-confirm');
        const alertActions = document.getElementById('ui-modal-actions-alert');

        const btnCancel = document.getElementById('ui-btn-cancel');
        const btnConfirm = document.getElementById('ui-btn-confirm');
        const btnOk = document.getElementById('ui-btn-ok');

        titleEl.textContent = title;
        msgEl.innerHTML = message;

        const cleanUp = () => {
            overlay.style.display = 'none';
            btnCancel.onclick = null;
            btnConfirm.onclick = null;
            btnOk.onclick = null;
        };

        if (isConfirm) {
            confirmActions.style.display = 'flex';
            alertActions.style.display = 'none';

            btnCancel.onclick = cleanUp;
            btnConfirm.onclick = () => {
                cleanUp();
                if (onConfirm) onConfirm();
            };
        } else {
            confirmActions.style.display = 'none';
            alertActions.style.display = 'flex';

            btnOk.onclick = () => {
                cleanUp();
                if (onConfirm) onConfirm();
            };
        }

        overlay.style.display = 'flex';
    },
    confirmUI(title, message, onConfirm) {
        this.showModal(title, message, true, onConfirm);
    },
    alertUI(title, message, onOk) {
        this.showModal(title, message, false, onOk);
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
});
