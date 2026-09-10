/**
 * Storage Service
 * Centralized data persistence layer.
 * Uses localStorage for client-side storage.
 * Can be extended to support backend/database in the future.
 */

class StorageService {
    constructor() {
        this.prefix = 'simpledash_';
        this.accountKey = 'accounts';
        this.listeners = new Map(); // For observer pattern
        this.currentAccount = this.loadAccountMeta().currentAccount || 'guest';
    }

    loadAccountMeta() { try { return JSON.parse(localStorage.getItem(this.prefix + this.accountKey)) || { currentAccount: 'guest', accounts: [] }; } catch { return { currentAccount: 'guest', accounts: [] }; } }
    saveAccountMeta(meta) { localStorage.setItem(this.prefix + this.accountKey, JSON.stringify(meta)); }
    scopedKey(key, account = this.currentAccount) { return `${this.prefix}account_${encodeURIComponent(account)}_${key}`; }
    getCurrentAccount() { const meta = this.loadAccountMeta(); return meta.accounts.find(account => account.id === this.currentAccount) || { id: 'guest', email: 'Guest', isGuest: true }; }
    createAccount(email, password) { const normalized = email.trim().toLowerCase(); if (!normalized || password.length < 6) throw new Error('Use a valid email and a password with at least 6 characters.'); const meta = this.loadAccountMeta(); if (meta.accounts.some(account => account.email === normalized)) throw new Error('An account with that email already exists.'); const account = { id: normalized, email: normalized, password }; const guestPrefix = this.scopedKey('', 'guest'); Object.keys(localStorage).filter(key => (key.startsWith(this.prefix) && !key.startsWith(this.prefix + 'account_') && key !== this.prefix + this.accountKey) || key.startsWith(guestPrefix)).forEach(key => { const dataKey = key.startsWith(guestPrefix) ? key.slice(guestPrefix.length) : key.slice(this.prefix.length); localStorage.setItem(this.scopedKey(dataKey, account.id), localStorage.getItem(key)); }); meta.accounts.push(account); meta.currentAccount = account.id; this.currentAccount = account.id; this.saveAccountMeta(meta); return account; }
    login(email, password) { const normalized = email.trim().toLowerCase(); const account = this.loadAccountMeta().accounts.find(item => item.email === normalized && item.password === password); if (!account) throw new Error('Email or password is incorrect.'); const meta = this.loadAccountMeta(); meta.currentAccount = account.id; this.currentAccount = account.id; this.saveAccountMeta(meta); return account; }
    useGuestAccount() { const meta = this.loadAccountMeta(); meta.currentAccount = 'guest'; this.currentAccount = 'guest'; this.saveAccountMeta(meta); }

    /**
     * Save data to storage
     * @param {string} key - Storage key
     * @param {*} value - Data to store (will be JSON stringified)
     */
    save(key, value) {
        try {
            const fullKey = this.scopedKey(key);
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
            const fullKey = this.scopedKey(key);
            let data = localStorage.getItem(fullKey);
            if (data === null && this.currentAccount === 'guest') data = localStorage.getItem(this.prefix + key);
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
            localStorage.removeItem(this.scopedKey(key));
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
                if (key.startsWith(this.scopedKey(''))) {
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
        const scoped = this.scopedKey('');
        return keys.filter(k => k.startsWith(scoped)).map(k => k.substring(scoped.length));
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
