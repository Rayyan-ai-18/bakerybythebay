// Import supabase client (anon key)
import { supabase } from '../../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const bookingIdElement = document.getElementById('bookingId');
    const copyButton = document.getElementById('copyButton');
    const orderItemsElement = document.getElementById('orderItems');
    const orderTotalElement = document.getElementById('orderTotal');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    if (!bookingIdElement || !copyButton || !orderItemsElement || !orderTotalElement) return;

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

    // Get booking ID from URL query parameter
    function getBookingIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    const bookingId = getBookingIdFromUrl();

    if (!bookingId) {
        showError('Invalid order: missing booking ID');
        return;
    }

    // Display booking ID
    bookingIdElement.textContent = bookingId;

    // Copy booking ID to clipboard
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(bookingId).then(() => {
            showSuccess('Booking ID copied to clipboard!');
            setTimeout(() => hideMessages(), 2000);
        }).catch(() => {
            showError('Failed to copy booking ID');
        });
    });

    // Fetch order details from Supabase
    async function loadOrder() {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('booking_id', bookingId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            if (!data) {
                showError('Order not found. Please check your booking ID.');
                return;
            }

            // Display order items
            const items = data.items; // This is the JSONB column
            if (Array.isArray(items) && items.length > 0) {
                orderItemsElement.innerHTML = items.map(item => `
                    <li>
                        <span>${item.name} (×${item.quantity})</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                `).join('');
            } else {
                orderItemsElement.innerHTML = '<li style="color:var(--color-muted-text);font-style:italic;">No items found</li>';
            }

            // Display total
            orderTotalElement.textContent = `$${parseFloat(data.total).toFixed(2)}`;

        } catch (err) {
            console.error('Error loading order:', err);
            showError('Failed to load order details');
        }
    }

    // Load order
    await loadOrder();
});