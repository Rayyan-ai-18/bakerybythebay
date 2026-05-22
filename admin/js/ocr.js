// OCR functionality - sends image to our backend for processing
document.addEventListener('DOMContentLoaded', () => {
    const btnPublish = document.getElementById('btnPublish');
    const menuItemsContainer = document.getElementById('menuItemsContainer');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    if (!btnPublish || !menuItemsContainer) return;

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        successMessage.style.display = 'none';
    }

    // Show success message
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    // Hide messages
    function hideMessages() {
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    }

    // Process captured image with OCR via our backend
    async function processMenuImage() {
        hideMessages();

        const imageBlob = window.getCapturedImageBlob();
        if (!imageBlob) {
            showError('Please capture or upload an image first');
            return;
        }

        btnPublish.disabled = true;

        // Show a timed progress indicator
        const startTime = Date.now();
        btnPublish.textContent = 'Scanning menu...';

        // Update the button text every 5 seconds to show progress
        const progressInterval = setInterval(() => {
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            const dots = '.'.repeat(((elapsed / 2) % 4) + 1);
            if (elapsed < 30) {
                btnPublish.textContent = `Scanning${dots} (${elapsed}s)`;
            } else {
                btnPublish.textContent = `Still working${dots} (${elapsed}s)`;
            }
        }, 2000);

        try {
            const base64Image = await blobToBase64(imageBlob);

            // Client-side timeout: 60 seconds max (3 models × 28s = 84s server, but keep user wait reasonable)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch('/api/scan-menu', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageBase64: base64Image
                })
            });
            clearTimeout(timeoutId);

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to process image');
            }

            clearInterval(progressInterval);

            if (Array.isArray(result) && result.length > 0) {
                renderMenuItems(result);
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                showSuccess(`Found ${result.length} menu items in ${elapsed}s. Review and edit as needed.`);
                btnPublish.disabled = false;
                btnPublish.textContent = 'Publish Menu';
            } else {
                showError('No menu items detected. Please try again with a clearer image.');
                btnPublish.disabled = false;
                btnPublish.textContent = 'Publish Menu';
            }
        } catch (err) {
            clearInterval(progressInterval);
            console.error('OCR error:', err);
            if (err.name === 'AbortError') {
                showError('Request timed out after 60 seconds. Please try again with a clearer image.');
            } else {
                showError(err.message || 'An error occurred while processing the image');
            }
            btnPublish.disabled = false;
            btnPublish.textContent = 'Publish Menu';
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

    // Render menu items as editable cards
    function renderMenuItems(items) {
        menuItemsContainer.innerHTML = ''; // Clear previous

        items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'menu-item-card editable';
            card.dataset.index = index;

            card.innerHTML = `
                <h4>${item.name || 'Unnamed Item'}</h4>
                <div class="price">$${parseFloat(item.price || 0).toFixed(2)}</div>
                <div class="category">${item.category || 'Other'}</div>
                <div class="menu-item-inputs">
                    <div class="form-group">
                        <label for="name-${index}">Item Name</label>
                        <input type="text" id="name-${index}" value="${item.name || ''}">
                    </div>
                    <div class="form-group">
                        <label for="price-${index}">Price ($)</label>
                        <input type="number" id="price-${index}" step="0.01" min="0" value="${item.price || 0}">
                    </div>
                    <div class="form-group">
                        <label for="category-${index}">Category</label>
                        <input type="text" id="category-${index}" value="${item.category || ''}">
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="available-${index}" ${item.available !== false ? 'checked' : ''}>
                            Available
                        </label>
                    </div>
                </div>
                <button class="btn-edit" onclick="toggleEdit(this)">Edit</button>
            `;

            menuItemsContainer.appendChild(card);
        });
    }

    // Toggle edit mode for a menu item
    window.toggleEdit = function(button) {
        const card = button.parentElement;
        const inputs = card.querySelector('.menu-item-inputs');
        const isVisible = inputs.style.display === 'block';

        if (isVisible) {
            inputs.style.display = 'none';
            button.textContent = 'Edit';
            // Save changes from inputs
            const index = card.dataset.index;
            const nameInput = card.querySelector(`#name-${index}`);
            const priceInput = card.querySelector(`#price-${index}`);
            const categoryInput = card.querySelector(`#category-${index}`);
            const availableInput = card.querySelector(`#available-${index}`);

            // Update display
            card.querySelector('h4').textContent = nameInput.value || 'Unnamed Item';
            card.querySelector('.price').textContent = `$${parseFloat(priceInput.value || 0).toFixed(2)}`;
            card.querySelector('.category').textContent = categoryInput.value || 'Other';
        } else {
            inputs.style.display = 'block';
            button.textContent = 'Save';
        }
    };

    // Publish menu - collect all items and send to backend
    btnPublish.addEventListener('click', async () => {
        hideMessages();

        const cards = menuItemsContainer.querySelectorAll('.menu-item-card');
        if (cards.length === 0) {
            showError('No menu items to publish');
            return;
        }

        const items = [];
        let hasError = false;

        cards.forEach((card, index) => {
            const nameInput = card.querySelector(`#name-${index}`);
            const priceInput = card.querySelector(`#price-${index}`);
            const categoryInput = card.querySelector(`#category-${index}`);
            const availableInput = card.querySelector(`#available-${index}`);

            const name = nameInput.value.trim();
            const price = parseFloat(priceInput.value);
            const category = categoryInput.value.trim() || 'Other';
            const available = availableInput.checked;

            if (!name || isNaN(price) || price <= 0) {
                hasError = true;
                return;
            }

            items.push({
                name,
                price,
                category,
                available
            });
        });

        if (hasError || items.length === 0) {
            showError('Please fill in all item details correctly');
            return;
        }

        // Get today's date
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        btnPublish.disabled = true;
        btnPublish.textContent = 'Publishing...';

        try {
            const response = await fetch('/api/publish-menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: today,
                    items: items
                    // Note: we're not sending menuId here because we'll let the backend handle upsert by date
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to publish menu');
            }

            showSuccess('Menu published successfully! It will appear on the customer page shortly.');

            // Optionally clear the form after a delay
            setTimeout(() => {
                menuItemsContainer.innerHTML = '';
                btnPublish.textContent = 'Publish Menu';
                btnPublish.disabled = false;
            }, 2000);
        } catch (err) {
            console.error('Publish error:', err);
            showError(err.message || 'Failed to publish menu');
            btnPublish.disabled = false;
            btnPublish.textContent = 'Publish Menu';
        }
    });
});