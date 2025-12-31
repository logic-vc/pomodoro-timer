/**
 * Timer Controller Module
 * Manages timer state and countdown logic
 */

export const TimerState = {
    IDLE: 'IDLE',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED'
};

export class TimerController {
    /**
     * @param {number} initialTimeInSeconds - Initial time in seconds
     */
    constructor(initialTimeInSeconds = 25 * 60) {
        this.initialTime = initialTimeInSeconds;
        this.timeRemaining = initialTimeInSeconds;
        this.state = TimerState.IDLE;
        this.intervalId = null;

        // Callbacks
        this.onTick = null;
        this.onComplete = null;
        this.onStateChange = null;
    }

    /**
     * Sets a new timer duration
     * @param {number} timeInSeconds - Time in seconds
     */
    setTime(timeInSeconds) {
        if (this.state === TimerState.RUNNING) {
            return; // Don't change time while running
        }

        this.initialTime = timeInSeconds;
        this.timeRemaining = timeInSeconds;
        this._notifyTick();
    }

    /**
     * Starts the timer countdown
     */
    start() {
        if (this.state === TimerState.RUNNING) {
            return;
        }

        if (this.timeRemaining <= 0) {
            this.reset();
        }

        this._setState(TimerState.RUNNING);

        this.intervalId = setInterval(() => {
            this.timeRemaining--;
            this._notifyTick();

            if (this.timeRemaining <= 0) {
                this._complete();
            }
        }, 1000);
    }

    /**
     * Pauses the timer
     */
    pause() {
        if (this.state !== TimerState.RUNNING) {
            return;
        }

        this._clearInterval();
        this._setState(TimerState.PAUSED);
    }

    /**
     * Resets the timer to initial state
     */
    reset() {
        this._clearInterval();
        this.timeRemaining = this.initialTime;
        this._setState(TimerState.IDLE);
        this._notifyTick();
    }

    /**
     * Gets the current time remaining
     * @returns {number} Time remaining in seconds
     */
    getTimeRemaining() {
        return this.timeRemaining;
    }

    /**
     * Gets the initial time
     * @returns {number} Initial time in seconds
     */
    getInitialTime() {
        return this.initialTime;
    }

    /**
     * Gets the current timer state
     * @returns {string} Current state
     */
    getState() {
        return this.state;
    }

    /**
     * Gets the progress ratio (0 to 1)
     * @returns {number} Progress ratio
     */
    getProgress() {
        if (this.initialTime === 0) return 0;
        return 1 - (this.timeRemaining / this.initialTime);
    }

    /**
     * Formats time as MM:SS
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * @private
     */
    _complete() {
        this._clearInterval();
        this.timeRemaining = 0;
        this._setState(TimerState.COMPLETED);

        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * @private
     */
    _clearInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * @private
     */
    _setState(newState) {
        const oldState = this.state;
        this.state = newState;

        if (this.onStateChange) {
            this.onStateChange(newState, oldState);
        }
    }

    /**
     * @private
     */
    _notifyTick() {
        if (this.onTick) {
            this.onTick(this.timeRemaining, this.getProgress());
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        this._clearInterval();
        this.onTick = null;
        this.onComplete = null;
        this.onStateChange = null;
    }
}
