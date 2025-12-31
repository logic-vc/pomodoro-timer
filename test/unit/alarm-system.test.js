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

        // Mock Notification
        global.Notification = jest.fn();
        global.Notification.permission = 'default';
        global.Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));

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

        test('should be created with notifications disabled by default', () => {
            const settings = alarm.getSettings();
            expect(settings.notificationEnabled).toBe(false);
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

    describe('setNotificationEnabled()', () => {
        test('should request permission when enabling', async () => {
            await alarm.setNotificationEnabled(true);
            expect(Notification.requestPermission).toHaveBeenCalled();
        });

        test('should enable notifications when permission granted', async () => {
            Notification.requestPermission = jest.fn(() => Promise.resolve('granted'));
            const result = await alarm.setNotificationEnabled(true);
            expect(result).toBe(true);
        });

        test('should not enable notifications when permission denied', async () => {
            Notification.permission = 'denied';
            Notification.requestPermission = jest.fn(() => Promise.resolve('denied'));
            const result = await alarm.setNotificationEnabled(true);
            expect(result).toBe(false);
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

    describe('getSettings()', () => {
        test('should return current settings', () => {
            alarm.setSoundEnabled(false);
            const settings = alarm.getSettings();

            expect(settings.soundEnabled).toBe(false);
            expect(settings.notificationEnabled).toBe(false);
            expect(settings).toHaveProperty('notificationPermission');
        });
    });
});
