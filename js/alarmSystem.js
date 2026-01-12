/**
 * Alarm System Module
 * Handles sound and screen flash alarms with dismiss functionality
 */

const ALARM_DURATION = 5000; // 5 seconds

export class AlarmSystem {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
        this.flashEnabled = false;
        this.isPlaying = false;
        this.isStopped = false;
        this.flashOverlay = null;
        this.dismissButton = null;
        this.currentOscillators = [];

        // Create UI elements
        this._createFlashOverlay();
        this._createDismissButton();

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
            z-index: 9998;
            transition: opacity 0.1s ease;
        `;
        document.body.appendChild(this.flashOverlay);
    }

    /**
     * Creates the dismiss button element
     * @private
     */
    _createDismissButton() {
        this.dismissButton = document.createElement('button');
        this.dismissButton.className = 'alarm-dismiss-btn';
        this.dismissButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <span>알람 끄기</span>
        `;
        this.dismissButton.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            z-index: 10000;
            display: none;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 24px 48px;
            border: none;
            border-radius: 16px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
            color: white;
            font-size: 1.25rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 8px 32px rgba(255, 107, 107, 0.5);
            opacity: 0;
            transition: all 0.3s ease;
        `;

        this.dismissButton.addEventListener('click', () => this.stop());
        document.body.appendChild(this.dismissButton);
    }

    /**
     * Shows the dismiss button
     * @private
     */
    _showDismissButton() {
        this.dismissButton.style.display = 'flex';
        // Trigger reflow for animation
        this.dismissButton.offsetHeight;
        this.dismissButton.style.opacity = '1';
        this.dismissButton.style.transform = 'translate(-50%, -50%) scale(1)';
    }

    /**
     * Hides the dismiss button
     * @private
     */
    _hideDismissButton() {
        this.dismissButton.style.opacity = '0';
        this.dismissButton.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
            this.dismissButton.style.display = 'none';
        }, 300);
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
     * Prepares audio context for playback (call during user interaction)
     * This is crucial for iOS Safari where AudioContext needs user gesture
     */
    async prepare() {
        if (!this.audioContext) {
            this._initAudioContext();
        }

        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                console.warn('Failed to resume audio context:', e);
            }
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
     * Stops the alarm
     */
    stop() {
        this.isStopped = true;
        this.isPlaying = false;

        // Stop all current oscillators
        this.currentOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Already stopped
            }
        });
        this.currentOscillators = [];

        // Hide flash overlay
        this.flashOverlay.style.opacity = '0';

        // Hide dismiss button
        this._hideDismissButton();
    }

    /**
     * Triggers the alarm
     */
    async trigger() {
        this.isStopped = false;

        // Show dismiss button
        this._showDismissButton();

        const promises = [];

        if (this.soundEnabled) {
            promises.push(this.playSound());
        }

        if (this.flashEnabled) {
            promises.push(this.showFlash());
        }

        // Auto-stop after duration if not dismissed
        const autoStopTimeout = setTimeout(() => {
            if (!this.isStopped) {
                this.stop();
            }
        }, ALARM_DURATION);

        await Promise.all(promises);

        clearTimeout(autoStopTimeout);

        // Ensure button is hidden after alarm ends
        if (!this.isStopped) {
            this._hideDismissButton();
        }
    }

    /**
     * Plays the alarm sound for 5 seconds
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

            // Play alarm sequence for 5 seconds
            await this._playAlarmSequence();
        } catch (e) {
            console.warn('Failed to play alarm sound:', e);
        } finally {
            this.isPlaying = false;
        }
    }

    /**
     * Shows screen flash effect for 5 seconds
     */
    async showFlash() {
        const colors = ['#ff6b6b', '#feca57', '#48dbfb'];
        const flashDuration = 250;
        const startTime = Date.now();

        while (Date.now() - startTime < ALARM_DURATION && !this.isStopped) {
            const colorIndex = Math.floor((Date.now() - startTime) / flashDuration) % colors.length;
            const color = colors[colorIndex];

            this.flashOverlay.style.backgroundColor = color;
            this.flashOverlay.style.opacity = '0.4';

            await this._wait(flashDuration);

            if (this.isStopped) break;

            this.flashOverlay.style.opacity = '0.1';

            await this._wait(flashDuration / 2);
        }

        this.flashOverlay.style.opacity = '0';
    }

    /**
     * Plays alarm sound sequence for 5 seconds
     * @private
     */
    async _playAlarmSequence() {
        const notes = [523.25, 659.25, 783.99, 659.25]; // C5, E5, G5, E5
        const duration = 0.15;
        const gap = 0.05;
        const startTime = Date.now();

        while (Date.now() - startTime < ALARM_DURATION && !this.isStopped) {
            for (let i = 0; i < notes.length && !this.isStopped; i++) {
                if (Date.now() - startTime >= ALARM_DURATION) break;
                await this._playNote(notes[i], duration);
                await this._wait(gap * 1000);
            }
            await this._wait(150);
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
            if (this.isStopped || !this.audioContext) {
                resolve();
                return;
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            this.currentOscillators.push(oscillator);

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

            oscillator.onended = () => {
                const index = this.currentOscillators.indexOf(oscillator);
                if (index > -1) {
                    this.currentOscillators.splice(index, 1);
                }
                resolve();
            };
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
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.flashOverlay && this.flashOverlay.parentNode) {
            this.flashOverlay.parentNode.removeChild(this.flashOverlay);
        }
        if (this.dismissButton && this.dismissButton.parentNode) {
            this.dismissButton.parentNode.removeChild(this.dismissButton);
        }
    }
}
