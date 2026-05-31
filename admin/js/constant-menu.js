// Constant Menu Editor — manages the bakery's permanent menu items
import { supabase } from '../../js/supabase-client.js';
import { requireAuth, handleLogout } from './auth-guard.js';

// Require authentication
await requireAuth();

const menuItemsContainer = document.getElementById('menuItemsContainer');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const btnSaveConstant = document.getElementById('btnSaveConstant');
const btnAddItem = document.getElementById('btnAddItem');

// Track current items
let currentItems = [];
let nextTempId = 1;

// --- Helpers ---

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// --- Load existing constant menu from Supabase ---

async function loadConstantMenu() {
    const loading = document.getElementById('itemsLoading');
    if (loading) loading.style.display = 'flex';

    try {
        const { data, error } = await supabase
            .from('menus')
            .select('*, menu_items(*)')
            .eq('type', 'constant')
            .eq('published', true)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Error loading constant menu:', error);
            showError('Failed to load constant menu');
            return;
        }

        if (data && data.menu_items && data.menu_items.length > 0) {
            currentItems = data.menu_items.map(item => ({
                _tempId: nextTempId++,
                item_id: item.item_id,
                name: item.name,
                price: parseFloat(item.price),
                category: item.category,
                available: item.available !== false
            }));
        } else {
            currentItems = [];
        }

        renderItems();
    } catch (err) {
        console.error('Error in loadConstantMenu:', err);
        showError('Failed to load constant menu');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// --- Render items as editable cards ---

function renderItems() {
    if (!menuItemsContainer) return;

    if (currentItems.length === 0) {
        menuItemsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No constant menu items yet</h3>
                <p>Add items using the photo upload above, or click "Add Item" to add manually.</p>
            </div>
        `;
        return;
    }

    menuItemsContainer.innerHTML = currentItems.map((item, idx) => `
        <div class="menu-item-card editable" data-temp-id="${item._tempId}">
            <h4>${item.name}</h4>
            <div class="price">$${item.price.toFixed(2)}</div>
            <div class="category">${item.category}</div>
            <div class="menu-item-inputs" style="display:none;">
                <div class="form-group">
                    <label for="name-${item._tempId}">Item Name</label>
                    <input type="text" id="name-${item._tempId}" value="${item.name}">
                </div>
                <div class="form-group">
                    <label for="price-${item._tempId}">Price ($)</label>
                    <input type="number" id="price-${item._tempId}" step="0.01" min="0" value="${item.price}">
                </div>
                <div class="form-group">
                    <label for="category-${item._tempId}">Category</label>
                    <input type="text" id="category-${item._tempId}" value="${item.category}">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="available-${item._tempId}" ${item.available ? 'checked' : ''}>
                        Available
                    </label>
                </div>
            </div>
            <div style="display:flex;gap:0.5rem;align-items:center;">
                <button class="btn-edit" data-temp-id="${item._tempId}">Edit</button>
                <button class="btn-edit" data-temp-id="${item._tempId}" data-action="delete" style="color:var(--terracotta-hover);border-color:var(--terracotta-hover);">Remove</button>
            </div>
        </div>
    `).join('');

    // Add event listeners
    menuItemsContainer.querySelectorAll('.btn-edit').forEach(btn => {
        const tempId = parseInt(btn.dataset.tempId);
        if (btn.dataset.action === 'delete') {
            btn.addEventListener('click', () => removeItem(tempId));
        } else {
            btn.addEventListener('click', () => toggleEdit(btn, tempId));
        }
    });
}

function toggleEdit(button, tempId) {
    const card = button.closest('.menu-item-card');
    const inputs = card.querySelector('.menu-item-inputs');
    const isVisible = inputs.style.display === 'block';

    if (isVisible) {
        inputs.style.display = 'none';
        button.textContent = 'Edit';

        // Save changes from inputs
        const nameInput = card.querySelector(`#name-${tempId}`);
        const priceInput = card.querySelector(`#price-${tempId}`);
        const categoryInput = card.querySelector(`#category-${tempId}`);
        const availableInput = card.querySelector(`#available-${tempId}`);

        const idx = currentItems.findIndex(i => i._tempId === tempId);
        if (idx !== -1) {
            currentItems[idx].name = nameInput.value || 'Unnamed Item';
            currentItems[idx].price = parseFloat(priceInput.value) || 0;
            currentItems[idx].category = categoryInput.value || 'Other';
            currentItems[idx].available = availableInput.checked;
        }

        // Update display
        card.querySelector('h4').textContent = currentItems[idx]?.name || 'Unnamed Item';
        card.querySelector('.price').textContent = `$${(currentItems[idx]?.price || 0).toFixed(2)}`;
        card.querySelector('.category').textContent = currentItems[idx]?.category || 'Other';
    } else {
        inputs.style.display = 'block';
        button.textContent = 'Save';
    }
}

function removeItem(tempId) {
    currentItems = currentItems.filter(i => i._tempId !== tempId);
    renderItems();
    showSuccess('Item removed');
}

function addItem() {
    const newItem = {
        _tempId: nextTempId++,
        name: 'New Item',
        price: 0,
        category: 'Other',
        available: true
    };
    currentItems.push(newItem);
    renderItems();
    showSuccess('New item added — click Edit to fill in details');
}

// --- OCR: process menu image and append results ---

window.processMenuImage = async function() {
    hideMessages();

    const imageBlob = window.getCapturedImageBlob();
    if (!imageBlob) {
        showError('Please capture or upload an image first');
        return;
    }

    btnSaveConstant.disabled = true;
    btnSaveConstant.textContent = 'Scanning...';

    const startTime = Date.now();

    try {
        const base64Image = await blobToBase64(imageBlob);

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

        if (!response.ok) throw new Error(result.error || 'Failed to process image');

        if (Array.isArray(result) && result.length > 0) {
            // Append detected items to current list
            result.forEach(item => {
                currentItems.push({
                    _tempId: nextTempId++,
                    name: item.name,
                    price: item.price,
                    category: item.category || 'Other',
                    available: true
                });
            });

            renderItems();

            const elapsed = Math.round((Date.now() - startTime) / 1000);
            showSuccess(`Added ${result.length} items from photo in ${elapsed}s. Review and edit as needed.`);
        } else {
            showError('No menu items detected. Please try again with a clearer image.');
        }
    } catch (err) {
        console.error('OCR error:', err);
        showError(err.name === 'AbortError'
            ? 'Request timed out. Please try again with a clearer image.'
            : (err.message || 'An error occurred while processing the image'));
    } finally {
        btnSaveConstant.disabled = false;
        btnSaveConstant.textContent = '💾 Save Constant Menu';
    }
};

// --- Save constant menu ---

btnSaveConstant.addEventListener('click', async () => {
    hideMessages();

    // Validate all items
    const items = currentItems.map(item => ({
        name: item.name,
        price: item.price,
        category: item.category,
        available: item.available
    }));

    if (items.length === 0) {
        showError('Add at least one menu item before saving');
        return;
    }

    // Validate: check all items have names and valid prices
    const invalidItem = items.find(i => !i.name.trim() || isNaN(i.price) || i.price <= 0);
    if (invalidItem) {
        showError('Please fill in valid name and price for all items');
        return;
    }

    btnSaveConstant.disabled = true;
    btnSaveConstant.textContent = 'Saving...';

    try {
        const response = await fetch('/api/publish-menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'constant',
                items: items
            })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Failed to save constant menu');

        showSuccess('Constant menu saved successfully! ✅ Items are now live on the public menu page.');

        // Reload items to get server-assigned IDs
        setTimeout(() => loadConstantMenu(), 1500);
    } catch (err) {
        console.error('Save constant menu error:', err);
        showError(err.message || 'Failed to save constant menu');
    } finally {
        btnSaveConstant.disabled = false;
        btnSaveConstant.textContent = '💾 Save Constant Menu';
    }
});

// --- Add Item button ---

btnAddItem.addEventListener('click', addItem);

// --- Logout buttons ---

const btnLogout = document.getElementById('btnLogout');
if (btnLogout) btnLogout.addEventListener('click', handleLogout);
const btnLogoutNav = document.getElementById('btnLogoutNav');
if (btnLogoutNav) btnLogoutNav.addEventListener('click', handleLogout);
const btnLogoutMobile = document.getElementById('btnLogoutMobile');
if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', handleLogout);

// --- Initial load ---

await loadConstantMenu();
