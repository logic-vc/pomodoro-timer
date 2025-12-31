/**
 * Canvas Renderer Module
 * Handles drawing the circular timer with gradient animation
 */

// Constants
const TWO_PI = 2 * Math.PI;
const START_ANGLE = -Math.PI / 2; // Start from top

export class CanvasRenderer {
    /**
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {Object} options - Configuration options
     */
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Colors
        this.colors = {
            background: options.backgroundColor || '#0f3460',
            track: options.trackColor || 'rgba(255, 255, 255, 0.1)',
            gradientStart: options.gradientStart || '#ff6b6b',
            gradientMiddle: options.gradientMiddle || '#feca57',
            gradientEnd: options.gradientEnd || '#48dbfb',
            text: options.textColor || '#ffffff'
        };

        // Dimensions
        this.lineWidth = options.lineWidth || 12;
        this.padding = options.padding || 20;

        // State
        this.progress = 0; // 0 to 1 (how much has been used)
        this.setMinutes = 25;
        this.isDirty = true;
        this.animationFrameId = null;

        // Setup
        this._setupCanvas();
        this._handleResize = this._handleResize.bind(this);
        window.addEventListener('resize', this._handleResize);

        // Initial draw
        this.draw();
    }

    /**
     * Sets up canvas dimensions for high DPI displays
     * @private
     */
    _setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        // Store logical dimensions
        this.width = rect.width;
        this.height = rect.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.radius = Math.min(this.width, this.height) / 2 - this.padding;
    }

    /**
     * @private
     */
    _handleResize() {
        this._setupCanvas();
        this.isDirty = true;
        this.draw();
    }

    /**
     * Updates the progress value
     * @param {number} progress - Progress from 0 (start) to 1 (complete)
     */
    setProgress(progress) {
        this.progress = Math.max(0, Math.min(1, progress));
        this.isDirty = true;
    }

    /**
     * Updates the set minutes (for display during drag)
     * @param {number} minutes - Minutes value
     */
    setMinutesValue(minutes) {
        this.setMinutes = minutes;
        this.isDirty = true;
    }

    /**
     * Draws the timer
     */
    draw() {
        if (!this.isDirty) return;

        this.ctx.clearRect(0, 0, this.width, this.height);

        this._drawBackground();
        this._drawTrack();
        this._drawProgress();
        this._drawCenterCircle();

        this.isDirty = false;
    }

    /**
     * Starts animation loop
     */
    startAnimation() {
        const animate = () => {
            this.draw();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Stops animation loop
     */
    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * @private
     */
    _drawBackground() {
        // Outer glow effect
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.radius * 0.5,
            this.centerX, this.centerY, this.radius * 1.2
        );
        gradient.addColorStop(0, 'rgba(255, 107, 107, 0.1)');
        gradient.addColorStop(1, 'transparent');

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius * 1.2, 0, TWO_PI);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    /**
     * @private
     */
    _drawTrack() {
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, TWO_PI);
        this.ctx.strokeStyle = this.colors.track;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();
    }

    /**
     * @private
     */
    _drawProgress() {
        // Calculate remaining progress (1 - progress gives remaining time)
        const remainingProgress = 1 - this.progress;

        if (remainingProgress <= 0) return;

        // Create gradient
        const gradient = this._createGradient();

        // Draw arc from start to remaining progress
        const endAngle = START_ANGLE + (remainingProgress * TWO_PI);

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, START_ANGLE, endAngle);
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        // Draw dot at the end
        this._drawEndDot(endAngle);
    }

    /**
     * @private
     */
    _createGradient() {
        // Create a conic-like gradient by using linear gradients
        const x1 = this.centerX;
        const y1 = this.centerY - this.radius;
        const x2 = this.centerX;
        const y2 = this.centerY + this.radius;

        const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, this.colors.gradientStart);
        gradient.addColorStop(0.5, this.colors.gradientMiddle);
        gradient.addColorStop(1, this.colors.gradientEnd);

        return gradient;
    }

    /**
     * @private
     */
    _drawEndDot(angle) {
        const x = this.centerX + Math.cos(angle) * this.radius;
        const y = this.centerY + Math.sin(angle) * this.radius;

        // Outer glow
        const glowGradient = this.ctx.createRadialGradient(x, y, 0, x, y, this.lineWidth);
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        this.ctx.beginPath();
        this.ctx.arc(x, y, this.lineWidth, 0, TWO_PI);
        this.ctx.fillStyle = glowGradient;
        this.ctx.fill();

        // Inner dot
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.lineWidth / 2, 0, TWO_PI);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
    }

    /**
     * @private
     */
    _drawCenterCircle() {
        // Semi-transparent center
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.radius - this.lineWidth - 10
        );
        gradient.addColorStop(0, 'rgba(15, 52, 96, 0.9)');
        gradient.addColorStop(1, 'rgba(15, 52, 96, 0.3)');

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius - this.lineWidth - 10, 0, TWO_PI);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    /**
     * Triggers a redraw
     */
    invalidate() {
        this.isDirty = true;
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.stopAnimation();
        window.removeEventListener('resize', this._handleResize);
    }
}
