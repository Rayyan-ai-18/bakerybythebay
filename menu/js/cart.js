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
    // Update nav badge
    const cartCountNav = document.getElementById('cartCountNav');
    if (cartCountNav) {
        const count = getCartItemCount();
        cartCountNav.classList.toggle('has-items', count > 0);
    }

    // Update cart badge in floating button
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const count = getCartItemCount();
        cartCount.textContent = count;
        cartCount.classList.toggle('has-items', count > 0);
    }

    // Toggle FAB visibility and update text
    const cartToggleFloat = document.getElementById('cartToggleFloat');
    const cartFabText = document.getElementById('cartFabText');
    if (cartToggleFloat) {
        const count = getCartItemCount();
        cartToggleFloat.classList.toggle('has-items', count > 0);
        if (count > 0 && cartFabText) {
            const total = getCartTotal();
            cartFabText.textContent = `${count} item${count !== 1 ? 's' : ''} · $${total.toFixed(2)}`;
        } else if (cartFabText) {
            cartFabText.textContent = 'View Cart';
        }
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
                <div style="text-align:center;padding:3rem 0;">
                    <div style="width:48px;height:48px;margin:0 auto 1rem;opacity:0.3;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 01-8 0"/>
                        </svg>
                    </div>
                    <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.2rem;color:#3D2B1F;">Your order is empty</p>
                    <p style="font-size:0.8rem;color:#7A5C4A;margin-top:0.5rem;">Add items from the menu to get started</p>
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

    // Floating cart toggle
    const cartToggleFloat = document.getElementById('cartToggleFloat');
    if (cartToggleFloat) {
        cartToggleFloat.addEventListener('click', openCartDrawer);
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