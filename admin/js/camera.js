// Camera functionality for menu upload
import { requireAuth, handleLogout } from './auth-guard.js';

// Require authentication — redirects to login if no session
await requireAuth();

let videoElement = null;
let mediaStream = null;
let capturedImageBlob = null;

// Compress image to reduce payload - resize to max 1200px, JPEG quality 0.8
function compressImage(blob, maxDimension = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = Math.round(height * (maxDimension / width));
                    width = maxDimension;
                } else {
                    width = Math.round(width * (maxDimension / height));
                    height = maxDimension;
                }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
    });
}

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
                video: {
                    facingMode: 'environment', // Prefer rear camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
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

    // Track previous preview URL so we can revoke it
    let previousPreviewUrl = null;

    function revokePreviewUrl() {
        if (previousPreviewUrl) {
            URL.revokeObjectURL(previousPreviewUrl);
            previousPreviewUrl = null;
        }
    }

    // Capture photo from video and compress it
    async function capturePhoto() {
        if (!videoElement || !videoElement.srcObject) return;

        // Create canvas to capture image
        revokePreviewUrl();
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Convert to blob then compress
        cameraStatus.textContent = 'Processing image...';
        canvas.toBlob(async (blob) => {
            try {
                const compressedBlob = await compressImage(blob);
                capturedImageBlob = compressedBlob;
                previousPreviewUrl = URL.createObjectURL(compressedBlob);
                videoElement.src = previousPreviewUrl;
                cameraStatus.textContent = 'Photo captured! Scanning...';
                cameraStatus.style.color = '#2ed573';
                btnCapture.textContent = 'Retake';
                // Auto-trigger OCR
                setTimeout(() => { if (window.processMenuImage) window.processMenuImage(); }, 200);
            } catch (err) {
                console.error('Compression error:', err);
                capturedImageBlob = blob;
                previousPreviewUrl = URL.createObjectURL(blob);
                videoElement.src = previousPreviewUrl;
                cameraStatus.textContent = 'Photo captured!';
                cameraStatus.style.color = '#2ed573';
                btnCapture.textContent = 'Retake';
            }
        }, 'image/jpeg', 0.85);
    }

    // Handle file upload with compression
    function handleFileUpload() {
        fileInput.click();
    }

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        revokePreviewUrl();
        cameraStatus.textContent = 'Processing image...';
        try {
            const compressedBlob = await compressImage(file);
            capturedImageBlob = compressedBlob;
            previousPreviewUrl = URL.createObjectURL(compressedBlob);
            videoElement.src = previousPreviewUrl;
            cameraStatus.textContent = 'File selected! Scanning...';
            cameraStatus.style.color = '#2ed573';
            btnCapture.textContent = 'Retake';
            // Auto-trigger OCR
            setTimeout(() => { if (window.processMenuImage) window.processMenuImage(); }, 200);
        } catch (err) {
            console.error('Compression error:', err);
            capturedImageBlob = file;
            previousPreviewUrl = URL.createObjectURL(file);
            videoElement.src = previousPreviewUrl;
            cameraStatus.textContent = 'File selected!';
            cameraStatus.style.color = '#2ed573';
            btnCapture.textContent = 'Retake';
        }

        fileInput.value = '';
    });

    // Event listeners
    btnCapture.addEventListener('click', capturePhoto);
    btnUploadFile.addEventListener('click', handleFileUpload);

    // Initialize camera
    initCamera();

    // Logout button
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', handleLogout);
    }

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