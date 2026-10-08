import { storageService } from '../../services/storageService.js';
import { generateId } from '../../utilities/uiUtils.js';
import { notificationService } from '../../services/notificationService.js';
import { DEFAULT_MEDIA_SCALE, normalizeMediaPosition, normalizeMediaScale } from '../../utilities/mediaUtils.js';

class WishlistService {
    constructor() {
        this.dataKey = 'wishlist_data';
        this.loadData();
    }

    loadData() {
        this.data = storageService.load(this.dataKey, { items: [], history: [] });
        this.data.items ||= [];
        this.data.history ||= [];
        const history = this.data.history.slice(0, 100).map(entry => {
            if (!entry.details?.mediaUrl) return entry;
            return { ...entry, details: { ...entry.details, mediaUrl: '' } };
        });
        if (history.length !== this.data.history.length || history.some((entry, index) => entry !== this.data.history[index])) {
            this.data.history = history;
            storageService.save(this.dataKey, this.data);
        }
    }

    saveData() {
        const saved = storageService.save(this.dataKey, this.data);
        if (!saved) this.loadData();
        return saved;
    }

    record(itemId, action, details = {}) {
        const { mediaUrl, ...historyDetails } = details;
        this.data.history.unshift({ id: generateId(), itemId, action, details: historyDetails, date: new Date().toISOString() });
        this.data.history.length = Math.min(this.data.history.length, 100);
    }

    mediaDetails(item) {
        return { name: item.name, mediaType: item.mediaType };
    }

    addItem(input) {
        const item = { id: generateId(), name: input.name.trim(), mediaUrl: input.mediaUrl || '', mediaType: input.mediaType || 'image', mediaPosition: normalizeMediaPosition(input.mediaPosition), mediaScale: normalizeMediaScale(input.mediaScale ?? DEFAULT_MEDIA_SCALE), price: Number(input.price) > 0 ? Number(input.price) : null, notes: input.notes || '', link: input.link || '', targetDate: input.targetDate || null, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        this.data.items.unshift(item);
        this.record(item.id, 'added', this.mediaDetails(item));
        return this.saveData() ? item : null;
    }

    updateItem(itemId, updates) {
        const item = this.getItem(itemId);
        if (!item) return null;
        Object.assign(item, updates, { mediaPosition: normalizeMediaPosition(updates.mediaPosition ?? item.mediaPosition), mediaScale: normalizeMediaScale(updates.mediaScale ?? item.mediaScale), updatedAt: new Date().toISOString() });
        this.record(item.id, 'edited', this.mediaDetails(item));
        return this.saveData() ? item : null;
    }

    completeItem(itemId) {
        const item = this.getItem(itemId);
        if (!item) return null;
        item.status = item.status === 'completed' ? 'active' : 'completed';
        item.updatedAt = new Date().toISOString();
        this.record(item.id, item.status === 'completed' ? 'completed' : 'reopened', this.mediaDetails(item));
        if (!this.saveData()) return null;
        if (item.status === 'completed') {
            notificationService.notify({
                title: item.name,
                message: 'Wishlist item marked complete.',
                type: 'success',
                source: 'wishlist',
                sourceId: item.id,
                dedupeKey: `wishlist-item:${item.id}:completed:${generateId()}`
            });
        }
        return item;
    }

    removeItem(itemId) {
        const item = this.getItem(itemId);
        if (!item) return false;
        this.data.items = this.data.items.filter(existing => existing.id !== itemId);
        this.record(itemId, 'removed', this.mediaDetails(item));
        return this.saveData();
    }

    getItem(itemId) { return this.data.items.find(item => item.id === itemId) || null; }
    getItems() { return [...this.data.items]; }
    getHistory() { return [...this.data.history]; }
}

export const wishlistService = new WishlistService();
