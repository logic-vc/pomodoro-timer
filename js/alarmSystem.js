/**
 * Alarm System Module
 * Handles sound and screen flash alarms
 */

export class AlarmSystem {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
        this.flashEnabled = false;
        this.isPlaying = false;
        this.flashOverlay = null;

        // Create flash overlay element
        this._createFlashOverlay();

        // Initialize audio context on first user interaction
        this._initAudioContext = this._initAudioContext.bind(this);
        document.addEventListener('click', this._initAudioContext, { once: true });
        document.addEventListener('touchstart', this._initAudioContext, { once: true });
    }

    /**
     * Creates the flash overlay element
     * @private
     */
    _createFlashOverlay() {
        this.flashOverlay = document.createElement('div');
        this.flashOverlay.className = 'flash-overlay';
        this.flashOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0;
            z-index: 9999;
            transition: opacity 0.1s ease;
        `;
        document.body.appendChild(this.flashOverlay);
    }

    /**
     * Initializes the Web Audio API context
     * @private
     */
    _initAudioContext() {
        if (this.audioContext) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * Sets whether sound alarm is enabled
     * @param {boolean} enabled
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    /**
     * Sets whether screen flash is enabled
     * @param {boolean} enabled
     */
    setFlashEnabled(enabled) {
        this.flashEnabled = enabled;
    }

    /**
     * Triggers the alarm
     */
    async trigger() {
        const promises = [];

        if (this.soundEnabled) {
            promises.push(this.playSound());
        }

        if (this.flashEnabled) {
            promises.push(this.showFlash());
        }

        await Promise.all(promises);
    }

    /**
     * Plays the alarm sound
     */
    async playSound() {
        if (!this.audioContext) {
            this._initAudioContext();
        }

        if (!this.audioContext || this.isPlaying) {
            return;
        }

        this.isPlaying = true;

        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Play a pleasant alarm sound using oscillators
            await this._playAlarmSequence();
        } catch (e) {
            console.warn('Failed to play alarm sound:', e);
        } finally {
            this.isPlaying = false;
        }
    }

    /**
     * Shows screen flash effect
     */
    async showFlash() {
        const colors = ['#ff6b6b', '#feca57', '#48dbfb'];
        const flashCount = 6;
        const flashDuration = 200;

        for (let i = 0; i < flashCount; i++) {
            const color = colors[i % colors.length];
            this.flashOverlay.style.backgroundColor = color;
            this.flashOverlay.style.opacity = '0.5';

            await this._wait(flashDuration);

            this.flashOverlay.style.opacity = '0';

            await this._wait(flashDuration / 2);
        }
    }

    /**
     * Plays an alarm sound sequence
     * @private
     */
    async _playAlarmSequence() {
        const notes = [523.25, 659.25, 783.99, 659.25]; // C5, E5, G5, E5
        const duration = 0.15;
        const gap = 0.05;
        const repeats = 3;

        for (let r = 0; r < repeats; r++) {
            for (let i = 0; i < notes.length; i++) {
                await this._playNote(notes[i], duration);
                await this._wait(gap * 1000);
            }
            await this._wait(200);
        }
    }

    /**
     * Plays a single note
     * @param {number} frequency - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @private
     */
    _playNote(frequency, duration) {
        return new Promise((resolve) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            // Envelope for smooth sound
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.start(now);
            oscillator.stop(now + duration);

            oscillator.onended = resolve;
        });
    }

    /**
     * Waits for specified milliseconds
     * @param {number} ms - Milliseconds to wait
     * @private
     */
    _wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Tests the alarm (for settings preview)
     */
    async testAlarm() {
        if (this.soundEnabled) {
            await this._playNote(659.25, 0.2); // E5 note
        }
        if (this.flashEnabled) {
            this.flashOverlay.style.backgroundColor = '#ff6b6b';
            this.flashOverlay.style.opacity = '0.5';
            await this._wait(200);
            this.flashOverlay.style.opacity = '0';
        }
    }

    /**
     * Gets current settings
     * @returns {Object} Current alarm settings
     */
    getSettings() {
        return {
            soundEnabled: this.soundEnabled,
            flashEnabled: this.flashEnabled
        };
    }

    /**
     * Cleanup method
     */
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.flashOverlay && this.flashOverlay.parentNode) {
            this.flashOverlay.parentNode.removeChild(this.flashOverlay);
        }
    }
}
