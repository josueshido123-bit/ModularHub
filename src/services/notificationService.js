import { storageService } from './storageService.js';
import { generateId } from '../utilities/uiUtils.js';

class NotificationService {
    constructor() {
        this.dataKey = 'notifications_data';
        this.listeners = new Set();
        this.scheduler = null;
        this.accountId = null;
        this.loadData();
    }

    loadData() {
        this.accountId = storageService.getCurrentAccount().id;
        const data = storageService.load(this.dataKey, { notifications: [], scheduled: [] });
        const storedNotifications = Array.isArray(data.notifications) ? data.notifications : [];
        const notifications = storedNotifications.map(item => this.migrateLegacyTitle(item));
        this.data = {
            notifications,
            scheduled: Array.isArray(data.scheduled) ? data.scheduled : []
        };
        if (notifications.some((item, index) => item !== storedNotifications[index])) this.persist();
    }

    migrateLegacyTitle(item) {
        const migrations = {
            'Finance goal reached': [' is fully funded.', 'Finance goal reached.'],
            'Wishlist item completed': [' was marked complete.', 'Wishlist item marked complete.'],
            'Countdown ending soon': [' is coming up within a day.', 'Countdown ending within a day.'],
            'Countdown ended': [' has reached its date.', 'Countdown ended.']
        };
        const migration = migrations[item.title];
        if (!migration || !item.message.endsWith(migration[0])) return item;
        const name = item.message.slice(0, -migration[0].length);
        return name ? { ...item, title: name, message: migration[1] } : item;
    }

    ensureAccount() {
        const accountId = storageService.getCurrentAccount().id;
        if (accountId === this.accountId) return false;
        this.loadData();
        return true;
    }

    persist() {
        return storageService.save(this.dataKey, this.data);
    }

    emit() {
        const state = this.getState();
        this.listeners.forEach(listener => listener(state));
    }

    getState() {
        this.ensureAccount();
        const notifications = [...this.data.notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return { notifications, unreadCount: notifications.filter(item => !item.read).length };
    }

    getNotifications({ unreadOnly = false } = {}) {
        const notifications = this.getState().notifications;
        return unreadOnly ? notifications.filter(item => !item.read) : notifications;
    }

    notify(input) {
        this.ensureAccount();
        const title = String(input.title || '').trim();
        const message = String(input.message || '').trim();
        if (!title || !message) return null;
        if (input.dedupeKey) {
            const existing = this.data.notifications.find(item => item.dedupeKey === input.dedupeKey);
            if (existing) return existing;
        }

        const notification = this.createNotification({ ...input, title, message });
        const previous = this.data.notifications;
        this.data.notifications = [notification, ...previous].slice(0, 200);
        if (!this.persist()) {
            this.data.notifications = previous;
            return null;
        }
        this.emit();
        return notification;
    }

    schedule(input) {
        this.ensureAccount();
        const runAt = new Date(input.runAt).getTime();
        if (!input.scheduleId || !Number.isFinite(runAt) || !input.title || !input.message) return false;
        if (input.dedupeKey && this.data.notifications.some(item => item.dedupeKey === input.dedupeKey)) return true;

        if (runAt <= Date.now()) {
            this.cancelScheduled(input.scheduleId);
            return Boolean(this.notify(input));
        }

        const job = {
            scheduleId: String(input.scheduleId),
            runAt: new Date(runAt).toISOString(),
            expiresAt: input.expiresAt ? new Date(input.expiresAt).toISOString() : null,
            title: String(input.title),
            message: String(input.message),
            type: input.type || 'info',
            source: input.source || 'app',
            sourceId: input.sourceId || null,
            icon: input.icon || null,
            dedupeKey: input.dedupeKey || null
        };
        const previous = this.data.scheduled;
        this.data.scheduled = [...previous.filter(item => item.scheduleId !== job.scheduleId), job];
        if (!this.persist()) {
            this.data.scheduled = previous;
            return false;
        }
        this.emit();
        return true;
    }

    cancelScheduled(scheduleId) {
        this.ensureAccount();
        const previous = this.data.scheduled;
        this.data.scheduled = previous.filter(item => item.scheduleId !== scheduleId);
        if (previous.length === this.data.scheduled.length) return false;
        if (!this.persist()) {
            this.data.scheduled = previous;
            return false;
        }
        this.emit();
        return true;
    }

    processScheduled() {
        const accountChanged = this.ensureAccount();
        const now = Date.now();
        const previous = this.data.scheduled;
        const due = [];
        const pending = [];
        previous.forEach(job => {
            if (job.expiresAt && new Date(job.expiresAt).getTime() <= now) return;
            if (new Date(job.runAt).getTime() <= now) due.push(job);
            else pending.push(job);
        });
        if (!due.length && pending.length === previous.length) {
            if (accountChanged) this.emit();
            return;
        }

        const oldNotifications = this.data.notifications;
        this.data.scheduled = pending;
        const keys = new Set(oldNotifications.map(item => item.dedupeKey).filter(Boolean));
        due.forEach(job => {
            if (job.dedupeKey && keys.has(job.dedupeKey)) return;
            const item = this.createNotification(job);
            this.data.notifications.unshift(item);
            if (item.dedupeKey) keys.add(item.dedupeKey);
        });
        this.data.notifications = this.data.notifications.slice(0, 200);
        if (!this.persist()) {
            this.data.scheduled = previous;
            this.data.notifications = oldNotifications;
            return;
        }
        this.emit();
    }

    createNotification(input) {
        return {
            id: generateId(),
            title: String(input.title),
            message: String(input.message),
            type: ['success', 'reminder', 'info'].includes(input.type) ? input.type : 'info',
            source: String(input.source || 'app'),
            sourceId: input.sourceId || null,
            icon: input.icon || null,
            dedupeKey: input.dedupeKey || null,
            createdAt: new Date().toISOString(),
            read: false
        };
    }

    markRead(id) {
        this.ensureAccount();
        const item = this.data.notifications.find(notification => notification.id === id);
        if (!item || item.read) return false;
        item.read = true;
        if (!this.persist()) {
            item.read = false;
            return false;
        }
        this.emit();
        return true;
    }

    markAllRead() {
        this.ensureAccount();
        if (!this.data.notifications.some(item => !item.read)) return false;
        const previous = this.data.notifications;
        this.data.notifications = previous.map(item => ({ ...item, read: true }));
        if (!this.persist()) {
            this.data.notifications = previous;
            return false;
        }
        this.emit();
        return true;
    }

    clearAll() {
        this.ensureAccount();
        if (!this.data.notifications.length) return false;
        const previous = this.data.notifications;
        this.data.notifications = [];
        if (!this.persist()) {
            this.data.notifications = previous;
            return false;
        }
        this.emit();
        return true;
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    start() {
        if (this.scheduler) return;
        this.processScheduled();
        this.scheduler = setInterval(() => this.processScheduled(), 15000);
    }

    stop() {
        clearInterval(this.scheduler);
        this.scheduler = null;
    }
}

export const notificationService = new NotificationService();