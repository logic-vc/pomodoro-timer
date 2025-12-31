/**
 * Pomodoro Timer App
 * Main application entry point
 */

import { TimerController, TimerState } from './timerController.js';
import { DragController } from './dragController.js';
import { CanvasRenderer } from './canvasRenderer.js';
import { AlarmSystem } from './alarmSystem.js';
import { SettingsController } from './settingsController.js';

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
            notificationToggle: document.getElementById('notification-toggle'),
            timerContainer: document.querySelector('.timer-container')
        };

        // Initialize controllers
        this.settings = new SettingsController();
        this.timer = new TimerController(this.settings.get('lastSetMinutes') * 60);
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

        // Initial render
        this._updateDisplay();
        this.canvasRenderer.setProgress(0);
        this.canvasRenderer.draw();
    }

    /**
     * Sets up timer callbacks
     * @private
     */
    _setupCallbacks() {
        this.timer.onTick = (timeRemaining, progress) => {
            this._updateDisplay();
            this.canvasRenderer.setProgress(progress);
            this.canvasRenderer.draw();
        };

        this.timer.onComplete = () => {
            this._onTimerComplete();
        };

        this.timer.onStateChange = (newState, oldState) => {
            this._updateButtonStates();
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

        // Settings toggles
        this.elements.soundToggle.addEventListener('change', (e) => {
            this.settings.set('soundEnabled', e.target.checked);
            this.alarm.setSoundEnabled(e.target.checked);
        });

        this.elements.notificationToggle.addEventListener('change', async (e) => {
            const enabled = await this.alarm.setNotificationEnabled(e.target.checked);
            this.settings.set('notificationEnabled', enabled);
            e.target.checked = enabled;
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

        // Notification toggle
        const notificationEnabled = this.settings.get('notificationEnabled');
        this.elements.notificationToggle.checked = notificationEnabled;
        if (notificationEnabled) {
            this.alarm.setNotificationEnabled(true);
        }
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
        this.canvasRenderer.setProgress(0);
        this.canvasRenderer.setMinutesValue(minutes);
        this.canvasRenderer.draw();
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
        this.canvasRenderer.setProgress(0);
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
