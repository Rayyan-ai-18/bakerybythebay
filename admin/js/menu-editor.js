// Menu editor functionality for rendering, editing, and publishing menu items
import { getTodayCanada } from '../../js/canada-date.js';

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

    // Update the step progress indicator
    function setActiveStep(step) {
        for (let i = 1; i <= 3; i++) {
            const el = document.getElementById(`step${i}`);
            if (el) {
                el.classList.toggle('active', i === step);
            }
        }
    }

    // Render menu items as editable cards
    window.renderMenuItems = function(items) {
        hideMessages();
        setActiveStep(2); // Mark Step 2 (Review) as active
        btnPublish.style.display = 'block'; // Show publish button
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
    };

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

        // Get today's date (Canada timezone)
        const today = getTodayCanada();

        btnPublish.disabled = true;
        btnPublish.textContent = 'Publishing...';

        try {
            const response = await fetch('/api/publish-menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'daily_lunch',
                    date: today,
                    items: items
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to publish menu');
            }

            setActiveStep(3); // Mark Step 3 (Publish) as active
            showSuccess('Menu published successfully! ✅ It will appear on the customer page shortly.');

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