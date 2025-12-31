/**
 * Drag Controller Module
 * Handles mouse and touch drag interactions for setting timer duration
 */

// Constants
const MIN_MINUTES = 1;
const MAX_MINUTES = 60;
const FULL_CIRCLE = 2 * Math.PI;

export class DragController {
    /**
     * @param {HTMLElement} element - The element to attach drag events to
     * @param {Object} options - Configuration options
     */
    constructor(element, options = {}) {
        this.element = element;
        this.isDragging = false;
        this.isEnabled = true;

        // Callbacks
        this.onDragStart = options.onDragStart || null;
        this.onDrag = options.onDrag || null;
        this.onDragEnd = options.onDragEnd || null;

        // Bind methods
        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchMove = this._handleTouchMove.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);

        this._attachEventListeners();
    }

    /**
     * Enables drag interaction
     */
    enable() {
        this.isEnabled = true;
    }

    /**
     * Disables drag interaction
     */
    disable() {
        this.isEnabled = false;
        if (this.isDragging) {
            this._endDrag();
        }
    }

    /**
     * Converts angle (radians) to minutes
     * @param {number} angle - Angle in radians (0 to 2*PI)
     * @returns {number} Minutes (1 to 60)
     */
    static angleToMinutes(angle) {
        // Normalize angle to 0-2PI range
        let normalizedAngle = angle;
        if (normalizedAngle < 0) {
            normalizedAngle += FULL_CIRCLE;
        }
        normalizedAngle = normalizedAngle % FULL_CIRCLE;

        // Convert to minutes (0 to 2PI maps to 1 to 60)
        const minutes = Math.round((normalizedAngle / FULL_CIRCLE) * (MAX_MINUTES - MIN_MINUTES)) + MIN_MINUTES;
        return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, minutes));
    }

    /**
     * Converts minutes to angle (radians)
     * @param {number} minutes - Minutes (1 to 60)
     * @returns {number} Angle in radians
     */
    static minutesToAngle(minutes) {
        return ((minutes - MIN_MINUTES) / (MAX_MINUTES - MIN_MINUTES)) * FULL_CIRCLE;
    }

    /**
     * @private
     */
    _attachEventListeners() {
        // Mouse events
        this.element.addEventListener('mousedown', this._handleMouseDown);
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);

        // Touch events
        this.element.addEventListener('touchstart', this._handleTouchStart, { passive: false });
        document.addEventListener('touchmove', this._handleTouchMove, { passive: false });
        document.addEventListener('touchend', this._handleTouchEnd);
    }

    /**
     * @private
     */
    _removeEventListeners() {
        this.element.removeEventListener('mousedown', this._handleMouseDown);
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);

        this.element.removeEventListener('touchstart', this._handleTouchStart);
        document.removeEventListener('touchmove', this._handleTouchMove);
        document.removeEventListener('touchend', this._handleTouchEnd);
    }

    /**
     * @private
     */
    _handleMouseDown(event) {
        if (!this.isEnabled) return;

        event.preventDefault();
        this._startDrag(event.clientX, event.clientY);
    }

    /**
     * @private
     */
    _handleMouseMove(event) {
        if (!this.isDragging) return;

        this._updateDrag(event.clientX, event.clientY);
    }

    /**
     * @private
     */
    _handleMouseUp() {
        if (!this.isDragging) return;

        this._endDrag();
    }

    /**
     * @private
     */
    _handleTouchStart(event) {
        if (!this.isEnabled) return;

        event.preventDefault();
        const touch = event.touches[0];
        this._startDrag(touch.clientX, touch.clientY);
    }

    /**
     * @private
     */
    _handleTouchMove(event) {
        if (!this.isDragging) return;

        event.preventDefault();
        const touch = event.touches[0];
        this._updateDrag(touch.clientX, touch.clientY);
    }

    /**
     * @private
     */
    _handleTouchEnd() {
        if (!this.isDragging) return;

        this._endDrag();
    }

    /**
     * @private
     */
    _startDrag(clientX, clientY) {
        this.isDragging = true;
        this.element.classList.add('dragging');

        const angle = this._calculateAngle(clientX, clientY);
        const minutes = DragController.angleToMinutes(angle);

        if (this.onDragStart) {
            this.onDragStart({ angle, minutes });
        }

        // Also trigger onDrag for immediate feedback
        if (this.onDrag) {
            this.onDrag({ angle, minutes });
        }
    }

    /**
     * @private
     */
    _updateDrag(clientX, clientY) {
        const angle = this._calculateAngle(clientX, clientY);
        const minutes = DragController.angleToMinutes(angle);

        if (this.onDrag) {
            this.onDrag({ angle, minutes });
        }
    }

    /**
     * @private
     */
    _endDrag() {
        this.isDragging = false;
        this.element.classList.remove('dragging');

        if (this.onDragEnd) {
            this.onDragEnd();
        }
    }

    /**
     * Calculates angle from center of element to cursor position
     * @param {number} clientX - Cursor X position
     * @param {number} clientY - Cursor Y position
     * @returns {number} Angle in radians
     * @private
     */
    _calculateAngle(clientX, clientY) {
        const rect = this.element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        // Calculate angle (atan2 returns -PI to PI)
        // Adjust so 0 is at the top and increases clockwise
        let angle = Math.atan2(deltaY, deltaX) + Math.PI / 2;

        // Normalize to 0-2PI
        if (angle < 0) {
            angle += FULL_CIRCLE;
        }

        return angle;
    }

    /**
     * Cleanup method
     */
    destroy() {
        this._removeEventListeners();
        this.onDragStart = null;
        this.onDrag = null;
        this.onDragEnd = null;
    }
}
