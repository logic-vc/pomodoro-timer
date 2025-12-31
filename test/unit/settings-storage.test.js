/**
 * Settings Controller Unit Tests
 */

import { SettingsController } from '../../js/settingsController.js';

describe('SettingsController', () => {
    let settings;
    let mockStorage;

    beforeEach(() => {
        // Mock localStorage
        mockStorage = {};
        global.localStorage = {
            getItem: jest.fn((key) => mockStorage[key] || null),
            setItem: jest.fn((key, value) => {
                mockStorage[key] = value;
            }),
            removeItem: jest.fn((key) => {
                delete mockStorage[key];
            }),
            clear: jest.fn(() => {
                mockStorage = {};
            })
        };

        settings = new SettingsController();
    });

    describe('initialization', () => {
        test('should load default settings when localStorage is empty', () => {
            expect(settings.get('soundEnabled')).toBe(true);
            expect(settings.get('notificationEnabled')).toBe(false);
            expect(settings.get('lastSetMinutes')).toBe(25);
        });

        test('should load settings from localStorage if available', () => {
            mockStorage['pomodoro-settings'] = JSON.stringify({
                soundEnabled: false,
                notificationEnabled: true,
                lastSetMinutes: 45
            });

            const newSettings = new SettingsController();

            expect(newSettings.get('soundEnabled')).toBe(false);
            expect(newSettings.get('notificationEnabled')).toBe(true);
            expect(newSettings.get('lastSetMinutes')).toBe(45);
        });
    });

    describe('get()', () => {
        test('should return correct setting value', () => {
            expect(settings.get('soundEnabled')).toBe(true);
        });

        test('should return undefined for non-existent key', () => {
            expect(settings.get('nonExistentKey')).toBeUndefined();
        });
    });

    describe('set()', () => {
        test('should update setting value', () => {
            settings.set('soundEnabled', false);
            expect(settings.get('soundEnabled')).toBe(false);
        });

        test('should save to localStorage', () => {
            settings.set('soundEnabled', false);
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        test('should notify listeners', () => {
            const mockListener = jest.fn();
            settings.addListener(mockListener);

            settings.set('soundEnabled', false);

            expect(mockListener).toHaveBeenCalledWith('soundEnabled', false, true);
        });
    });

    describe('getAll()', () => {
        test('should return all settings', () => {
            const all = settings.getAll();

            expect(all).toHaveProperty('soundEnabled');
            expect(all).toHaveProperty('notificationEnabled');
            expect(all).toHaveProperty('lastSetMinutes');
        });

        test('should return a copy of settings', () => {
            const all = settings.getAll();
            all.soundEnabled = false;

            expect(settings.get('soundEnabled')).toBe(true);
        });
    });

    describe('reset()', () => {
        test('should restore default settings', () => {
            settings.set('soundEnabled', false);
            settings.set('lastSetMinutes', 45);

            settings.reset();

            expect(settings.get('soundEnabled')).toBe(true);
            expect(settings.get('lastSetMinutes')).toBe(25);
        });

        test('should notify listeners with all key', () => {
            const mockListener = jest.fn();
            settings.addListener(mockListener);

            settings.reset();

            expect(mockListener).toHaveBeenCalledWith('all', expect.any(Object), null);
        });
    });

    describe('listeners', () => {
        test('should add listener', () => {
            const mockListener = jest.fn();
            settings.addListener(mockListener);
            settings.set('soundEnabled', false);

            expect(mockListener).toHaveBeenCalled();
        });

        test('should remove listener', () => {
            const mockListener = jest.fn();
            settings.addListener(mockListener);
            settings.removeListener(mockListener);
            settings.set('soundEnabled', false);

            expect(mockListener).not.toHaveBeenCalled();
        });
    });
});
