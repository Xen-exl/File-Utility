document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('compress-upload-area');
    const fileInput = document.getElementById('compress-file-input');
    const btnBrowse = document.getElementById('btn-compress-browse');
    const editorArea = document.getElementById('compress-editor');

    const origPreview = document.getElementById('compress-original-preview');
    const origSize = document.getElementById('compress-original-size');
    const resPreview = document.getElementById('compress-result-preview');
    const resSize = document.getElementById('compress-result-size');

    const qualitySlider = document.getElementById('compress-quality');
    const qualityVal = document.getElementById('quality-val');
    const btnDownload = document.getElementById('btn-download-compressed');

    let currentFile = null;
    let currentImageElement = new Image();
    let currentBlob = null;
    let processingTimer = null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // UI Trigger
    btnBrowse.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', () => uploadArea.classList.add('dragover'));
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file.type.startsWith('image/')) return;

        currentFile = file;
        origSize.textContent = window.utils.formatBytes(file.size);

        const objUrl = URL.createObjectURL(file);
        origPreview.onload = () => URL.revokeObjectURL(origPreview.src);
        origPreview.src = objUrl;

        // Load into JS Image Object
        currentImageElement.onload = () => {
            canvas.width = currentImageElement.width;
            canvas.height = currentImageElement.height;
            editorArea.style.display = 'block';
            processCompression();
        };
        currentImageElement.src = objUrl;
        fileInput.value = '';
    }

    qualitySlider.addEventListener('input', (e) => {
        qualityVal.textContent = e.target.value;
        // Debounce processing so it doesn't freeze UI
        clearTimeout(processingTimer);
        processingTimer = setTimeout(processCompression, 150);
    });

    function processCompression() {
        if (!currentFile) return;

        const quality = parseInt(qualitySlider.value, 10) / 100;

        // Draw white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImageElement, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    currentBlob = blob;
                    resSize.textContent = window.utils.formatBytes(blob.size);

                    const objUrl = URL.createObjectURL(blob);
                    resPreview.onload = () => URL.revokeObjectURL(resPreview.src);
                    resPreview.src = objUrl;
                }
            },
            'image/jpeg',
            quality
        );
    }

    btnDownload.addEventListener('click', () => {
        if (!currentBlob || !currentFile) {
            if (window.AppHistory) {
                window.AppHistory.addHistory({
                    actionType: 'compress',
                    fileName: currentFile ? currentFile.name : 'Unknown',
                    fileType: 'jpg',
                    sizeBefore: currentFile ? currentFile.size : 0,
                    sizeAfter: 0,
                    status: 'failed'
                });
            }
            return;
        }

        const filename = currentFile.name;
        const cleanName = filename.substring(0, filename.lastIndexOf('.')) || filename;
        const dlName = `${cleanName}_compressed.jpg`;

        try {
            window.utils.triggerDownload(currentBlob, dlName);

            // Log Success
            if (window.AppHistory) {
                window.AppHistory.addHistory({
                    actionType: 'compress',
                    fileName: dlName,
                    fileType: 'jpg',
                    sizeBefore: currentFile.size,
                    sizeAfter: currentBlob.size,
                    status: 'success'
                });
            }
        } catch (e) {
            console.error('Download failed', e);
            if (window.AppHistory) {
                window.AppHistory.addHistory({
                    actionType: 'compress',
                    fileName: dlName,
                    fileType: 'jpg',
                    sizeBefore: currentFile.size,
                    sizeAfter: currentBlob.size,
                    status: 'failed'
                });
            }
        }
    });
});
