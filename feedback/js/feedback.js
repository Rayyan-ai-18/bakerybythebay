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
    const ratingStars = document.querySelectorAll('.rating-stars .star');

    if (!feedbackForm) return;

    // Handle star rating clicks
    let selectedRating = 0;
    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            selectedRating = rating;
            // Update UI
            ratingStars.forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.style.color = '#ff6b6b'; // filled star color
                } else {
                    s.style.color = '#ccc'; // empty star color
                }
            });
            feedbackRatingValueInput.value = rating;
        });
    });

    // Handle form submission
    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Clear messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        const name = feedbackNameInput.value.trim();
        const phone = feedbackPhoneInput.value.trim();
        const message = feedbackMessageInput.value.trim();
        const rating = selectedRating > 0 ? selectedRating : null;

        // Validate
        if (!message) {
            errorMessage.textContent = 'Please enter a message';
            errorMessage.style.display = 'block';
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
            successMessage.textContent = 'Thank you for your feedback!';
            successMessage.style.display = 'block';

            // Reset form
            feedbackForm.reset();
            ratingStars.forEach(star => {
                star.style.color = '#ccc';
            });
            selectedRating = 0;
            feedbackRatingValueInput.value = '';
        } catch (err) {
            console.error('Feedback error:', err);
            errorMessage.textContent = 'Failed to send feedback. Please try again.';
            errorMessage.style.display = 'block';
        } finally {
            // Re-enable button
            submitButton.disabled = false;
            submitButton.textContent = 'Send Feedback';
        }
    });
});