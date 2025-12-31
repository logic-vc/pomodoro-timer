/**
 * Timer Controller Unit Tests
 */

import { TimerController, TimerState } from '../../js/timerController.js';

describe('TimerController', () => {
    let timer;

    beforeEach(() => {
        jest.useFakeTimers();
        timer = new TimerController(60); // 60 seconds
    });

    afterEach(() => {
        timer.destroy();
        jest.useRealTimers();
    });

    describe('initialization', () => {
        test('should initialize with correct initial time', () => {
            expect(timer.getTimeRemaining()).toBe(60);
            expect(timer.getInitialTime()).toBe(60);
        });

        test('should initialize in IDLE state', () => {
            expect(timer.getState()).toBe(TimerState.IDLE);
        });

        test('should have 0 progress initially', () => {
            expect(timer.getProgress()).toBe(0);
        });
    });

    describe('start()', () => {
        test('should change state to RUNNING', () => {
            timer.start();
            expect(timer.getState()).toBe(TimerState.RUNNING);
        });

        test('should decrement time every second', () => {
            timer.start();
            jest.advanceTimersByTime(1000);
            expect(timer.getTimeRemaining()).toBe(59);
        });

        test('should call onTick callback every second', () => {
            const mockOnTick = jest.fn();
            timer.onTick = mockOnTick;

            timer.start();
            jest.advanceTimersByTime(1000);

            expect(mockOnTick).toHaveBeenCalled();
        });

        test('should not start again if already running', () => {
            timer.start();
            timer.start(); // Should be ignored

            jest.advanceTimersByTime(1000);
            expect(timer.getTimeRemaining()).toBe(59); // Only 1 second elapsed
        });
    });

    describe('pause()', () => {
        test('should change state to PAUSED', () => {
            timer.start();
            timer.pause();
            expect(timer.getState()).toBe(TimerState.PAUSED);
        });

        test('should stop the countdown', () => {
            timer.start();
            jest.advanceTimersByTime(2000);
            timer.pause();

            const timeAfterPause = timer.getTimeRemaining();
            jest.advanceTimersByTime(5000);

            expect(timer.getTimeRemaining()).toBe(timeAfterPause);
        });

        test('should do nothing if not running', () => {
            timer.pause();
            expect(timer.getState()).toBe(TimerState.IDLE);
        });
    });

    describe('reset()', () => {
        test('should restore initial time', () => {
            timer.start();
            jest.advanceTimersByTime(30000);
            timer.reset();

            expect(timer.getTimeRemaining()).toBe(60);
        });

        test('should change state to IDLE', () => {
            timer.start();
            timer.reset();
            expect(timer.getState()).toBe(TimerState.IDLE);
        });

        test('should stop the countdown', () => {
            timer.start();
            timer.reset();

            jest.advanceTimersByTime(5000);
            expect(timer.getTimeRemaining()).toBe(60);
        });
    });

    describe('setTime()', () => {
        test('should update initial and remaining time', () => {
            timer.setTime(120);
            expect(timer.getTimeRemaining()).toBe(120);
            expect(timer.getInitialTime()).toBe(120);
        });

        test('should not change time while running', () => {
            timer.start();
            timer.setTime(120);
            expect(timer.getInitialTime()).toBe(60);
        });
    });

    describe('completion', () => {
        test('should call onComplete when timer reaches 0', () => {
            const mockOnComplete = jest.fn();
            timer.onComplete = mockOnComplete;

            timer.start();
            jest.advanceTimersByTime(60000);

            expect(mockOnComplete).toHaveBeenCalled();
        });

        test('should change state to COMPLETED', () => {
            timer.start();
            jest.advanceTimersByTime(60000);

            expect(timer.getState()).toBe(TimerState.COMPLETED);
        });

        test('should stop at 0 seconds', () => {
            timer.start();
            jest.advanceTimersByTime(70000); // 10 seconds past 0

            expect(timer.getTimeRemaining()).toBe(0);
        });
    });

    describe('getProgress()', () => {
        test('should return 0 at start', () => {
            expect(timer.getProgress()).toBe(0);
        });

        test('should return 0.5 at halfway point', () => {
            timer.start();
            jest.advanceTimersByTime(30000);
            expect(timer.getProgress()).toBeCloseTo(0.5);
        });

        test('should return 1 when complete', () => {
            timer.start();
            jest.advanceTimersByTime(60000);
            expect(timer.getProgress()).toBe(1);
        });
    });

    describe('formatTime()', () => {
        test('should format seconds as MM:SS', () => {
            expect(TimerController.formatTime(0)).toBe('00:00');
            expect(TimerController.formatTime(30)).toBe('00:30');
            expect(TimerController.formatTime(60)).toBe('01:00');
            expect(TimerController.formatTime(90)).toBe('01:30');
            expect(TimerController.formatTime(3600)).toBe('60:00');
        });
    });

    describe('onStateChange callback', () => {
        test('should be called with old and new state', () => {
            const mockOnStateChange = jest.fn();
            timer.onStateChange = mockOnStateChange;

            timer.start();
            expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.RUNNING, TimerState.IDLE);

            timer.pause();
            expect(mockOnStateChange).toHaveBeenCalledWith(TimerState.PAUSED, TimerState.RUNNING);
        });
    });
});
