import { storageService } from '../../services/storageService.js';
import { generateId } from '../../utilities/uiUtils.js';
import { notificationService } from '../../services/notificationService.js';
import { DEFAULT_MEDIA_SCALE, normalizeMediaPosition, normalizeMediaScale } from '../../utilities/mediaUtils.js';

class CountdownsService {
    constructor() {
        this.dataKey = 'countdowns_data';
        this.loadData();
    }

    loadData() {
        this.data = storageService.load(this.dataKey, { items: [] });
        this.data.items ||= [];
    }

    normalize(input) {
        const title = String(input.title || '').trim();
        const target = new Date(input.targetAt);
        if (!title || !Number.isFinite(target.getTime())) return null;
        return {
            title,
            targetAt: target.toISOString(),
            note: String(input.note || '').trim(),
            mediaUrl: String(input.mediaUrl || '').trim(),
            mediaType: ['gif', 'video'].includes(input.mediaType) ? input.mediaType : 'image',
            mediaPosition: normalizeMediaPosition(input.mediaPosition),
            mediaScale: normalizeMediaScale(input.mediaScale ?? DEFAULT_MEDIA_SCALE)
        };
    }

    saveItems(items) {
        const previous = this.data.items;
        this.data.items = items;
        if (storageService.save(this.dataKey, this.data)) return true;
        this.data.items = previous;
        return false;
    }

    addCountdown(input) {
        const normalized = this.normalize(input);
        if (!normalized) return null;
        const countdown = { id: generateId(), ...normalized, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        if (!this.saveItems([countdown, ...this.data.items])) return null;
        this.scheduleNotifications(countdown);
        return countdown;
    }

    updateCountdown(id, input) {
        const current = this.getCountdown(id);
        const normalized = this.normalize({ ...current, ...input });
        if (!current || !normalized) return null;
        const updated = { ...current, ...normalized, updatedAt: new Date().toISOString() };
        const items = this.data.items.map(item => item.id === id ? updated : item);
        if (!this.saveItems(items)) return null;
        this.cancelNotifications(current);
        this.scheduleNotifications(updated);
        return updated;
    }

    removeCountdown(id) {
        const countdown = this.getCountdown(id);
        if (!countdown || !this.saveItems(this.data.items.filter(item => item.id !== id))) return false;
        this.cancelNotifications(countdown);
        return true;
    }

    scheduleNotifications(countdown = null) {
        const now = Date.now();
        const upcoming = (countdown ? [countdown] : this.data.items).filter(item => new Date(item.targetAt).getTime() > now);
        upcoming.forEach(item => {
            const targetTime = new Date(item.targetAt).getTime();
            const key = `countdown:${item.id}:${targetTime}`;
            const reminderTime = Math.max(now, targetTime - 86400000);
            notificationService.schedule({
                scheduleId: `${key}:day-before`,
                dedupeKey: `${key}:day-before`,
                runAt: new Date(reminderTime).toISOString(),
                expiresAt: item.targetAt,
                title: item.title,
                message: 'Countdown ending within a day.',
                type: 'reminder',
                source: 'countdowns',
                sourceId: item.id
            });
            notificationService.schedule({
                scheduleId: `${key}:ended`,
                dedupeKey: `${key}:ended`,
                runAt: item.targetAt,
                title: item.title,
                message: 'Countdown ended.',
                type: 'success',
                source: 'countdowns',
                sourceId: item.id
            });
        });
    }

    cancelNotifications(countdown) {
        const key = `countdown:${countdown.id}:${new Date(countdown.targetAt).getTime()}`;
        notificationService.cancelScheduled(`${key}:day-before`);
        notificationService.cancelScheduled(`${key}:ended`);
    }

    getCountdown(id) { return this.data.items.find(item => item.id === id) || null; }
    getCountdowns() { return [...this.data.items]; }
}

export const countdownsService = new CountdownsService();