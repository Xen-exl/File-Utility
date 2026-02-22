document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('pdf-upload-area');
    const fileInput = document.getElementById('pdf-file-input');
    const btnBrowse = document.getElementById('btn-pdf-browse');
    const previewList = document.getElementById('pdf-preview-list');
    const actionArea = document.getElementById('pdf-action-area');
    const btnCreate = document.getElementById('btn-create-pdf');
    const spinner = document.getElementById('pdf-spinner');
    const btnText = btnCreate.querySelector('.btn-text');

    let selectedFiles = [];

    // Browse click logic
    btnBrowse.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', () => {
        uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    uploadArea.addEventListener('drop', (e) => {
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (validFiles.length > 0) {
            selectedFiles = [...selectedFiles, ...validFiles];
            renderPreviews();
        }
        fileInput.value = '';
    }

    function renderPreviews() {
        previewList.innerHTML = '';
        if (selectedFiles.length === 0) {
            actionArea.style.display = 'none';
            return;
        }

        actionArea.style.display = 'block';

        selectedFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'preview-item';

            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.onload = () => URL.revokeObjectURL(img.src);

            const info = document.createElement('div');
            info.className = 'preview-info';

            const name = document.createElement('div');
            name.className = 'file-name';
            name.textContent = file.name;

            const size = document.createElement('div');
            size.className = 'file-size';
            size.textContent = window.utils.formatBytes(file.size);

            info.appendChild(name);
            info.appendChild(size);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
            `;
            removeBtn.onclick = () => {
                selectedFiles.splice(index, 1);
                renderPreviews();
            };

            item.appendChild(img);
            item.appendChild(info);
            item.appendChild(removeBtn);
            previewList.appendChild(item);
        });
    }

    btnCreate.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        btnCreate.disabled = true;
        spinner.style.display = 'inline-block';
        btnText.textContent = 'Processing...';

        let totalOriginalSize = 0;
        selectedFiles.forEach(f => totalOriginalSize += f.size);

        try {
            const { PDFDocument } = PDFLib;
            const pdfDoc = await PDFDocument.create();

            for (const file of selectedFiles) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    let pdfImage;

                    if (file.type === 'image/jpeg') {
                        pdfImage = await pdfDoc.embedJpg(arrayBuffer);
                    } else if (file.type === 'image/png') {
                        pdfImage = await pdfDoc.embedPng(arrayBuffer);
                    } else if (file.type === 'image/webp') {
                        // Attempt fallback or alert if webp isn't natively supported 
                        // Note: To remain robust entirely offline w/o huge polyfills, 
                        // we alert user about unsupported file to prevent crash
                        console.warn(`WEBP format might not be supported directly by this pdf-lib version.`);
                        window.utils.alertUI('Peringatan WEBP', `File ${file.name} mungkin tidak didukung. Harap convert WEBP ke JPG terlebih dahulu jika gagal.`);
                        continue;
                    }

                    if (pdfImage) {
                        const page = pdfDoc.addPage();
                        const { width, height } = page.getSize();
                        const imgDims = pdfImage.scale(1);
                        const scale = Math.min(width / imgDims.width, height / imgDims.height);

                        const scaledWidth = imgDims.width * scale;
                        const scaledHeight = imgDims.height * scale;

                        page.drawImage(pdfImage, {
                            x: (width - scaledWidth) / 2,
                            y: (height - scaledHeight) / 2,
                            width: scaledWidth,
                            height: scaledHeight,
                        });
                    }
                } catch (fileErr) {
                    console.error('Error processing single file', fileErr);
                }
            }

            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const dlName = `Merged_${Date.now()}.pdf`;

            // Record History (Success)
            if (window.AppHistory) {
                window.AppHistory.addHistory({
                    actionType: 'pdf',
                    fileName: `${selectedFiles.length} images merged`,
                    fileType: 'pdf',
                    sizeBefore: totalOriginalSize,
                    sizeAfter: blob.size,
                    status: 'success'
                }, blob); // Pass the blob so history tab can store it in memory for preview
            }

            // Handle Download Action
            if (window.utils.isAutoDownloadEnabled()) {
                window.utils.triggerDownload(blob, `Merged_${Date.now()}.pdf`);
                // Auto Reset after download
                setTimeout(() => {
                    selectedFiles = [];
                    renderPreviews();
                    window.utils.alertUI('Berhasil', 'PDF Successfully Downloaded!');
                }, 500);
            } else {
                // Feature explicitly requested togglable auto-download. 
                // If off, let's just trigger it directly or show a button. 
                // Simplest is prompt user or download manually
                window.utils.confirmUI('Download PDF', 'PDF has been generated. Download now?', () => {
                    window.utils.triggerDownload(blob, `Merged_${Date.now()}.pdf`);
                    selectedFiles = [];
                    renderPreviews();
                });
            }

        } catch (error) {
            console.error(error);

            // Record History (Failed)
            if (window.AppHistory) {
                window.AppHistory.addHistory({
                    actionType: 'pdf',
                    fileName: `${selectedFiles.length} images failed`,
                    fileType: 'pdf',
                    sizeBefore: totalOriginalSize,
                    sizeAfter: 0,
                    status: 'failed'
                });
            }

            window.utils.alertUI('Gagal', 'Failed to generate PDF. Make sure images are JPG or PNG.');
        } finally {
            btnCreate.disabled = false;
            spinner.style.display = 'none';
            btnText.textContent = 'Merge & Download PDF';
        }
    });

});
