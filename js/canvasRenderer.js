/**
 * Canvas Renderer Module
 * Handles drawing the circular timer with gradient animation
 * Clock hand style - arc only shows for set minutes
 */

// Constants
const TWO_PI = 2 * Math.PI;
const START_ANGLE = -Math.PI / 2; // Start from top (12 o'clock)
const MAX_MINUTES = 60;

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

        // State - clock hand style
        this.totalMinutes = 25;      // Total minutes set
        this.remainingMinutes = 25;  // Remaining minutes (can be fractional)
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
     * Sets the total minutes (initial set time)
     * @param {number} minutes - Total minutes set
     */
    setTotalMinutes(minutes) {
        this.totalMinutes = Math.max(1, Math.min(MAX_MINUTES, minutes));
        this.remainingMinutes = this.totalMinutes;
        this.isDirty = true;
    }

    /**
     * Sets the remaining time in seconds
     * @param {number} seconds - Remaining seconds
     */
    setRemainingSeconds(seconds) {
        this.remainingMinutes = seconds / 60;
        this.isDirty = true;
    }

    /**
     * Converts minutes to angle (radians)
     * @param {number} minutes - Minutes (0-60)
     * @returns {number} Angle in radians
     * @private
     */
    _minutesToAngle(minutes) {
        // 60 minutes = full circle (2*PI)
        return (minutes / MAX_MINUTES) * TWO_PI;
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
     * Draw progress arc - clock hand style
     * Arc only appears for the remaining time amount
     * @private
     */
    _drawProgress() {
        if (this.remainingMinutes <= 0) return;

        // Calculate arc angle based on remaining minutes (not percentage)
        const arcAngle = this._minutesToAngle(this.remainingMinutes);
        const endAngle = START_ANGLE + arcAngle;

        // Create gradient
        const gradient = this._createGradient();

        // Draw arc from 12 o'clock position clockwise
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
