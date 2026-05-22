// Camera functionality for menu upload
let videoElement = null;
let mediaStream = null;
let capturedImageBlob = null;

document.addEventListener('DOMContentLoaded', () => {
    videoElement = document.getElementById('videoElement');
    const btnCapture = document.getElementById('btnCapture');
    const btnUploadFile = document.getElementById('btnUploadFile');
    const fileInput = document.getElementById('fileInput');
    const cameraStatus = document.getElementById('cameraStatus');
    const btnPublish = document.getElementById('btnPublish');

    if (!videoElement || !btnCapture || !btnUploadFile || !fileInput) return;

    // Request camera access
    async function initCamera() {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prefer rear camera
            });
            videoElement.srcObject = mediaStream;
            cameraStatus.textContent = 'Camera ready';
            cameraStatus.style.color = '#2ed573';
            btnCapture.disabled = false;
        } catch (err) {
            console.error('Camera access denied:', err);
            cameraStatus.textContent = 'Camera access denied. Please allow camera access or upload a file instead.';
            cameraStatus.style.color = '#ff6b6b';
            btnCapture.disabled = true;
        }
    }

    // Capture photo from video
    function capturePhoto() {
        if (!videoElement || !videoElement.srcObject) return;

        // Create canvas to capture image
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert to blob
        canvas.toBlob((blob) => {
            capturedImageBlob = blob;
            // Show preview
            const previewUrl = URL.createObjectURL(blob);
            videoElement.src = previewUrl; // Show captured image
            cameraStatus.textContent = 'Photo captured!';
            cameraStatus.style.color = '#2ed573';
            btnCapture.textContent = 'Retake';

            // Enable publish button (will be enabled after OCR processing)
            // We'll enable it in ocr.js after processing
        }, 'image/jpeg', 0.9);
    }

    // Handle file upload
    function handleFileUpload() {
        fileInput.click();
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Create blob from file
        capturedImageBlob = file;

        // Show preview
        const previewUrl = URL.createObjectURL(file);
        videoElement.src = previewUrl; // Show selected image
        cameraStatus.textContent = 'File selected!';
        cameraStatus.style.color = '#2ed573';
        btnCapture.textContent = 'Retake';

        // Reset file input
        fileInput.value = '';
    });

    // Event listeners
    btnCapture.addEventListener('click', capturePhoto);
    btnUploadFile.addEventListener('click', handleFileUpload);

    // Initialize camera
    initCamera();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
    });
});

// Export blob for use in other modules
function getCapturedImageBlob() {
    return capturedImageBlob;
}

// Make available globally (in module scope, we'll attach to window for simplicity)
window.getCapturedImageBlob = getCapturedImageBlob;