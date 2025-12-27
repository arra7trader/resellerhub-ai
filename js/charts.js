/* ============================================
   ResellerHub AI - Charts & Analytics
   ============================================ */

// ============================================
// ANIMATED COUNTER
// ============================================
class AnimatedCounter {
    constructor(element, options = {}) {
        this.element = element;
        this.start = options.start || 0;
        this.end = this.parseValue(element.textContent) || options.end || 0;
        this.duration = options.duration || 2000;
        this.format = options.format || this.detectFormat(element.textContent);
    }

    parseValue(text) {
        // Handle Indonesian format: Rp 18.5jt -> 18500000
        if (text.includes('jt')) {
            return parseFloat(text.replace(/[^\d.]/g, '')) * 1000000;
        }
        return parseFloat(text.replace(/[^\d.-]/g, '')) || 0;
    }

    detectFormat(text) {
        if (text.includes('Rp') && text.includes('jt')) return 'rupiah-jt';
        if (text.includes('Rp')) return 'rupiah';
        if (text.includes('%')) return 'percent';
        return 'number';
    }

    formatValue(value) {
        switch (this.format) {
            case 'rupiah-jt':
                return `Rp ${(value / 1000000).toFixed(1)}jt`;
            case 'rupiah':
                return `Rp ${value.toLocaleString('id-ID')}`;
            case 'percent':
                return `${Math.round(value)}%`;
            default:
                return Math.round(value).toLocaleString('id-ID');
        }
    }

    animate() {
        const startTime = performance.now();
        const range = this.end - this.start;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = this.start + (range * eased);

            this.element.textContent = this.formatValue(current);

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    }
}

// ============================================
// SIMPLE CHART (No external dependencies)
// ============================================
class SimpleLineChart {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;
        this.data = options.data || [];
        this.width = options.width || this.container.clientWidth;
        this.height = options.height || 200;
        this.color = options.color || '#6366f1';
        this.fillColor = options.fillColor || 'rgba(99, 102, 241, 0.2)';
        this.animated = options.animated !== false;
    }

    render() {
        if (!this.container || this.data.length === 0) return;

        const max = Math.max(...this.data);
        const min = Math.min(...this.data);
        const range = max - min || 1;
        const padding = 20;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', this.height);
        svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        svg.style.overflow = 'visible';

        const points = this.data.map((value, index) => {
            const x = padding + (index / (this.data.length - 1)) * (this.width - padding * 2);
            const y = this.height - padding - ((value - min) / range) * (this.height - padding * 2);
            return `${x},${y}`;
        }).join(' ');

        // Area fill
        const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const firstX = padding;
        const lastX = this.width - padding;
        areaPath.setAttribute('points', `${firstX},${this.height - padding} ${points} ${lastX},${this.height - padding}`);
        areaPath.setAttribute('fill', this.fillColor);
        if (this.animated) {
            areaPath.style.opacity = '0';
            areaPath.style.animation = 'fadeIn 1s ease forwards';
            areaPath.style.animationDelay = '0.5s';
        }
        svg.appendChild(areaPath);

        // Line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        line.setAttribute('points', points);
        line.setAttribute('fill', 'none');
        line.setAttribute('stroke', this.color);
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('stroke-linejoin', 'round');

        if (this.animated) {
            const length = line.getTotalLength ? line.getTotalLength() : 1000;
            line.style.strokeDasharray = length;
            line.style.strokeDashoffset = length;
            line.style.animation = 'drawLine 1.5s ease forwards';
        }

        svg.appendChild(line);

        // Dots
        this.data.forEach((value, index) => {
            const x = padding + (index / (this.data.length - 1)) * (this.width - padding * 2);
            const y = this.height - padding - ((value - min) / range) * (this.height - padding * 2);

            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', x);
            dot.setAttribute('cy', y);
            dot.setAttribute('r', '5');
            dot.setAttribute('fill', this.color);
            dot.setAttribute('stroke', '#fff');
            dot.setAttribute('stroke-width', '2');

            if (this.animated) {
                dot.style.opacity = '0';
                dot.style.animation = 'bounceIn 0.4s ease forwards';
                dot.style.animationDelay = `${0.1 * index + 0.5}s`;
            }

            svg.appendChild(dot);
        });

        // Add animation keyframes if not exists
        if (!document.querySelector('#chart-animations')) {
            const style = document.createElement('style');
            style.id = 'chart-animations';
            style.textContent = `
                @keyframes drawLine {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes fadeIn {
                    to { opacity: 1; }
                }
                @keyframes bounceIn {
                    0% { opacity: 0; transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        this.container.innerHTML = '';
        this.container.appendChild(svg);
    }
}

// ============================================
// BAR CHART
// ============================================
class SimpleBarChart {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;
        this.data = options.data || [];
        this.labels = options.labels || [];
        this.colors = options.colors || ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'];
        this.height = options.height || 200;
        this.animated = options.animated !== false;
    }

    render() {
        if (!this.container || this.data.length === 0) return;

        const max = Math.max(...this.data);
        const barWidth = 100 / this.data.length;

        let html = '<div class="bar-chart" style="display: flex; align-items: flex-end; height: ' + this.height + 'px; gap: 8px; padding: 0 10px;">';

        this.data.forEach((value, index) => {
            const height = (value / max) * 100;
            const color = this.colors[index % this.colors.length];
            const label = this.labels[index] || '';

            html += `
                <div class="bar-item" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${value}</span>
                    <div class="bar" style="
                        width: 100%;
                        height: ${this.animated ? '0' : height + '%'};
                        background: ${color};
                        border-radius: 4px 4px 0 0;
                        transition: height 1s ease;
                        ${this.animated ? 'animation: barGrow 1s ease forwards; animation-delay: ' + (index * 0.1) + 's;' : ''}
                        --target-height: ${height}%;
                    "></div>
                    <span style="font-size: 0.75rem; color: var(--text-secondary);">${label}</span>
                </div>
            `;
        });

        html += '</div>';

        // Add animation keyframes
        if (this.animated && !document.querySelector('#bar-animations')) {
            const style = document.createElement('style');
            style.id = 'bar-animations';
            style.textContent = `
                @keyframes barGrow {
                    to { height: var(--target-height); }
                }
            `;
            document.head.appendChild(style);
        }

        this.container.innerHTML = html;
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
class Toast {
    static container = null;

    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    static show(options = {}) {
        this.init();

        const { title, message, type = 'info', duration = 4000 } = typeof options === 'string'
            ? { message: options }
            : options;

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: '💡'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.classList.add('hiding'); setTimeout(() => this.parentElement.remove(), 400);">×</button>
        `;

        this.container.appendChild(toast);

        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('hiding');
                setTimeout(() => toast.remove(), 400);
            }, duration);
        }

        return toast;
    }

    static success(message, title) { return this.show({ message, title, type: 'success' }); }
    static error(message, title) { return this.show({ message, title, type: 'error' }); }
    static warning(message, title) { return this.show({ message, title, type: 'warning' }); }
    static info(message, title) { return this.show({ message, title, type: 'info' }); }
}

