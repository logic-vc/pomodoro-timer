/**
 * Alarm System Module
 * Handles sound and notification alarms
 */

export class AlarmSystem {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
        this.notificationEnabled = false;
        this.notificationPermission = 'default';
        this.isPlaying = false;

        // Initialize audio context on first user interaction
        this._initAudioContext = this._initAudioContext.bind(this);
        document.addEventListener('click', this._initAudioContext, { once: true });
        document.addEventListener('touchstart', this._initAudioContext, { once: true });
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
     * Sets whether notification alarm is enabled
     * @param {boolean} enabled
     */
    async setNotificationEnabled(enabled) {
        if (enabled && 'Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                this.notificationPermission = permission;
            } else {
                this.notificationPermission = Notification.permission;
            }

            this.notificationEnabled = this.notificationPermission === 'granted';
            return this.notificationEnabled;
        }

        this.notificationEnabled = false;
        return false;
    }

    /**
     * Triggers the alarm
     */
    async trigger() {
        const promises = [];

        if (this.soundEnabled) {
            promises.push(this.playSound());
        }

        if (this.notificationEnabled) {
            promises.push(this.showNotification());
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
     * Shows a browser notification
     */
    async showNotification() {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return;
        }

        if (Notification.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        try {
            const notification = new Notification('Pomodoro Timer', {
                body: '타이머가 완료되었습니다! 휴식을 취하세요.',
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>',
                tag: 'pomodoro-complete',
                requireInteraction: true
            });

            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);
        } catch (e) {
            console.warn('Failed to show notification:', e);
        }
    }

    /**
     * Tests the alarm (for settings preview)
     */
    async testAlarm() {
        if (this.soundEnabled) {
            await this._playNote(659.25, 0.2); // E5 note
        }
    }

    /**
     * Gets current settings
     * @returns {Object} Current alarm settings
     */
    getSettings() {
        return {
            soundEnabled: this.soundEnabled,
            notificationEnabled: this.notificationEnabled,
            notificationPermission: this.notificationPermission
        };
    }

    /**
     * Cleanup method
     */
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
