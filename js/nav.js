// Navigation — Bakery by the Bay
// Dark espresso bar, scroll blur, GSAP mobile overlay

document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const navToggle = document.getElementById('navToggle');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const navLinksContainer = document.getElementById('navLinks');
    const mobileLinks = mobileOverlay?.querySelectorAll('.mobile-overlay__link');

    // --- Scroll effect: add backdrop blur on scroll ---
    if (header) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY > 80) {
                        header.classList.add('scrolled');
                    } else {
                        header.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // --- Mobile menu toggle (GSAP animation) ---
    if (navToggle && mobileOverlay && typeof gsap !== 'undefined') {
        let isOpen = false;
        let mobileTimeline = null;

        const openMobileMenu = () => {
            if (isOpen) return;
            isOpen = true;

            if (mobileTimeline) mobileTimeline.kill();

            mobileOverlay.style.display = 'flex';

            mobileTimeline = gsap.timeline({
                onReverseComplete: () => {
                    mobileOverlay.style.display = 'none';
                }
            });

            mobileTimeline
                .set(mobileOverlay, {
                    opacity: 0,
                    visibility: 'hidden',
                    pointerEvents: 'none'
                })
                .to(mobileOverlay, {
                    opacity: 1,
                    visibility: 'visible',
                    pointerEvents: 'all',
                    duration: 0.35,
                    ease: 'power2.out'
                })
                .fromTo(
                    mobileLinks,
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, ease: 'power2.out' },
                    '-=0.15'
                );

            navToggle.textContent = '✕';
        };

        const closeMobileMenu = () => {
            if (!isOpen) return;
            isOpen = false;

            if (mobileTimeline) {
                mobileTimeline.reverse();
            }

            navToggle.textContent = '☰';
        };

        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        // Close when clicking a link
        if (mobileLinks) {
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    closeMobileMenu();
                });
            });
        }

        // Close on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && isOpen) {
                closeMobileMenu();
            }
        });
    }

    // --- Fallback for when GSAP isn't loaded ---
    if (navToggle && mobileOverlay && typeof gsap === 'undefined') {
        let isOpen = false;

        navToggle.addEventListener('click', () => {
            isOpen = !isOpen;
            mobileOverlay.classList.toggle('open', isOpen);
            navToggle.textContent = isOpen ? '✕' : '☰';
        });

        if (mobileLinks) {
            mobileLinks.forEach(link => {
                link.addEventListener('click', () => {
                    isOpen = false;
                    mobileOverlay.classList.remove('open');
                    navToggle.textContent = '☰';
                });
            });
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && isOpen) {
                isOpen = false;
                mobileOverlay.classList.remove('open');
                navToggle.textContent = '☰';
            }
        });
    }
});
