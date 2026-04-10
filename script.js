/**
 * Jespersen Erections - Website Scripts
 */

document.addEventListener('DOMContentLoaded', async () => {
    initNav();
    initContactForm();
    await initEditableContent();
    initScrollEffects();
});

const SERVICE_ICONS = {
    deck: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18M3 9v12M3 9h18v12M3 9V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"/>
        </svg>
    `,
    siding: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
        </svg>
    `,
    remodel: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <path d="M9 22V12h6v10"/>
        </svg>
    `
};

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

async function initEditableContent() {
    try {
        const response = await fetch('/api/content', { cache: 'no-store' });
        if (!response.ok) return;

        const content = await response.json();
        renderEditableSections(content);
    } catch (error) {
        // Ignore API failures so local static previews still work.
    }
}

function renderEditableSections(content) {
    renderServices(content.services);
    renderPortfolio(content.portfolio);
    renderAbout(content.about);
}

function renderServices(services) {
    if (!services) return;

    const eyebrow = document.getElementById('services-eyebrow');
    const heading = document.getElementById('services-heading');
    const description = document.getElementById('services-description');
    const grid = document.getElementById('services-grid');

    if (eyebrow) eyebrow.textContent = services.eyebrow || '';
    if (heading) heading.textContent = services.heading || '';
    if (description) description.textContent = services.description || '';
    if (!grid || !Array.isArray(services.items)) return;

    grid.innerHTML = services.items.map((item) => {
        const iconMarkup = SERVICE_ICONS[item.icon] || SERVICE_ICONS.deck;
        return `
            <article class="service-card">
                <div class="service-icon">${iconMarkup}</div>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description)}</p>
            </article>
        `;
    }).join('');
}

function renderPortfolio(portfolio) {
    if (!portfolio) return;

    const eyebrow = document.getElementById('portfolio-eyebrow');
    const heading = document.getElementById('portfolio-heading');
    const description = document.getElementById('portfolio-description');
    const grid = document.getElementById('portfolio-grid');

    if (eyebrow) eyebrow.textContent = portfolio.eyebrow || '';
    if (heading) heading.textContent = portfolio.heading || '';
    if (description) description.textContent = portfolio.description || '';
    if (!grid || !Array.isArray(portfolio.items)) return;

    grid.innerHTML = portfolio.items.map((item) => `
        <div class="portfolio-item">
            <div class="portfolio-image" style="background-image: url('${escapeAttribute(item.imageUrl)}'); background-size: cover; background-position: center;"></div>
            <div class="portfolio-overlay">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.subtitle)}</p>
            </div>
        </div>
    `).join('');
}

function renderAbout(about) {
    if (!about) return;

    const eyebrow = document.getElementById('about-eyebrow');
    const heading = document.getElementById('about-heading');
    const body = document.getElementById('about-body');
    const features = document.getElementById('about-features');
    const stats = document.getElementById('about-stats');

    if (eyebrow) eyebrow.textContent = about.eyebrow || '';
    if (heading) heading.textContent = about.heading || '';
    if (body) body.textContent = about.body || '';

    if (features && Array.isArray(about.features)) {
        features.innerHTML = about.features.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    }

    if (stats && Array.isArray(about.stats)) {
        stats.innerHTML = about.stats.map((item) => `
            <div class="stat">
                <span class="stat-number">${escapeHtml(item.value)}</span>
                <span class="stat-label">${escapeHtml(item.label)}</span>
            </div>
        `).join('');
    }
}

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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        const status = ensureContactStatusEl(form);
        status.textContent = 'Sending request...';
        status.style.color = '';

        const payload = {
            name: form.querySelector('#name')?.value?.trim() || '',
            email: form.querySelector('#email')?.value?.trim() || '',
            phone: form.querySelector('#phone')?.value?.trim() || '',
            message: form.querySelector('#message')?.value?.trim() || '',
        };

        btn.textContent = 'Sending...';
        btn.disabled = true;

        try {
            const response = await fetch('/api/request-service', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Unable to send request right now.');
            }

            btn.textContent = 'Request Sent!';
            status.textContent = 'Your request was sent. We will reach out soon.';
            status.style.color = '#047857';
            form.reset();
        } catch (error) {
            btn.textContent = originalText;
            status.textContent = error?.message || 'Unable to send request right now.';
            status.style.color = '#b91c1c';
        } finally {
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
        }
    });
}

function ensureContactStatusEl(form) {
    let status = form.querySelector('.contact-form-status');
    if (!status) {
        status = document.createElement('p');
        status.className = 'contact-form-status';
        status.setAttribute('aria-live', 'polite');
        status.style.marginTop = '0.75rem';
        status.style.fontWeight = '600';
        form.appendChild(status);
    }
    return status;
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
    document.querySelectorAll('.service-card, .portfolio-item, .about-content, .service-area-region, .contact-wrapper').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}
