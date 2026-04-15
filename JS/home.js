// Home Page - Check if user is already logged in + Smooth scroll + Sensor Animation
import { supabase } from './supabase-auth.js';

// ===== SENSOR NODE ANIMATION =====
class Sensor {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 5;
        this.state = Math.random() > 0.5 ? 'active' : 'idle';
        this.stateChangeDelay = Math.random() * 2000 + 2000;
        this.lastStateChange = Date.now();
    }

    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x - this.radius < 0 || this.x + this.radius > width) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > height) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
        }

        if (Date.now() - this.lastStateChange > this.stateChangeDelay) {
            this.state = this.state === 'active' ? 'idle' : 'active';
            this.lastStateChange = Date.now();
            this.stateChangeDelay = Math.random() * 2000 + 2000;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        if (this.state === 'active') {
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
            ctx.shadowBlur = 12;
        } else {
            ctx.fillStyle = '#3b82f6';
            ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
            ctx.shadowBlur = 12;
        }
        
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function initSensorAnimation() {
    const canvas = document.getElementById('sensorCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const hero = document.querySelector('.hero');
    
    function resizeCanvas() {
        canvas.width = hero.offsetWidth;
        canvas.height = hero.offsetHeight;
    }
    
    resizeCanvas();

    // Create sensor nodes with faster speeds
    const sensors = [];
    const sensorCount = 15;
    
    for (let i = 0; i < sensorCount; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const speed = Math.random() * 1.5 + 1.5; // Faster: 1.5-3 units/frame
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        sensors.push(new Sensor(x, y, vx, vy));
    }

    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        sensors.forEach(sensor => {
            sensor.update(canvas.width, canvas.height);
        });

        // Draw connection lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < sensors.length; i++) {
            for (let j = i + 1; j < sensors.length; j++) {
                const dx = sensors[i].x - sensors[j].x;
                const dy = sensors[i].y - sensors[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 180) {
                    ctx.beginPath();
                    ctx.moveTo(sensors[i].x, sensors[i].y);
                    ctx.lineTo(sensors[j].x, sensors[j].y);
                    ctx.globalAlpha = 1 - (distance / 180);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        }

        sensors.forEach(sensor => {
            sensor.draw(ctx);
        });

        requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('resize', () => {
        resizeCanvas();
    });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSensorAnimation);
} else {
    initSensorAnimation();
}

// ===== SMOOTH SCROLL =====
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function (e) {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});

// ===== PARALLAX + SCROLL REVEAL =====
const parallaxSections = Array.from(document.querySelectorAll('[data-parallax]'));
const revealItems = Array.from(document.querySelectorAll('.reveal'));
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateParallax() {
    const viewportH = window.innerHeight || 1;

    parallaxSections.forEach(section => {
        const media = section.querySelector('.home-parallax-media');
        if (!media) return;

        const speedAttr = parseFloat(media.getAttribute('data-speed') || '0.2');
        const rect = section.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > viewportH) {
            return;
        }

        const centerOffset = (rect.top + rect.height / 2) - (viewportH / 2);
        const translateY = centerOffset * speedAttr * -1;
        media.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
    });
}

if (revealItems.length > 0) {
    if (prefersReducedMotion) {
        revealItems.forEach(item => item.classList.add('visible'));
    } else {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px'
    });

    revealItems.forEach(item => revealObserver.observe(item));
    }
}

let parallaxTicking = false;
function onParallaxScroll() {
    if (prefersReducedMotion) return;
    if (parallaxTicking) return;
    parallaxTicking = true;
    window.requestAnimationFrame(() => {
        updateParallax();
        parallaxTicking = false;
    });
}

if (prefersReducedMotion) {
    parallaxSections.forEach(section => {
        const media = section.querySelector('.home-parallax-media');
        if (media) media.style.transform = 'translate3d(0, 0, 0)';
    });
} else {
    window.addEventListener('scroll', onParallaxScroll, { passive: true });
    window.addEventListener('resize', updateParallax);
    window.addEventListener('load', updateParallax);
    updateParallax();
}

// ===== HERO TILTED CARD =====
function initTiltedCards() {
    const cards = Array.from(document.querySelectorAll('[data-tilt-card]'));
    if (cards.length === 0) return;
    if (prefersReducedMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    cards.forEach(card => {
        const inner = card.querySelector('.tilted-card-inner');
        if (!inner) return;

        const amplitude = Number(card.getAttribute('data-tilt-amplitude') || 6);
        const hoverScale = Number(card.getAttribute('data-tilt-scale') || 1.02);

        let rafId = 0;
        let isHovering = false;

        let targetX = 0;
        let targetY = 0;
        let targetScale = 1;

        let currentX = 0;
        let currentY = 0;
        let currentScale = 1;

        function easeOutPower(value) {
            const sign = value < 0 ? -1 : 1;
            const abs = Math.min(1, Math.abs(value));
            return sign * Math.pow(abs, 0.85);
        }

        function updateTargets(clientX, clientY) {
            const rect = card.getBoundingClientRect();
            const halfW = rect.width / 2;
            const halfH = rect.height / 2;

            const offsetX = clientX - rect.left - halfW;
            const offsetY = clientY - rect.top - halfH;

            const normX = easeOutPower(offsetX / halfW);
            const normY = easeOutPower(offsetY / halfH);

            targetX = normY * -amplitude;
            targetY = normX * amplitude;
        }

        function animate() {
            const follow = isHovering ? 0.16 : 0.1;

            currentX += (targetX - currentX) * follow;
            currentY += (targetY - currentY) * follow;
            currentScale += (targetScale - currentScale) * follow;

            card.style.setProperty('--tilt-x', `${currentX.toFixed(3)}deg`);
            card.style.setProperty('--tilt-y', `${currentY.toFixed(3)}deg`);
            card.style.setProperty('--tilt-scale', `${currentScale.toFixed(4)}`);

            const settled =
                Math.abs(targetX - currentX) < 0.02 &&
                Math.abs(targetY - currentY) < 0.02 &&
                Math.abs(targetScale - currentScale) < 0.002;

            if (isHovering || !settled) {
                rafId = window.requestAnimationFrame(animate);
            } else {
                rafId = 0;
            }
        }

        function ensureAnimating() {
            if (rafId) return;
            rafId = window.requestAnimationFrame(animate);
        }

        card.addEventListener('mouseenter', (event) => {
            isHovering = true;
            card.classList.add('is-active');
            targetScale = hoverScale;
            updateTargets(event.clientX, event.clientY);
            ensureAnimating();
        });

        card.addEventListener('mousemove', (event) => {
            updateTargets(event.clientX, event.clientY);
            ensureAnimating();
        });

        card.addEventListener('mouseleave', () => {
            isHovering = false;
            card.classList.remove('is-active');
            targetX = 0;
            targetY = 0;
            targetScale = 1;
            ensureAnimating();
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTiltedCards);
} else {
    initTiltedCards();
}

// ===== SESSION CHECK & REDIRECT =====
(async function() {
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData?.session;

        if (session && session.user) {
            const { data: userData } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id);

            const userRole = (userData && userData.length > 0) ? userData[0].role : 'unknown';
            const isAdmin = (userRole || '').toLowerCase() === 'admin';
            
            const redirectUrl = isAdmin ? 'FrameAdminPanel.html' : 'FrameDashboard.html';
            window.location.href = redirectUrl;
        }
    } catch (err) {
        console.warn('Session check error:', err);
    }
})();
