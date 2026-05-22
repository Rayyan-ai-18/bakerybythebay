// Import supabase client (we'll need to adjust path for admin folder)
import { supabase } from '../../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        errorMessage.style.display = 'none';

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Redirect to dashboard on successful login
            window.location.href = 'dashboard.html';
        } catch (err) {
            console.error('Login error:', err);
            errorMessage.textContent = 'Invalid email or password';
            errorMessage.style.display = 'block';
        }
    });
});