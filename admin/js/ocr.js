// OCR functionality - sends image to our backend for processing

// Process captured image with OCR via our backend
async function processMenuImage() {
    const btnPublish = document.getElementById('btnPublish');
    const menuItemsContainer = document.getElementById('menuItemsContainer');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    if (!btnPublish || !menuItemsContainer) return;

    // Hide messages
    if (errorMessage) errorMessage.style.display = 'none';
    if (successMessage) successMessage.style.display = 'none';

    const imageBlob = window.getCapturedImageBlob();
    if (!imageBlob) {
        if (errorMessage) {
            errorMessage.textContent = 'Please capture or upload an image first';
            errorMessage.style.display = 'block';
        }
        return;
    }

    btnPublish.disabled = true;

    // Show a timed progress indicator
    const startTime = Date.now();
    btnPublish.textContent = 'Scanning menu...';

    // Update the button text every 2 seconds to show progress
    const progressInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        const dots = '.'.repeat(((elapsed / 2) % 4) + 1);
        btnPublish.textContent = `Scanning${dots} (${elapsed}s)`;
    }, 2000);

    try {
        const base64Image = await blobToBase64(imageBlob);

        // Client-side timeout: 60 seconds max
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch('/api/scan-menu', {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Image })
        });
        clearTimeout(timeoutId);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to process image');
        }

        clearInterval(progressInterval);

        if (Array.isArray(result) && result.length > 0) {
            // Delegate rendering to menu-editor.js via its globally exposed function
            if (window.renderMenuItems) {
                window.renderMenuItems(result);
            }
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            if (successMessage) {
                successMessage.textContent = `Found ${result.length} menu items in ${elapsed}s. Review and edit as needed.`;
                successMessage.style.display = 'block';
            }
            btnPublish.disabled = false;
            btnPublish.textContent = '📢 Publish Menu';
        } else {
            if (errorMessage) {
                errorMessage.textContent = 'No menu items detected. Please try again with a clearer image.';
                errorMessage.style.display = 'block';
            }
            btnPublish.disabled = false;
            btnPublish.textContent = '📢 Publish Menu';
        }
    } catch (err) {
        clearInterval(progressInterval);
        console.error('OCR error:', err);
        if (errorMessage) {
            errorMessage.textContent = err.name === 'AbortError'
                ? 'Request timed out after 60 seconds. Please try again with a clearer image.'
                : (err.message || 'An error occurred while processing the image');
            errorMessage.style.display = 'block';
        }
        btnPublish.disabled = false;
        btnPublish.textContent = '📢 Publish Menu';
    }
}

// Convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1]; // Remove data:image/jpeg;base64,
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Expose processMenuImage globally for camera.js to call
window.processMenuImage = processMenuImage;