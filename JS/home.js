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
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

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
