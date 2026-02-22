/**
 * Privacy-First History Manager
 * Saves only metadata to localStorage.
 */

window.AppHistory = {
    storageKey: 'fileUtilityHistory',
    maxItems: 50,

    init() {
        // Blob store for current session previews, not saved to localStorage
        this.sessionBlobs = {};
        this.renderHistory();
        this.bindEvents();
    },

    getHistory() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to parse history', e);
            return [];
        }
    },

    saveHistory(historyArray) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(historyArray));
        } catch (e) {
            console.error('Failed to save history', e);
        }
    },

    /**
     * @param {Object} item - History metadata
     * @param {string} item.actionType - 'pdf', 'compress', 'rename'
     * @param {string} item.fileName - e.g. "Merged_123.pdf" or "15 files"
     * @param {string} item.fileType - 'pdf', 'jpg', 'zip'
     * @param {number} item.sizeBefore - Total bytes before
     * @param {number} item.sizeAfter - Total bytes after (or 0 if failed/irrelevant)
     * @param {string} item.status - 'success', 'failed'
     */
    addHistory(item, blob = null) {
        const history = this.getHistory();

        const newItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            processTime: new Date().toISOString(),
            ...item
        };

        if (blob) {
            this.sessionBlobs[newItem.id] = blob;
        }

        history.unshift(newItem);

        // Enforce max limit
        if (history.length > this.maxItems) {
            history.length = this.maxItems;
        }

        this.saveHistory(history);
        this.renderHistory();
    },

    deleteHistory(id) {
        let history = this.getHistory();
        history = history.filter(item => item.id !== id);
        this.saveHistory(history);
        this.renderHistory();
    },

    clearHistory() {
        window.utils.confirmUI('Clear History', 'Apakah Anda yakin ingin menghapus semua history riwayat aktivitas?', () => {
            localStorage.removeItem(this.storageKey);
            this.renderHistory();
        });
    },

    bindEvents() {
        const btnClear = document.getElementById('btn-clear-history');
        if (btnClear) {
            btnClear.addEventListener('click', () => this.clearHistory());
        }
    },

    renderHistory() {
        const container = document.getElementById('history-list');
        const emptyState = document.getElementById('history-empty');
        const countBadge = document.getElementById('history-count');

        if (!container) return;

        const history = this.getHistory();

        if (countBadge) {
            countBadge.textContent = history.length;
        }

        if (history.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = '';

        history.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';

            // Icon mapping
            let iconSvg = '';
            if (item.actionType === 'pdf') {
                iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
            } else if (item.actionType === 'compress') {
                iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
            } else if (item.actionType === 'rename') {
                iconSvg = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
            }

            // Time format
            const dateObj = new Date(item.processTime);
            const timeStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Status Badge
            const statusClass = item.status === 'success' ? 'status-success' : 'status-failed';
            const statusText = item.status === 'success' ? 'Sukses' : 'Gagal';

            // Size text handling
            let sizeText = '';
            if (item.sizeBefore > 0 && item.sizeAfter > 0) {
                sizeText = `${window.utils.formatBytes(item.sizeBefore)} → ${window.utils.formatBytes(item.sizeAfter)}`;
            } else if (item.sizeBefore > 0) {
                sizeText = `${window.utils.formatBytes(item.sizeBefore)}`;
            } else {
                sizeText = '-';
            }

            // Provide clickability for PDFs that have an active session blob
            const hasBlob = this.sessionBlobs && this.sessionBlobs[item.id];
            if (item.actionType === 'pdf' && hasBlob) {
                el.classList.add('clickable');
                el.title = "Klik untuk Preview";
                el.addEventListener('click', (e) => {
                    // Prevent firing if user clicked the delete button
                    if (e.target.closest('.btn-del-hist')) return;
                    this.previewPdf(item, this.sessionBlobs[item.id]);
                });
            }

            el.innerHTML = `
                <div class="hist-icon ${item.actionType}">
                    ${iconSvg}
                </div>
                <div class="hist-details">
                    <div class="hist-title">${item.fileName}</div>
                    <div class="hist-meta">
                        <span>${timeStr}</span> &bull; <span>${sizeText}</span>
                    </div>
                </div>
                <div class="hist-actions">
                    <span class="hist-status ${statusClass}">${statusText}</span>
                    <button class="btn-del-hist" data-id="${item.id}" aria-label="Delete">
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;
            container.appendChild(el);
        });

        // Attach delete events
        const delBtns = container.querySelectorAll('.btn-del-hist');
        delBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                this.deleteHistory(id);
            });
        });
    },

    previewPdf(item, blob) {
        const pdfUrl = URL.createObjectURL(blob);
        const pdfModal = document.getElementById('pdf-preview-modal');
        const pdfIframe = document.getElementById('pdf-iframe');
        const btnClosePdf = document.getElementById('btn-close-pdf');
        const btnDownloadPdfModal = document.getElementById('btn-download-pdf-modal');

        if (!pdfModal || !pdfIframe) {
            window.utils.triggerDownload(blob, item.fileName + '.pdf');
            return;
        }

        pdfIframe.src = pdfUrl;
        pdfModal.style.display = 'flex';

        const cleanupModal = () => {
            pdfModal.style.display = 'none';
            pdfIframe.src = '';
            URL.revokeObjectURL(pdfUrl);
            btnClosePdf.removeEventListener('click', handleClose);
            btnDownloadPdfModal.removeEventListener('click', handleDownload);
        };

        const handleClose = () => {
            cleanupModal();
        };

        const handleDownload = () => {
            window.utils.triggerDownload(blob, item.fileName + '.pdf');
            cleanupModal();
        };

        btnClosePdf.addEventListener('click', handleClose);
        btnDownloadPdfModal.addEventListener('click', handleDownload);
    }
};

// Auto init after DOM loads bounds
document.addEventListener('DOMContentLoaded', () => {
    // Make sure utils is available
    if (window.utils && window.AppHistory) {
        window.AppHistory.init();
    }
});
