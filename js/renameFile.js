document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('rename-upload-area');
    const fileInput = document.getElementById('rename-file-input');
    const btnBrowse = document.getElementById('btn-rename-browse');
    const editorArea = document.getElementById('rename-editor');

    const prefixInput = document.getElementById('rename-prefix');
    const suffixInput = document.getElementById('rename-suffix');
    const previewText = document.getElementById('rename-preview-text');
    const fileListArea = document.getElementById('rename-file-list');
    const countText = document.getElementById('rename-count-text');

    const btnProcess = document.getElementById('btn-process-rename');
    const spinner = document.getElementById('rename-spinner');
    const btnText = btnProcess.querySelector('.btn-text');

    let selectedFiles = [];

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

        selectedFiles = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));

        countText.textContent = `${selectedFiles.length} files selected`;
        editorArea.style.display = 'block';

        updatePreviews();
        fileInput.value = '';
    }

    function getExtension(filename) {
        const lastIndex = filename.lastIndexOf('.');
        if (lastIndex === -1 || lastIndex === 0) return '';
        return filename.substring(lastIndex);
    }

    function generateNewName(originalName, index) {
        const ext = getExtension(originalName);
        const prefix = prefixInput.value.trim();
        const suffix = suffixInput.value.trim();
        const numStr = (index + 1).toString();

        if (!prefix && !suffix) {
            return `${numStr}_${originalName}`;
        }
        return `${prefix}${numStr}${suffix}${ext}`;
    }

    function updatePreviews() {
        if (selectedFiles.length === 0) return;

        // Sample
        previewText.textContent = generateNewName(selectedFiles[0].name, 0);

        // List Render
        fileListArea.innerHTML = '';
        const limit = Math.min(selectedFiles.length, 50);

        for (let i = 0; i < limit; i++) {
            const file = selectedFiles[i];
            const newName = generateNewName(file.name, i);

            const item = document.createElement('div');
            item.className = 'rename-item';

            const oSpan = document.createElement('div');
            oSpan.className = 'old';
            oSpan.textContent = file.name;
            item.appendChild(oSpan);

            const arr = document.createElement('div');
            arr.className = 'arrow';
            arr.textContent = '→';
            item.appendChild(arr);

            const nSpan = document.createElement('div');
            nSpan.className = 'new';
            nSpan.textContent = newName;
            item.appendChild(nSpan);

            fileListArea.appendChild(item);
        }

        if (selectedFiles.length > limit) {
            const more = document.createElement('div');
            more.className = 'rename-item';
            more.style.justifyContent = 'center';
            more.style.color = 'var(--text-secondary)';
            more.textContent = `...and ${selectedFiles.length - limit} more files`;
            fileListArea.appendChild(more);
        }
    }

    prefixInput.addEventListener('input', updatePreviews);
    suffixInput.addEventListener('input', updatePreviews);

    btnProcess.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        btnProcess.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Zipping...';

        try {
            const zip = new JSZip();

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const newName = generateNewName(file.name, i);
                const arrayBuffer = await file.arrayBuffer();
                zip.file(newName, arrayBuffer);
            }

            let totalOriginalSize = 0;
            selectedFiles.forEach(f => totalOriginalSize += f.size);

            const content = await zip.generateAsync({ type: 'blob' });
            const pVal = prefixInput.value.trim() || 'Renamed';
            const dlName = `${pVal}_Files.zip`;

            // Log Success
            if (window.AppHistory) {
                window.AppHistory.addHistory({
                    actionType: 'rename',
                    fileName: `${selectedFiles.length} files renamed`,
                    fileType: 'zip',
                    sizeBefore: totalOriginalSize,
                    sizeAfter: content.size,
                    status: 'success'
                });
            }

            if (window.utils.isAutoDownloadEnabled()) {
                window.utils.triggerDownload(content, dlName);
                window.utils.alertUI('Berhasil', 'ZIP Downloaded Successfully!', () => {
                    resetRename();
                });
            } else {
                window.utils.confirmUI('Download ZIP', 'ZIP is ready. Download now?', () => {
                    window.utils.triggerDownload(content, dlName);
                    resetRename();
                });
            }

        } catch (error) {
            console.error(error);

            let totalOriginalSize = 0;
            selectedFiles.forEach(f => totalOriginalSize += f.size);

            // Log Failed
            if (window.AppHistory) {
                window.AppHistory.addHistory({
                    actionType: 'rename',
                    fileName: `${selectedFiles.length} files failed`,
                    fileType: 'zip',
                    sizeBefore: totalOriginalSize,
                    sizeAfter: 0,
                    status: 'failed'
                });
            }

            window.utils.alertUI('Gagal', 'Error generating ZIP file.');
        } finally {
            btnProcess.disabled = false;
            spinner.style.display = 'none';
            btnText.textContent = 'Rename & Download ZIP';
        }
    });

    function resetRename() {
        selectedFiles = [];
        editorArea.style.display = 'none';
        countText.textContent = '0 files selected';
        prefixInput.value = '';
        suffixInput.value = '';
    }
});
