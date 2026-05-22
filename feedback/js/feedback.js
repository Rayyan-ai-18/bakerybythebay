// Import supabase client (anon key)
import { supabase } from '../../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.getElementById('feedbackForm');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const feedbackNameInput = document.getElementById('feedbackName');
    const feedbackPhoneInput = document.getElementById('feedbackPhone');
    const feedbackMessageInput = document.getElementById('feedbackMessage');
    const feedbackRatingValueInput = document.getElementById('feedbackRatingValue');
    const ratingStars = document.querySelectorAll('.star');

    if (!feedbackForm) return;

    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // Helper to show message
    function showMessage(element, text) {
        element.textContent = text;
        element.classList.add('show');
    }

    // Helper to hide messages
    function hideMessages() {
        errorMessage.classList.remove('show');
        successMessage.classList.remove('show');
    }

    // Handle star rating clicks
    let selectedRating = 0;
    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            selectedRating = rating;

            // Update UI using active class
            ratingStars.forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
            feedbackRatingValueInput.value = rating;
        });

        // Hover effects
        star.addEventListener('mouseenter', () => {
            const rating = parseInt(star.dataset.rating);
            ratingStars.forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });

        star.addEventListener('mouseleave', () => {
            ratingStars.forEach(s => {
                if (parseInt(s.dataset.rating) <= selectedRating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });

    // Handle form submission
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideMessages();

        const name = feedbackNameInput.value.trim();
        const phone = feedbackPhoneInput.value.trim();
        const message = feedbackMessageInput.value.trim();
        const rating = selectedRating > 0 ? selectedRating : null;

        // Validate
        if (!message) {
            showMessage(errorMessage, 'Please enter a message');
            return;
        }

        // Disable form during submission
        const submitButton = feedbackForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';

        try {
            // Insert feedback into Supabase using anon key (allowed by RLS policy)
            const { data, error } = await supabase
                .from('feedback')
                .insert({
                    name: name || null, // store null if empty
                    phone: phone || null,
                    message: message,
                    rating: rating
                });

            if (error) throw error;

            // Show success message
            showMessage(successMessage, 'Thank you for your feedback! 🎉');

            // Reset form
            feedbackForm.reset();
            ratingStars.forEach(star => {
                star.classList.remove('active');
            });
            selectedRating = 0;
            feedbackRatingValueInput.value = '';

            // Auto-hide success message after 4 seconds
            setTimeout(() => {
                successMessage.classList.remove('show');
            }, 4000);
        } catch (err) {
            console.error('Feedback error:', err);
            showMessage(errorMessage, 'Failed to send feedback. Please try again.');
        } finally {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = 'Send Feedback →';
        }
    });
});