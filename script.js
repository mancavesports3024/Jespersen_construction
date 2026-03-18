/**
 * Jespersen Erections - Website Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initContactForm();
    initScrollEffects();
});

/**
 * Mobile navigation toggle
 */
function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        toggle.setAttribute('aria-expanded', navLinks.classList.contains('active'));
    });

    // Close menu when clicking a link (for anchor links)
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
}

/**
 * Contact form handling
 */
function initContactForm() {
    const form = document.querySelector('.contact-form');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // In production, you would send this to a server/API
        // For now, show a success message
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Message Sent!';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            form.reset();
        }, 3000);
    });
}

/**
 * Scroll effects - header background, fade-in animations
 */
function initScrollEffects() {
    const header = document.querySelector('.header');

    if (header) {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(15, 20, 25, 0.98)';
            } else {
                header.style.background = 'rgba(15, 20, 25, 0.95)';
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Optional: Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Add fade-in to sections
    document.querySelectorAll('.service-card, .portfolio-item, .about-content, .contact-wrapper').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}
