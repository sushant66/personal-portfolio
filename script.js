// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
    
    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 70;
                const elementPosition = target.offsetTop;
                const offsetPosition = elementPosition - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Navbar Background on Scroll
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'saturate(180%) blur(30px)';
            navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.9)';
            navbar.style.backdropFilter = 'saturate(180%) blur(20px)';
            navbar.style.boxShadow = 'none';
        }
        
        // Hide/Show navbar on scroll
        if (currentScroll > lastScroll && currentScroll > 500) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll <= 0 ? 0 : currentScroll;
    });
    
    // Advanced Intersection Observer for Smooth Animations
    const observerOptions = {
        threshold: 0,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const animationObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add show class with slight delay for smoother effect
                requestAnimationFrame(() => {
                    entry.target.classList.add('show');
                });
            }
        });
    }, observerOptions);
    
    // Stagger animation observer
    const staggerObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const parent = entry.target;
                const items = parent.querySelectorAll('.stagger-item');
                
                items.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('show');
                    }, index * 80);
                });
                
                staggerObserver.unobserve(parent);
            }
        });
    }, { threshold: 0.1 });
    
    // Parallax Observer for scroll-based transforms
    const parallaxObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.3;
                entry.target.style.transform = `translateY(${rate}px)`;
            }
        });
    });
    
    // Observe all elements with fade-in classes
    const fadeElements = document.querySelectorAll('.fade-in, .fade-in-delay, .fade-in-delay-2, .fade-in-delay-3');
    fadeElements.forEach(element => {
        animationObserver.observe(element);
    });
    
    // Add parallax to specific elements
    const parallaxElements = document.querySelectorAll('.parallax-element');
    parallaxElements.forEach(element => {
        parallaxObserver.observe(element);
    });
    
    // Observe containers with stagger items
    const staggerContainers = document.querySelectorAll('.projects-grid, .about-stats, .skill-icons-grid');
    staggerContainers.forEach(container => {
        staggerObserver.observe(container);
    });
    
    // Trigger hero animations on load
    setTimeout(() => {
        document.querySelectorAll('.hero .fade-in, .hero .fade-in-delay, .hero .fade-in-delay-2, .hero .fade-in-delay-3').forEach(element => {
            element.classList.add('show');
        });
    }, 100);
    
    // Enhanced Parallax and Scale Effects
    let ticking = false;
    function updateParallax() {
        const scrolled = window.pageYOffset;
        
        // Hero parallax
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrolled < window.innerHeight) {
            const parallaxSpeed = 0.5;
            const opacity = Math.max(0, 1 - (scrolled / window.innerHeight) * 1.5);
            const scale = Math.max(0.8, 1 - (scrolled / window.innerHeight) * 0.3);
            
            heroContent.style.transform = `translateY(${scrolled * parallaxSpeed}px) scale(${scale})`;
            heroContent.style.opacity = opacity;
        }
        
        // Section animations based on scroll
        document.querySelectorAll('.scale-on-scroll').forEach(element => {
            const rect = element.getBoundingClientRect();
            const elementTop = rect.top;
            const elementBottom = rect.bottom;
            const windowHeight = window.innerHeight;
            
            if (elementTop < windowHeight && elementBottom > 0) {
                const distance = windowHeight - elementTop;
                const percentage = distance / (windowHeight + rect.height);
                const scale = 0.9 + (percentage * 0.1);
                const translateY = (1 - percentage) * 20;
                
                element.style.transform = `translateY(${translateY}px) scale(${scale})`;
                element.style.opacity = Math.min(1, percentage * 1.5);
            }
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    
    // Active Navigation Link Highlighting
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavigation() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLink?.classList.add('active');
            } else {
                navLink?.classList.remove('active');
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    
    // Project Card Tilt Effect
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
    
    // Typing Effect for Hero Title (Optional Enhancement)
    const nameElement = document.querySelector('.name');
    if (nameElement) {
        const text = nameElement.textContent;
        nameElement.textContent = '';
        nameElement.style.opacity = '1';
        let index = 0;
        
        function typeWriter() {
            if (index < text.length) {
                nameElement.textContent += text.charAt(index);
                index++;
                setTimeout(typeWriter, 80);
            }
        }
        
        // Start typing after a short delay
        setTimeout(typeWriter, 500);
    }
    
    // Smooth Hover Effects for Buttons
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function(e) {
            const x = e.pageX - button.offsetLeft;
            const y = e.pageY - button.offsetTop;
            
            const ripple = document.createElement('span');
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add ripple effect styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: translate(-50%, -50%);
            pointer-events: none;
            animation: ripple-animation 0.6s ease-out;
        }
        
        @keyframes ripple-animation {
            from {
                width: 0;
                height: 0;
                opacity: 1;
            }
            to {
                width: 200px;
                height: 200px;
                opacity: 0;
            }
        }
        
        .nav-link.active {
            color: var(--text-accent) !important;
        }
        
        .nav-link.active::after {
            width: 100%;
        }
    `;
    document.head.appendChild(style);
    
    // Lazy Loading for Project Images (Performance Optimization)
    const projectImages = document.querySelectorAll('.project-image');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add loading animation or actual image loading logic here
                entry.target.style.opacity = '1';
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    projectImages.forEach(img => {
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s ease';
        imageObserver.observe(img);
    });
    
    // Smooth Scroll Progress Indicator (Optional)
    const createScrollProgress = () => {
        const progressBar = document.createElement('div');
        progressBar.id = 'scroll-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
            z-index: 10000;
            transition: width 0.2s ease;
        `;
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', () => {
            const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (window.scrollY / windowHeight) * 100;
            progressBar.style.width = `${scrolled}%`;
        });
    };
    
    createScrollProgress();
    
    // Contact Form Validation (if you add a form later)
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };
    
    // Performance: Debounce scroll events
    let scrollTimeout;
    const debounceScroll = (callback, delay = 10) => {
        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(callback, delay);
        });
    };
    
    // Initialize AOS-like animations for timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = index % 2 === 0 ? 'translateX(-50px)' : 'translateX(50px)';
        
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.transition = 'all 0.8s ease';
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateX(0)';
                    }, index * 100);
                }
            });
        }, {
            threshold: 0.3
        });
        
        timelineObserver.observe(item);
    });
    
    // Preloader (Optional - for production)
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
    });
    
    // Console Easter Egg
    console.log('%c Welcome to my portfolio! 🚀', 'font-size: 20px; color: #2997ff; font-weight: bold;');
    console.log('%c Feel free to explore the code! 💻', 'font-size: 14px; color: #86868b;');
});
