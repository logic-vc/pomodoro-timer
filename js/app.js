/**
 * Pomodoro Timer App
 * Main application entry point
 */

import { TimerController, TimerState } from './timerController.js';
import { DragController } from './dragController.js';
import { CanvasRenderer } from './canvasRenderer.js';
import { AlarmSystem } from './alarmSystem.js';
import { SettingsController } from './settingsController.js';

const MAX_MINUTES = 60;

class PomodoroApp {
    constructor() {
        // Get DOM elements
        this.elements = {
            canvas: document.getElementById('timer-canvas'),
            timeDisplay: document.getElementById('time-display'),
            statusText: document.getElementById('status-text'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            soundToggle: document.getElementById('sound-toggle'),
            flashToggle: document.getElementById('flash-toggle'),
            timerContainer: document.querySelector('.timer-container'),
            quickTimeButtons: document.querySelectorAll('.quick-time-btn')
        };

        // Initialize controllers
        this.settings = new SettingsController();
        const initialMinutes = this.settings.get('lastSetMinutes') || 25;
        this.timer = new TimerController(initialMinutes * 60);
        this.alarm = new AlarmSystem();
        this.canvasRenderer = new CanvasRenderer(this.elements.canvas);
        this.dragController = new DragController(this.elements.timerContainer, {
            onDrag: this._handleDrag.bind(this),
            onDragEnd: this._handleDragEnd.bind(this)
        });

        // Set up callbacks and event listeners
        this._setupCallbacks();
        this._setupEventListeners();
        this._loadSettings();

        // Initial render - clock hand style
        this._updateDisplay();
        this.canvasRenderer.setTotalMinutes(initialMinutes);
        this.canvasRenderer.draw();
    }

    /**
     * Sets up timer callbacks
     * @private
     */
    _setupCallbacks() {
        this.timer.onTick = (timeRemaining) => {
            this._updateDisplay();
            this.canvasRenderer.setRemainingSeconds(timeRemaining);
            this.canvasRenderer.draw();
        };

        this.timer.onComplete = () => {
            this._onTimerComplete();
        };

        this.timer.onStateChange = (newState) => {
            this._updateButtonStates();
            this._updateQuickTimeButtonStates();
            this._updateTimerContainerClass(newState);
        };
    }

    /**
     * Sets up DOM event listeners
     * @private
     */
    _setupEventListeners() {
        // Control buttons
        this.elements.startBtn.addEventListener('click', () => this._handleStart());
        this.elements.pauseBtn.addEventListener('click', () => this._handlePause());
        this.elements.resetBtn.addEventListener('click', () => this._handleReset());

        // Quick time buttons
        this.elements.quickTimeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const minutes = parseInt(e.target.dataset.minutes, 10);
                this._handleQuickTimeAdd(minutes);
            });
        });

        // Settings toggles
        this.elements.soundToggle.addEventListener('change', (e) => {
            this.settings.set('soundEnabled', e.target.checked);
            this.alarm.setSoundEnabled(e.target.checked);
        });

        this.elements.flashToggle.addEventListener('change', (e) => {
            this.settings.set('flashEnabled', e.target.checked);
            this.alarm.setFlashEnabled(e.target.checked);
        });
    }

    /**
     * Loads settings from storage
     * @private
     */
    _loadSettings() {
        // Sound toggle
        const soundEnabled = this.settings.get('soundEnabled');
        this.elements.soundToggle.checked = soundEnabled;
        this.alarm.setSoundEnabled(soundEnabled);

        // Flash toggle
        const flashEnabled = this.settings.get('flashEnabled');
        this.elements.flashToggle.checked = flashEnabled;
        this.alarm.setFlashEnabled(flashEnabled);
    }

    /**
     * Handles quick time button click - cumulative addition
     * @param {number} minutesToAdd - Minutes to add
     * @private
     */
    _handleQuickTimeAdd(minutesToAdd) {
        if (this.timer.getState() === TimerState.RUNNING) {
            return;
        }

        const currentMinutes = Math.floor(this.timer.getInitialTime() / 60);
        let newMinutes = currentMinutes + minutesToAdd;

        // Clamp to max 60 minutes
        if (newMinutes > MAX_MINUTES) {
            newMinutes = MAX_MINUTES;
        }

        this.timer.setTime(newMinutes * 60);
        this.canvasRenderer.setTotalMinutes(newMinutes);
        this.canvasRenderer.draw();
        this._updateDisplay();
        this.settings.set('lastSetMinutes', newMinutes);
    }

    /**
     * Handles drag interaction
     * @private
     */
    _handleDrag({ minutes }) {
        if (this.timer.getState() === TimerState.RUNNING) {
            return;
        }

        this.timer.setTime(minutes * 60);
        this.canvasRenderer.setTotalMinutes(minutes);
        this.canvasRenderer.draw();
        this._updateDisplay();
    }

    /**
     * Handles drag end
     * @private
     */
    _handleDragEnd() {
        // Save the last set time
        const minutes = Math.floor(this.timer.getInitialTime() / 60);
        this.settings.set('lastSetMinutes', minutes);
    }

    /**
     * Handles start button click
     * @private
     */
    _handleStart() {
        this.timer.start();
        this.dragController.disable();
        this._updateStatusText('진행 중...');
    }

    /**
     * Handles pause button click
     * @private
     */
    _handlePause() {
        this.timer.pause();
        this._updateStatusText('일시 정지');
    }

    /**
     * Handles reset button click
     * @private
     */
    _handleReset() {
        this.timer.reset();
        this.dragController.enable();

        // Reset canvas to initial set time
        const minutes = Math.floor(this.timer.getInitialTime() / 60);
        this.canvasRenderer.setTotalMinutes(minutes);
        this.canvasRenderer.draw();
        this._updateStatusText('드래그하여 시간 설정');
    }

    /**
     * Handles timer completion
     * @private
     */
    async _onTimerComplete() {
        this.dragController.enable();
        this._updateStatusText('완료!');
        this.elements.timerContainer.classList.add('completed');

        // Update canvas to show empty (0 remaining)
        this.canvasRenderer.setRemainingSeconds(0);
        this.canvasRenderer.draw();

        // Trigger alarm
        await this.alarm.trigger();

        // Remove completed class after animation
        setTimeout(() => {
            this.elements.timerContainer.classList.remove('completed');
        }, 500);
    }

    /**
     * Updates the time display
     * @private
     */
    _updateDisplay() {
        const timeRemaining = this.timer.getTimeRemaining();
        this.elements.timeDisplay.textContent = TimerController.formatTime(timeRemaining);
    }

    /**
     * Updates the status text
     * @param {string} text - Status text
     * @private
     */
    _updateStatusText(text) {
        this.elements.statusText.textContent = text;
    }

    /**
     * Updates button states based on timer state
     * @private
     */
    _updateButtonStates() {
        const state = this.timer.getState();

        switch (state) {
            case TimerState.IDLE:
                this.elements.startBtn.disabled = false;
                this.elements.pauseBtn.disabled = true;
                this.elements.resetBtn.disabled = false;
                break;
            case TimerState.RUNNING:
                this.elements.startBtn.disabled = true;
                this.elements.pauseBtn.disabled = false;
                this.elements.resetBtn.disabled = false;
                break;
            case TimerState.PAUSED:
                this.elements.startBtn.disabled = false;
                this.elements.pauseBtn.disabled = true;
                this.elements.resetBtn.disabled = false;
                break;
            case TimerState.COMPLETED:
                this.elements.startBtn.disabled = false;
                this.elements.pauseBtn.disabled = true;
                this.elements.resetBtn.disabled = false;
                break;
        }
    }

    /**
     * Updates quick time button states
     * @private
     */
    _updateQuickTimeButtonStates() {
        const isRunning = this.timer.getState() === TimerState.RUNNING;
        this.elements.quickTimeButtons.forEach(btn => {
            btn.disabled = isRunning;
        });
    }

    /**
     * Updates timer container class based on state
     * @param {string} state - Timer state
     * @private
     */
    _updateTimerContainerClass(state) {
        this.elements.timerContainer.classList.remove('running', 'paused', 'completed');

        if (state === TimerState.RUNNING) {
            this.elements.timerContainer.classList.add('running');
        } else if (state === TimerState.PAUSED) {
            this.elements.timerContainer.classList.add('paused');
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        this.timer.destroy();
        this.dragController.destroy();
        this.canvasRenderer.destroy();
        this.alarm.destroy();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoroApp = new PomodoroApp();
});
