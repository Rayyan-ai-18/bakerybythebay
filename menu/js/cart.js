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

// Update cart UI (called when cart changes)
function updateCartUI() {
    // Update cart badge in floating button
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const count = getCartItemCount();
        cartCount.textContent = count;
        // Hide badge if empty
        cartCount.style.display = count > 0 ? 'block' : 'none';
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
            cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <span class="cart-item-name">${item.name}</span>
                        <span class="cart-item-quantity">×${item.quantity}</span>
                    </div>
                    <div>
                        <span class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
                        <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Initialize cart UI on page load
document.addEventListener('DOMContentLoaded', updateCartUI);

// Also update cart UI when storage changes (for other tabs)
window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) {
        updateCartUI();
    }
});

// Make functions globally available (for use in menu.js)
window.getCart = getCart;
window.saveCart = saveCart;