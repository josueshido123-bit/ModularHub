/**
 * Settings Service
 * Manages application-wide settings
 */

import { storageService } from './storageService.js';

class SettingsService {
    constructor() {
        this.settingsKey = 'app_settings';
        this.listeners = new Map();
        this.loadSettings();
    }

    /**
     * Load settings from storage
     */
    loadSettings() {
        const defaults = {
            theme: 'dark',
            animationsEnabled: true,
            respectReducedMotion: this.prefersReducedMotion(),
            soundEnabled: false,
            dataExportFormat: 'json'
        };

        this.settings = storageService.load(this.settingsKey, defaults);
        this.applySettings();
    }

    /**
     * Apply settings to the application
     */
    applySettings() {
        // Apply reduced motion
        if (this.settings.respectReducedMotion && this.prefersReducedMotion()) {
            document.documentElement.style.setProperty('--transition-fast', '0ms');
            document.documentElement.style.setProperty('--transition-base', '0ms');
            document.documentElement.style.setProperty('--transition-slow', '0ms');
        } else {
            document.documentElement.style.setProperty('--transition-fast', '150ms ease');
            document.documentElement.style.setProperty('--transition-base', '200ms ease');
            document.documentElement.style.setProperty('--transition-slow', '300ms ease');
        }
    }

    /**
     * Get a setting value
     * @param {string} key
     * @param {*} defaultValue
     * @returns {*}
     */
    get(key, defaultValue = null) {
        return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
    }

    /**
     * Set a setting value
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
        this.notifyListeners(key, value);
    }

    /**
     * Save settings to storage
     */
    saveSettings() {
        storageService.save(this.settingsKey, this.settings);
    }

    /**
     * Check if system prefers reduced motion
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Get all settings
     * @returns {Object}
     */
    getAll() {
        return { ...this.settings };
    }

    /**
     * Reset to defaults
     */
    reset() {
        this.settings = {
            theme: 'dark',
            animationsEnabled: true,
            respectReducedMotion: this.prefersReducedMotion(),
            soundEnabled: false,
            dataExportFormat: 'json'
        };
        this.saveSettings();
        this.applySettings();
    }

    /**
     * Subscribe to setting changes
     * @param {string} key
     * @param {Function} callback
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);

        return () => {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Notify listeners of changes
     * @private
     */
    notifyListeners(key, value) {
        const callbacks = this.listeners.get(key) || [];
        callbacks.forEach(callback => {
            try {
                callback(value);
            } catch (error) {
                console.error('Settings listener error:', error);
            }
        });
    }

    /**
     * Export all data from all modules
     * @returns {Object}
     */
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            appVersion: '1.0.0',
            settings: this.settings,
            modules: {}
        };

        // Export data from each module
        const allKeys = storageService.getAllKeys();
        allKeys.forEach(key => {
            if (!key.startsWith('app_')) {
                data.modules[key] = storageService.load(key);
            }
        });

        return data;
    }

    /**
     * Import data into the application
     * @param {Object} data
     */
    importData(data) {
        if (!data.modules) {
            throw new Error('Invalid data format');
        }

        // Import module data
        Object.keys(data.modules).forEach(key => {
            storageService.save(key, data.modules[key]);
        });

        // Import settings if available
        if (data.settings) {
            this.settings = { ...this.settings, ...data.settings };
            this.saveSettings();
            this.applySettings();
        }
    }

    /**
     * Download data as JSON file
     */
    downloadData() {
        const data = this.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `simpledash-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Clear all data
     */
    clearAllData() {
        if (confirm('This will delete all your data. Are you sure?')) {
            storageService.clear();
            this.reset();
            return true;
        }
        return false;
    }
}

export const settingsService = new SettingsService();
