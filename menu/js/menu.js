// Import supabase client
import { supabase } from '../../js/supabase-client.js';
import { formatDateCanada } from '../../js/canada-date.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Constant Menu elements
    const constMenuItemsGrid = document.getElementById('constMenuItemsGrid');
    const constMenuCategories = document.getElementById('constMenuCategories');

    // Daily Lunch elements
    const lunchMenuItemsGrid = document.getElementById('lunchMenuItemsGrid');
    const lunchMenuCategories = document.getElementById('lunchMenuCategories');
    const lunchDate = document.getElementById('lunchDate');
    const lunchSection = document.getElementById('lunchSection');

    if (!constMenuItemsGrid || !constMenuCategories) return;

    let constMenuItems = [];
    let lunchMenuItems = [];
    let currentConstCategory = 'all';
    let currentLunchCategory = 'all';

    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // ===== Fetch Constant Menu =====
    async function loadConstantMenu() {
        if (constMenuItemsGrid) {
            constMenuItemsGrid.innerHTML = `
                <div class="loading" style="grid-column:1/-1;">
                    <div class="spinner"></div>
                    <p>Loading menu...</p>
                </div>
            `;
        }

        try {
            const { data, error } = await supabase
                .from('menus')
                .select('*, menu_items(*)')
                .eq('type', 'constant')
                .eq('published', true)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading constant menu:', error);
                if (constMenuItemsGrid) {
                    constMenuItemsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">\u26a0\ufe0f</div><h3>Failed to load menu</h3><p>Please try again later</p></div>';
                }
                return;
            }

            if (!data || !data.menu_items || data.menu_items.length === 0) {
                if (constMenuItemsGrid) {
                    constMenuItemsGrid.innerHTML = `
                        <div class="empty-state" style="grid-column:1/-1;">
                            <div class="empty-state-icon">\ud83d\udccb</div>
                            <h3>Our menu is coming soon</h3>
                            <p>Check back soon for our full offerings</p>
                        </div>
                    `;
                }
                if (constMenuCategories) {
                    constMenuCategories.innerHTML = '<button class="menu-category-btn active" data-category="all">All</button>';
                }
                return;
            }

            constMenuItems = data.menu_items.filter(item => item.available !== false);

            renderConstCategories();
            renderConstItems();
        } catch (err) {
            console.error('Error in loadConstantMenu:', err);
            if (constMenuItemsGrid) {
                constMenuItemsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">\u26a0\ufe0f</div><h3>Failed to load menu</h3><p>Please try again later</p></div>';
            }
        }
    }

    // ===== Fetch Latest Published Daily Lunch Menu =====
    async function loadDailyLunch() {
        try {
            const { data, error } = await supabase
                .from('menus')
                .select('*, menu_items(*)')
                .eq('type', 'daily_lunch')
                .eq('published', true)
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading daily lunch:', error);
                return;
            }

            if (!data || !data.menu_items || data.menu_items.length === 0) {
                // No lunch available - hide the lunch section
                if (lunchSection) lunchSection.style.display = 'none';
                return;
            }

            // Show the lunch section
            if (lunchSection) lunchSection.style.display = 'block';

            // Set the date
            if (lunchDate && data.date) {
                lunchDate.textContent = formatDateCanada(data.date);
            }

            lunchMenuItems = data.menu_items.filter(item => item.available !== false);

            renderLunchCategories();
            renderLunchItems();
        } catch (err) {
            console.error('Error in loadDailyLunch:', err);
            if (lunchSection) lunchSection.style.display = 'none';
        }
    }

    // ===== Render Constant Menu Categories =====
    function renderConstCategories() {
        if (!constMenuCategories || constMenuItems.length === 0) return;

        const categories = [...new Set(constMenuItems.map(item => item.category))];
        categories.sort();

        let html = '<button class="menu-category-btn active" data-category="all">All</button>';
        categories.forEach(category => {
            html += `<button class="menu-category-btn" data-category="${category}">${category}</button>`;
        });

        constMenuCategories.innerHTML = html;

        constMenuCategories.querySelectorAll('.menu-category-btn').forEach(button => {
            button.addEventListener('click', () => {
                constMenuCategories.querySelectorAll('.menu-category-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentConstCategory = button.dataset.category;
                renderConstItems();
            });
        });
    }

    // ===== Render Daily Lunch Categories =====
    function renderLunchCategories() {
        if (!lunchMenuCategories || lunchMenuItems.length === 0) return;

        const categories = [...new Set(lunchMenuItems.map(item => item.category))];
        categories.sort();

        let html = '<button class="menu-category-btn active" data-category="all">All</button>';
        categories.forEach(category => {
            html += `<button class="menu-category-btn" data-category="${category}">${category}</button>`;
        });

        lunchMenuCategories.innerHTML = html;

        lunchMenuCategories.querySelectorAll('.menu-category-btn').forEach(button => {
            button.addEventListener('click', () => {
                lunchMenuCategories.querySelectorAll('.menu-category-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentLunchCategory = button.dataset.category;
                renderLunchItems();
            });
        });
    }

    // ===== Render Constant Menu Items =====
    function renderConstItems() {
        if (!constMenuItemsGrid) return;

        let filtered = constMenuItems;
        if (currentConstCategory !== 'all') {
            filtered = constMenuItems.filter(item => item.category === currentConstCategory);
        }

        if (filtered.length === 0) {
            constMenuItemsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">\ud83d\udd0d</div><h3>No items in this category</h3></div>';
            return;
        }

        constMenuItemsGrid.innerHTML = filtered.map((item, idx) => `
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

        constMenuItemsGrid.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.itemId;
                const name = button.dataset.name;
                const price = parseFloat(button.dataset.price);
                window.addToCart(itemId, name, price);
            });
        });
    }

    // ===== Render Daily Lunch Items =====
    function renderLunchItems() {
        if (!lunchMenuItemsGrid) return;

        let filtered = lunchMenuItems;
        if (currentLunchCategory !== 'all') {
            filtered = lunchMenuItems.filter(item => item.category === currentLunchCategory);
        }

        if (filtered.length === 0) {
            lunchMenuItemsGrid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state-icon">\ud83d\udd0d</div><h3>No items in this category</h3></div>';
            return;
        }

        lunchMenuItemsGrid.innerHTML = filtered.map((item, idx) => `
            <div class="menu-item-card menu-item-card--lunch animate-fade-in-up" style="animation-delay:${idx * 0.05}s">
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

        lunchMenuItemsGrid.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', () => {
                const itemId = button.dataset.itemId;
                const name = button.dataset.name;
                const price = parseFloat(button.dataset.price);
                window.addToCart(itemId, name, price);
            });
        });
    }

    // ===== Realtime subscriptions =====
    const menuChannel = supabase
        .channel('menu-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'menus' },
            () => {
                loadConstantMenu();
                loadDailyLunch();
            }
        )
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'menu_items' },
            () => {
                loadConstantMenu();
                loadDailyLunch();
            }
        )
        .subscribe();

    // ===== Initial loads =====
    await Promise.all([loadConstantMenu(), loadDailyLunch()]);

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
        supabase.removeChannel(menuChannel);
    });
});