document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // DOM References
    // ============================================
    const navbar = document.getElementById('navbar');
    const navMenu = document.getElementById('nav-menu');
    const hamburger = document.getElementById('hamburger');
    const themeToggle = document.getElementById('theme-toggle');
    const scrollProgress = document.getElementById('scroll-progress');
    const copyrightYear = document.getElementById('copyright-year');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    // ============================================
    // Dynamic Copyright Year
    // ============================================
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }

    // ============================================
    // Dark Mode Toggle
    // ============================================
    const getPreferredTheme = () => {
        const stored = localStorage.getItem('theme');
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    // Initialize theme
    setTheme(getPreferredTheme());

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    // ============================================
    // Mobile Navigation
    // ============================================
    hamburger.addEventListener('click', () => {
        const isActive = hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    // ============================================
    // Smooth Scrolling
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                const offset = 80;
                const top = target.offsetTop - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ============================================
    // Consolidated Scroll Handler
    // ============================================
    let lastScroll = 0;
    let ticking = false;

    const onScroll = () => {
        const scrollY = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // 1. Scroll progress bar
        if (scrollProgress) {
            const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
            scrollProgress.style.width = `${progress}%`;
        }

        // 2. Navbar visibility & style
        if (navbar) {
            // Add shadow when scrolled
            navbar.classList.toggle('scrolled', scrollY > 50);

            // Hide/show on scroll direction
            if (scrollY > lastScroll && scrollY > 400) {
                navbar.classList.add('hidden');
            } else {
                navbar.classList.remove('hidden');
            }
        }

        // 3. Active navigation link
        let currentSection = '';
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            if (scrollY >= top) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`);
        });

        // 4. Hero parallax (only when hero is visible)
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrollY < window.innerHeight) {
            const ratio = scrollY / window.innerHeight;
            heroContent.style.opacity = Math.max(0, 1 - ratio * 1.5);
            heroContent.style.transform = `translateY(${scrollY * 0.3}px)`;
        }

        lastScroll = scrollY;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    // ============================================
    // Intersection Observer — Reveal Animations
    // ============================================
    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.dataset.delay || '0', 10);
                    setTimeout(() => {
                        el.classList.add('active');
                    }, delay);
                    revealObserver.unobserve(el);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all reveal elements (skip hero — handled separately)
    document.querySelectorAll('.reveal:not(.hero .reveal)').forEach(el => {
        revealObserver.observe(el);
    });

    // ============================================
    // Hero Animation — Trigger Immediately
    // ============================================
    const heroReveals = document.querySelectorAll('.hero .reveal');
    heroReveals.forEach(el => {
        const delay = parseInt(el.dataset.delay || '0', 10);
        setTimeout(() => {
            el.classList.add('active');
        }, 200 + delay); // 200ms base delay after page load
    });

    // ============================================
    // Stat Counter Animation
    // ============================================
    const animateCounters = () => {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        counters.forEach(counter => {
            if (counter.dataset.animated) return;

            const target = parseInt(counter.dataset.target, 10);
            const duration = 2000;
            const startTime = performance.now();

            const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

            const tick = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutQuart(progress);
                counter.textContent = Math.round(eased * target);

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    counter.textContent = target;
                }
            };

            counter.dataset.animated = 'true';
            requestAnimationFrame(tick);
        });
    };

    const statsObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    statsObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.3 }
    );

    const statsSection = document.querySelector('.about-stats');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // ============================================
    // Project Card Tilt Effect
    // ============================================
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            card.style.transform = `
                perspective(800px)
                rotateX(${-y * 6}deg)
                rotateY(${x * 6}deg)
                translateY(-8px)
            `;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // ============================================
    // Initial scroll position check
    // ============================================
    onScroll();

    // ============================================
    // Console Easter Egg
    // ============================================
    console.log(
        '%c👋 Welcome to my portfolio!',
        'font-size: 18px; color: #6366f1; font-weight: bold;'
    );
    console.log(
        '%cBuilt with vanilla HTML, CSS & JS ✨',
        'font-size: 13px; color: #94a3b8;'
    );
});
