// Import supabase client
import { supabase } from '../../js/supabase-client.js';
import { getTodayCanada, formatDateCanada } from '../../js/canada-date.js';

document.addEventListener('DOMContentLoaded', async () => {
    const menuItemsGrid = document.getElementById('menuItemsGrid');
    const menuCategories = document.getElementById('menuCategories');
    const menuDate = document.getElementById('menuDate');

    if (!menuItemsGrid || !menuCategories || !menuDate) return;

    let allMenuItems = [];
    let currentCategory = 'all';

    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // Load menu from Supabase
    async function loadMenu() {
        if (menuItemsGrid) {
            menuItemsGrid.innerHTML = `
                <div class="loading" style="grid-column:1/-1;">
                    <div class="spinner"></div>
                    <p>Loading today's menu...</p>
                </div>
            `;
        }

        try {
            // Get today's published menu (Canada timezone)
            const today = getTodayCanada();

            const { data, error } = await supabase
                .from('menus')
                .select('*, menu_items(*)')
                .eq('date', today)
                .eq('published', true)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
                console.error('Error loading menu:', error);
                if (menuItemsGrid) menuItemsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">⚠️</div><h3>Failed to load menu</h3><p>Please try again later</p></div>';
                return;
            }

            if (!data || !data.menu_items || data.menu_items.length === 0) {
                if (menuItemsGrid) {
                    menuItemsGrid.innerHTML = `
                        <div class="empty-state" style="grid-column:1/-1;">
                            <div class="empty-state-icon">📋</div>
                            <h3>No menu available today</h3>
                            <p>Check back later for today's fresh offerings</p>
                        </div>
                    `;
                }
                if (menuDate) menuDate.textContent = '';
                if (menuCategories) menuCategories.innerHTML = '<button class="menu-category-btn active" data-category="all">All</button>';
                return;
            }

            // Set date
            if (menuDate) menuDate.textContent = formatDateCanada(data.date);

            // Store menu items
            allMenuItems = data.menu_items.filter(item => item.available); // Only show available items

            // Render categories
            renderCategories();

            // Render menu items
            renderMenuItems();
        } catch (err) {
            console.error('Error in loadMenu:', err);
            if (menuItemsGrid) menuItemsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">⚠️</div><h3>Failed to load menu</h3><p>Please try again later</p></div>';
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
            menuItemsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">🔍</div><h3>No items in this category</h3></div>';
            return;
        }

        // Build grid with new card design
        menuItemsGrid.innerHTML = filteredItems.map((item, idx) => `
            <div class="menu-item-card animate-fade-in-up" style="animation-delay:${idx * 0.05}s">
                <div class="item-category">${item.category}</div>
                <h3>${item.name}</h3>
                ${item.description ? `<p class="item-description">${item.description}</p>` : ''}
                <div class="item-footer">
                    <span class="item-price">$${parseFloat(item.price).toFixed(2)}</span>
                    <button class="add-to-cart" data-item-id="${item.item_id}" data-name="${item.name}" data-price="${item.price}">
                        + Add
                    </button>
                </div>
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