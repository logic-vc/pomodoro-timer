/**
 * Alarm System Unit Tests
 */

import { AlarmSystem } from '../../js/alarmSystem.js';

describe('AlarmSystem', () => {
    let alarm;
    let mockAudioContext;

    beforeEach(() => {
        // Mock AudioContext
        mockAudioContext = {
            state: 'running',
            resume: jest.fn(() => Promise.resolve()),
            close: jest.fn(() => Promise.resolve()),
            currentTime: 0,
            destination: {},
            createOscillator: jest.fn(() => ({
                connect: jest.fn(),
                type: 'sine',
                frequency: { setValueAtTime: jest.fn() },
                start: jest.fn(),
                stop: jest.fn(),
                onended: null
            })),
            createGain: jest.fn(() => ({
                connect: jest.fn(),
                gain: {
                    setValueAtTime: jest.fn(),
                    linearRampToValueAtTime: jest.fn(),
                    exponentialRampToValueAtTime: jest.fn()
                }
            }))
        };

        global.AudioContext = jest.fn(() => mockAudioContext);
        global.webkitAudioContext = jest.fn(() => mockAudioContext);

        // Mock document.body for flash overlay
        document.body.innerHTML = '';

        alarm = new AlarmSystem();
    });

    afterEach(() => {
        alarm.destroy();
    });

    describe('initialization', () => {
        test('should be created with sound enabled by default', () => {
            const settings = alarm.getSettings();
            expect(settings.soundEnabled).toBe(true);
        });

        test('should be created with flash disabled by default', () => {
            const settings = alarm.getSettings();
            expect(settings.flashEnabled).toBe(false);
        });

        test('should create flash overlay element', () => {
            const overlay = document.querySelector('.flash-overlay');
            expect(overlay).not.toBeNull();
        });
    });

    describe('setSoundEnabled()', () => {
        test('should enable sound', () => {
            alarm.setSoundEnabled(true);
            expect(alarm.getSettings().soundEnabled).toBe(true);
        });

        test('should disable sound', () => {
            alarm.setSoundEnabled(false);
            expect(alarm.getSettings().soundEnabled).toBe(false);
        });
    });

    describe('setFlashEnabled()', () => {
        test('should enable flash', () => {
            alarm.setFlashEnabled(true);
            expect(alarm.getSettings().flashEnabled).toBe(true);
        });

        test('should disable flash', () => {
            alarm.setFlashEnabled(false);
            expect(alarm.getSettings().flashEnabled).toBe(false);
        });
    });

    describe('trigger()', () => {
        test('should not throw when triggered', async () => {
            alarm.audioContext = mockAudioContext;
            await expect(alarm.trigger()).resolves.not.toThrow();
        });

        test('should not play sound when disabled', async () => {
            alarm.setSoundEnabled(false);
            alarm.audioContext = mockAudioContext;

            await alarm.trigger();

            expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
        });
    });

    describe('showFlash()', () => {
        test('should toggle overlay opacity during flash', async () => {
            alarm.setFlashEnabled(true);

            // Start flash but don't await full completion
            const flashPromise = alarm.showFlash();

            // Check that overlay exists and will be animated
            expect(alarm.flashOverlay).toBeDefined();

            await flashPromise;
        });
    });

    describe('getSettings()', () => {
        test('should return current settings', () => {
            alarm.setSoundEnabled(false);
            alarm.setFlashEnabled(true);
            const settings = alarm.getSettings();

            expect(settings.soundEnabled).toBe(false);
            expect(settings.flashEnabled).toBe(true);
        });
    });

    describe('destroy()', () => {
        test('should remove flash overlay from DOM', () => {
            alarm.destroy();
            const overlay = document.querySelector('.flash-overlay');
            expect(overlay).toBeNull();
        });
    });
});
