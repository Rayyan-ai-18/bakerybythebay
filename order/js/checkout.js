// Import supabase client (anon key)
import { supabase } from '../../js/supabase-client.js';
import { getDatePartsCanada } from '../../js/canada-date.js';

document.addEventListener('DOMContentLoaded', async () => {
    const orderSummary = document.getElementById('orderSummary');
    const orderTotal = document.getElementById('orderTotal');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const checkoutForm = document.getElementById('checkoutForm');
    const customerNameInput = document.getElementById('customerName');
    const customerPhoneInput = document.getElementById('customerPhone');

    if (!orderSummary || !orderTotal || !checkoutForm) return;

    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // Helper to show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        successMessage.classList.remove('show');
    }

    // Helper to show success message
    function showSuccess(message) {
        successMessage.textContent = message;
        successMessage.classList.add('show');
        errorMessage.classList.remove('show');
    }

    // Helper to hide messages
    function hideMessages() {
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
    }

    // Load cart and display order summary
    function loadOrderSummary() {
        hideMessages();
        const cart = window.getCart ? window.getCart() : [];

        if (cart.length === 0) {
            orderSummary.innerHTML = '<p class="text-muted">Your cart is empty</p>';
            orderTotal.textContent = '$0.00';
            return;
        }

        // Build order summary HTML
        const summaryHTML = cart.map(item => `
            <div class="order-item">
                <span class="order-item-name">${item.name}</span>
                <span class="order-item-qty">×${item.quantity}</span>
                <span class="order-item-price">$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');

        orderSummary.innerHTML = summaryHTML;
        orderTotal.textContent = `$${window.getCartTotal().toFixed(2)}`;
    }

    // Initial load
    loadOrderSummary();

    // Handle form submission
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        const name = customerNameInput.value.trim();
        const phone = customerPhoneInput.value.trim();

        // Validate
        if (!name || !phone) {
            showError('Please enter both name and phone number');
            return;
        }

        // Get cart
        const cart = window.getCart ? window.getCart() : [];
        if (cart.length === 0) {
            showError('Your cart is empty');
            return;
        }

        // Prepare items for storage (as JSONB)
        // We'll store an array of objects with item details and quantity
        const items = cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));

        // Calculate total
        const total = window.getCartTotal();

        // Generate booking ID: BKR-DDMM-XXXX (using Canada date)
        function generateBookingId() {
            const { day, month } = getDatePartsCanada();
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            return `BKR-${day}${month}-${random}`;
        }
        const bookingId = generateBookingId();

        // Disable form during submission
        const submitButton = checkoutForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Placing Order...';

        try {
            // Insert order into Supabase using anon key (allowed by RLS policy)
            const { data, error } = await supabase
                .from('orders')
                .insert({
                    booking_id: bookingId,
                    name: name,
                    phone: phone,
                    items: items, // This will be stored as JSONB
                    total: total
                });

            if (error) throw error;

            // Clear cart
            window.saveCart ? window.saveCart([]) : sessionStorage.removeItem('bakeryCart');

            // Redirect to confirmation page with booking ID
            window.location.href = `confirmation.html?id=${bookingId}`;
        } catch (err) {
            console.error('Checkout error:', err);
            showError('Failed to place order. Please try again.');
        } finally {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = 'Place Order →';
        }
    });
});