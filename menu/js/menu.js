// Import supabase client
import { supabase } from '../../js/supabase-client.js';

document.addEventListener('DOMContentLoaded', async () => {
    const menuItemsGrid = document.getElementById('menuItemsGrid');
    const menuCategories = document.getElementById('menuCategories');
    const menuDate = document.getElementById('menuDate');

    if (!menuItemsGrid || !menuCategories || !menuDate) return;

    let allMenuItems = [];
    let currentCategory = 'all';

    // Format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Load menu from Supabase
    async function loadMenu() {
        if (menuItemsGrid) menuItemsGrid.innerHTML = '<div class="loading">Loading menu...</div>';

        try {
            // Get today's published menu
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            const { data, error } = await supabase
                .from('menus')
                .select('*, menu_items(*)')
                .eq('date', today)
                .eq('published', true)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
                console.error('Error loading menu:', error);
                if (menuItemsGrid) menuItemsGrid.innerHTML = '<div class="error">Failed to load menu</div>';
                return;
            }

            if (!data || !data.menu_items || data.menu_items.length === 0) {
                if (menuItemsGrid) menuItemsGrid.innerHTML = '<div class="no-menu">No menu available today</div>';
                if (menuDate) menuDate.textContent = '';
                if (menuCategories) menuCategories.innerHTML = '<button class="menu-category-btn active" data-category="all">All</button>';
                return;
            }

            // Set date
            if (menuDate) menuDate.textContent = formatDate(data.date);

            // Store menu items
            allMenuItems = data.menu_items.filter(item => item.available); // Only show available items

            // Render categories
            renderCategories();

            // Render menu items
            renderMenuItems();
        } catch (err) {
            console.error('Error in loadMenu:', err);
            if (menuItemsGrid) menuItemsGrid.innerHTML = '<div class="error">Failed to load menu</div>';
        }
    }

    // Render category buttons
    function renderCategories() {
        if (!menuCategories) return;

        // Get unique categories
        const categories = [...new Set(allMenuItems.map(item => item.category))];
        categories.sort(); // Sort alphabetically

        // Build HTML
        let html = '<button class="menu-category-btn active" data-category="all">All</button>';
        categories.forEach(category => {
            html += `<button class="menu-category-btn" data-category="${category}">${category}</button>`;
        });

        menuCategories.innerHTML = html;

        // Add event listeners to category buttons
        menuCategories.querySelectorAll('.menu-category-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Update active button
                menuCategories.querySelectorAll('.menu-category-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');

                // Set current category and render
                currentCategory = button.dataset.category;
                renderMenuItems();
            });
        });
    }

    // Render menu items based on current category filter
    function renderMenuItems() {
        if (!menuItemsGrid) return;

        // Filter items by category
        let filteredItems = allMenuItems;
        if (currentCategory !== 'all') {
            filteredItems = allMenuItems.filter(item => item.category === currentCategory);
        }

        if (filteredItems.length === 0) {
            menuItemsGrid.innerHTML = '<div class="no-items">No items in this category</div>';
            return;
        }

        // Build grid
        menuItemsGrid.innerHTML = filteredItems.map(item => `
            <div class="menu-item-card">
                <h3>${item.name}</h3>
                <div class="price">$${parseFloat(item.price).toFixed(2)}</div>
                <div class="category">${item.category}</div>
                ${item.description ? `<p class="description">${item.description}</p>` : ''}
                <button class="add-to-cart" data-item-id="${item.item_id}" data-name="${item.name}" data-price="${item.price}">
                    Add to Cart
                </button>
            </div>
        `).join('');

        // Add event listeners to add to cart buttons
        menuItemsGrid.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.itemId;
                const name = button.dataset.name;
                const price = parseFloat(button.dataset.price);

                // Add to cart via cart.js
                window.addToCart(itemId, name, price);
            });
        });
    }

    // Realtime subscription for menu changes
    const menuChannel = supabase
        .channel('menu-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'menus' },
            () => {
                // Refetch menu when menus table changes
                loadMenu();
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'menu_items' },
            () => {
                // Refetch menu when menu_items table changes
                loadMenu();
            }
        )
        .subscribe();

    // Initial load
    await loadMenu();

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
        supabase.removeChannel(menuChannel);
    });
});