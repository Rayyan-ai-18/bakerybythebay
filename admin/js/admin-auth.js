// Admin login — uses adminSupabase with no persistent session
import { adminSupabase } from './auth-guard.js';

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
            const { data, error } = await adminSupabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Pass session tokens via URL hash — cleared immediately on dashboard load
            const { access_token, refresh_token } = data.session;
            const hashParams = new URLSearchParams({ access_token, refresh_token });
            window.location.replace(`dashboard.html#${hashParams.toString()}`);
        } catch (err) {
            console.error('Login error:', err);
            errorMessage.textContent = 'Invalid email or password';
            errorMessage.style.display = 'block';
        }
    });
});