// ============================================
// NOTIFICATION DROPDOWN
// ============================================
class NotificationDropdown {
    constructor(buttonId, dropdownId) {
        this.button = document.getElementById(buttonId);
        this.dropdown = document.getElementById(dropdownId);
        this.init();
    }

    init() {
        if (!this.button || !this.dropdown) return;

        this.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', () => this.close());
    }

    toggle() {
        this.dropdown.classList.toggle('active');
    }

    close() {
        this.dropdown.classList.remove('active');
    }
}

// ============================================
// SKELETON LOADER
// ============================================
class Skeleton {
    static card(count = 1) {
        return Array(count).fill(`
            <div class="skeleton skeleton-card" style="height: 100px; margin-bottom: 1rem;"></div>
        `).join('');
    }

    static stat() {
        return `
            <div style="display: flex; gap: 1rem; align-items: center;">
                <div class="skeleton skeleton-avatar"></div>
                <div style="flex: 1;">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text-sm"></div>
                </div>
            </div>
        `;
    }

    static show(element, type = 'card') {
        if (typeof element === 'string') {
            element = document.querySelector(element);
        }
        element.innerHTML = this[type] ? this[type]() : this.card();
    }
}

// ============================================
// RIPPLE EFFECT
// ============================================
function addRipple(element) {
    element.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
}

// ============================================
// REAL-TIME DATA SIMULATION
// ============================================
class RealtimeStats {
    constructor(options = {}) {
        this.interval = options.interval || 30000;
        this.callbacks = [];
    }

    subscribe(callback) {
        this.callbacks.push(callback);
        return () => {
            this.callbacks = this.callbacks.filter(cb => cb !== callback);
        };
    }

    start() {
        this.timer = setInterval(() => {
            const data = this.generateData();
            this.callbacks.forEach(cb => cb(data));
        }, this.interval);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
    }

    generateData() {
        return {
            revenue: Math.floor(Math.random() * 5000000) + 15000000,
            orders: Math.floor(Math.random() * 50) + 350,
            margin: Math.floor(Math.random() * 10) + 28,
            alerts: Math.floor(Math.random() * 5) + 1
        };
    }
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Animate stat counters
    document.querySelectorAll('.stat-value').forEach(el => {
        const counter = new AnimatedCounter(el);
        counter.animate();
    });

    // Add ripple to buttons
    document.querySelectorAll('.btn-primary').forEach(addRipple);

    // Staggered card entrance
    const cards = document.querySelectorAll('.card, .stat-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, i * 100);
    });

    console.log('🚀 ResellerHub AI Charts & Components Initialized');
});

// Export for global use
window.AnimatedCounter = AnimatedCounter;
window.SimpleLineChart = SimpleLineChart;
window.SimpleBarChart = SimpleBarChart;
window.Toast = Toast;
window.Skeleton = Skeleton;
window.RealtimeStats = RealtimeStats;
