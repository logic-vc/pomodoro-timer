/**
 * Settings Controller Module
 * Manages user preferences with localStorage persistence
 */

const STORAGE_KEY = 'pomodoro-settings';

const DEFAULT_SETTINGS = {
    soundEnabled: true,
    notificationEnabled: false,
    lastSetMinutes: 25
};

export class SettingsController {
    constructor() {
        this.settings = this._loadSettings();
        this.listeners = [];
    }

    /**
     * Loads settings from localStorage
     * @returns {Object} Settings object
     * @private
     */
    _loadSettings() {
        if (typeof Storage === 'undefined') {
            console.warn('LocalStorage not supported');
            return { ...DEFAULT_SETTINGS };
        }

        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn('Failed to load settings:', e);
        }

        return { ...DEFAULT_SETTINGS };
    }

    /**
     * Saves settings to localStorage
     * @private
     */
    _saveSettings() {
        if (typeof Storage === 'undefined') {
            return;
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Failed to save settings:', e);
        }
    }

    /**
     * Gets a setting value
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    get(key) {
        return this.settings[key];
    }

    /**
     * Sets a setting value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    set(key, value) {
        const oldValue = this.settings[key];
        this.settings[key] = value;
        this._saveSettings();
        this._notifyListeners(key, value, oldValue);
    }

    /**
     * Gets all settings
     * @returns {Object} All settings
     */
    getAll() {
        return { ...this.settings };
    }

    /**
     * Resets all settings to defaults
     */
    reset() {
        this.settings = { ...DEFAULT_SETTINGS };
        this._saveSettings();
        this._notifyListeners('all', this.settings, null);
    }

    /**
     * Adds a change listener
     * @param {Function} listener - Callback function(key, newValue, oldValue)
     */
    addListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * Removes a change listener
     * @param {Function} listener - Callback function to remove
     */
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notifies all listeners of a change
     * @private
     */
    _notifyListeners(key, newValue, oldValue) {
        this.listeners.forEach(listener => {
            try {
                listener(key, newValue, oldValue);
            } catch (e) {
                console.warn('Listener error:', e);
            }
        });
    }
}
