// Cart functionality using sessionStorage
const CART_KEY = 'bakeryCart';

// Initialize cart from sessionStorage or create empty
function getCart() {
    const cart = sessionStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

// Save cart to sessionStorage
function saveCart(cart) {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Add item to cart
window.addToCart = function(itemId, name, price) {
    const cart = getCart();
    const existingItem = cart.find(item => item.id === itemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: itemId,
            name: name,
            price: price,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartUI();

    // Show cart drawer briefly as feedback
    openCartDrawer();
};

// Remove item from cart
window.removeFromCart = function(itemId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== itemId);
    saveCart(cart);
    updateCartUI();
};

// Update quantity of an item in cart
window.updateCartQuantity = function(itemId, quantity) {
    if (quantity < 1) {
        window.removeFromCart(itemId);
        return;
    }

    const cart = getCart();
    const item = cart.find(item => item.id === itemId);
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
    }
    updateCartUI();
};

// Get total number of items in cart
function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

// Get total price of cart
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Open cart drawer
function openCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartDrawerOverlay');
    if (drawer) drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
}

// Close cart drawer
function closeCartDrawer() {
    const drawer = document.getElementById('cartDrawer');
    const overlay = document.getElementById('cartDrawerOverlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
}

// Update cart UI (called when cart changes)
function updateCartUI() {
    // Update cart badge in floating button
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const count = getCartItemCount();
        cartCount.textContent = count;
        cartCount.style.display = count > 0 ? 'flex' : 'none';
    }

    // Update cart count in header
    const cartCountSmall = document.getElementById('cartCountSmall');
    if (cartCountSmall) {
        const count = getCartItemCount();
        cartCountSmall.textContent = count;
    }

    // Update cart total in drawer
    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        cartTotal.textContent = `$${getCartTotal().toFixed(2)}`;
    }

    // Update cart items in drawer
    const cartItemsContainer = document.getElementById('cartItems');
    if (cartItemsContainer) {
        const cart = getCart();
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <div class="empty-cart-icon">🛒</div>
                    <p>Your cart is empty</p>
                    <p class="text-small text-muted">Add items from the menu to get started</p>
                </div>
            `;
        } else {
            cartItemsContainer.innerHTML = cart.map((item, idx) => `
                <div class="cart-item" data-item-idx="${idx}">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${item.name}</span>
                        <div class="cart-item-controls">
                            <button class="cart-item-qty-btn" onclick="window.updateCartQuantity('${item.id}', ${item.quantity - 1})">−</button>
                            <span class="cart-item-qty">${item.quantity}</span>
                            <button class="cart-item-qty-btn" onclick="window.updateCartQuantity('${item.id}', ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.5rem;">
                        <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                        <button class="cart-item-remove" onclick="window.removeFromCart('${item.id}')" title="Remove">✕</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Initialize cart UI and event listeners on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    // Cart toggle button
    const cartToggle = document.getElementById('cartToggle');
    if (cartToggle) {
        cartToggle.addEventListener('click', openCartDrawer);
    }

    // Cart close button
    const cartDrawerClose = document.getElementById('cartDrawerClose');
    if (cartDrawerClose) {
        cartDrawerClose.addEventListener('click', closeCartDrawer);
    }

    // Overlay click to close
    const overlay = document.getElementById('cartDrawerOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeCartDrawer);
    }

    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }
});

// Also update cart UI when storage changes (for other tabs)
window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) {
        updateCartUI();
    }
});

// Make functions globally available (for use in menu.js and checkout.js)
window.getCart = getCart;
window.saveCart = saveCart;
window.getCartTotal = getCartTotal;