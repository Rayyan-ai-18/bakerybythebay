// GSAP Animations — Bakery by the Bay
// Mobile-first: hero animation desktop-only, reduced-motion aware

(function() {
    'use strict';

    // Wait for GSAP to be ready
    function initAnimations() {
        if (typeof gsap === 'undefined') {
            setTimeout(initAnimations, 100);
            return;
        }

        // Register ScrollTrigger
        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isDesktop = window.innerWidth >= 1024;

        if (prefersReducedMotion) {
            // Make all reveal elements visible immediately
            document.querySelectorAll('.reveal').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
            return;
        }

        // --- 1. HERO ANIMATION (desktop only) ---
        if (isDesktop) {
            const heroTitle = document.getElementById('heroTitle');
            const heroEyebrow = document.getElementById('heroEyebrow');
            const heroSub = document.getElementById('heroSub');
            const heroCta = document.getElementById('heroCta');
            const heroImage = document.getElementById('heroImage');

            if (heroTitle) {
                const titleLines = heroTitle.innerHTML.split('<br>');
                const heroTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

                if (heroImage) {
                    heroTl.fromTo(heroImage,
                        { scale: 1.05 },
                        { scale: 1.0, duration: 1.2, ease: 'power1.out' },
                        0
                    );
                }

                if (heroEyebrow) {
                    heroTl.fromTo(heroEyebrow,
                        { y: 20, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.6 },
                        0.3
                    );
                }

                if (titleLines.length > 0) {
                    // Prevent flash: hide title during innerHTML swap, then animate in
                    gsap.set(heroTitle, { opacity: 0 });

                    heroTitle.innerHTML = titleLines.map(line =>
                        `<span style="display:block;overflow:hidden;"><span class="hero-title-line" style="display:block;">${line}</span></span>`
                    ).join('');

                    gsap.set(heroTitle, { opacity: 1 });

                    const lineEls = heroTitle.querySelectorAll('.hero-title-line');
                    heroTl.fromTo(lineEls,
                        { y: '100%' },
                        { y: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out' },
                        0.5
                    );
                }

                if (heroSub) {
                    heroTl.fromTo(heroSub,
                        { y: 15, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.5 },
                        0.8
                    );
                }

                if (heroCta) {
                    heroTl.fromTo(heroCta,
                        { y: 20, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' },
                        0.95
                    );
                }
            }
        }

        // --- 2. SCROLL REVEALS (desktop only for performance) ---
        if (isDesktop) {
            const revealElements = document.querySelectorAll('.reveal');

            if (revealElements.length > 0) {
                // Single IntersectionObserver for all reveals — performant and visually correct
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            gsap.to(entry.target, {
                                y: 0,
                                opacity: 1,
                                duration: 0.6,
                                ease: 'power2.out'
                            });
                            observer.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.12 });

                revealElements.forEach(el => observer.observe(el));
            }
        } else {
            // On mobile, just make reveal elements visible immediately
            document.querySelectorAll('.reveal').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
        }

        // --- 3. CART DRAWER ANIMATION (all devices) ---
        const cartDrawer = document.getElementById('cartDrawer');
        const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');

        if (cartDrawer && cartDrawerOverlay) {
            const drawerObserver = new MutationObserver(() => {
                if (cartDrawer.classList.contains('open')) {
                    gsap.to(cartDrawer, {
                        y: 0,
                        x: 0,
                        duration: 0.45,
                        ease: 'power3.out',
                        overwrite: 'auto'
                    });
                    gsap.to(cartDrawerOverlay, {
                        opacity: 1,
                        visibility: 'visible',
                        duration: 0.3,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                } else {
                    // Determine transform based on screen size
                    const isMobile = window.innerWidth < 1024;
                    const closeTransform = isMobile ? { y: '100%' } : { x: '100%' };

                    gsap.to(cartDrawer, {
                        ...closeTransform,
                        duration: 0.3,
                        ease: 'power2.in',
                        overwrite: 'auto'
                    });
                    gsap.to(cartDrawerOverlay, {
                        opacity: 0,
                        visibility: 'hidden',
                        duration: 0.25,
                        ease: 'power2.in',
                        overwrite: 'auto',
                        onComplete: () => {
                            gsap.set(cartDrawer, { clearProps: 'all' });
                        }
                    });
                }
            });

            drawerObserver.observe(cartDrawer, { attributes: true, attributeFilter: ['class'] });
        }

        // --- 4. MENU CARD ENTRANCE ---
        window.animateMenuCards = function(container) {
            if (!container) return;
            const cards = container.querySelectorAll('.menu-item-card');
            if (cards.length === 0) return;

            gsap.fromTo(cards,
                { y: 20, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.05,
                    ease: 'power2.out',
                    overwrite: 'auto'
                }
            );
        };

        console.log('🥐 GSAP animations initialized');
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnimations);
    } else {
        initAnimations();
    }
})();
