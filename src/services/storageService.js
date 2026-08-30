/**
 * Storage Service
 * Centralized data persistence layer.
 * Uses localStorage for client-side storage.
 * Can be extended to support backend/database in the future.
 */

class StorageService {
    constructor() {
        this.prefix = 'simpledash_';
        this.listeners = new Map(); // For observer pattern
    }

    /**
     * Save data to storage
     * @param {string} key - Storage key
     * @param {*} value - Data to store (will be JSON stringified)
     */
    save(key, value) {
        try {
            const fullKey = this.prefix + key;
            const serialized = JSON.stringify(value);
            localStorage.setItem(fullKey, serialized);
            this.notifyListeners(key, value);
            return true;
        } catch (error) {
            console.error(`Failed to save ${key}:`, error);
            return false;
        }
    }

    /**
     * Load data from storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key not found
     * @returns {*}
     */
    load(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const data = localStorage.getItem(fullKey);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Failed to load ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Remove data from storage
     * @param {string} key
     */
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            this.notifyListeners(key, null);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear all application data
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Failed to clear storage:', error);
            return false;
        }
    }

    /**
     * Subscribe to storage changes
     * @param {string} key - Storage key to watch
     * @param {Function} callback - Callback function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);

        // Return unsubscribe function
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
                console.error('Storage listener error:', error);
            }
        });
    }

    /**
     * Get all storage keys (for debugging)
     * @returns {Array<string>}
     */
    getAllKeys() {
        const keys = Object.keys(localStorage);
        return keys.filter(k => k.startsWith(this.prefix))
                   .map(k => k.substring(this.prefix.length));
    }

    /**
     * Export all data as JSON
     * @returns {Object}
     */
    exportData() {
        const data = {};
        const keys = this.getAllKeys();
        keys.forEach(key => {
            data[key] = this.load(key);
        });
        return data;
    }

    /**
     * Import data from JSON
     * @param {Object} data
     */
    importData(data) {
        Object.keys(data).forEach(key => {
            this.save(key, data[key]);
        });
    }
}

export const storageService = new StorageService();
