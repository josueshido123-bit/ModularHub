import { storageService } from '../../services/storageService.js';
import { generateId } from '../../utilities/uiUtils.js';

class WishlistService {
    constructor() {
        this.dataKey = 'wishlist_data';
        this.loadData();
    }

    loadData() {
        this.data = storageService.load(this.dataKey, { items: [], history: [] });
        this.data.items ||= [];
        this.data.history ||= [];
    }

    saveData() {
        const saved = storageService.save(this.dataKey, this.data);
        if (!saved) this.loadData();
        return saved;
    }

    record(itemId, action, details = {}) {
        this.data.history.unshift({ id: generateId(), itemId, action, details, date: new Date().toISOString() });
    }

    mediaDetails(item) {
        return { name: item.name, mediaUrl: item.mediaUrl, mediaType: item.mediaType };
    }

    addItem(input) {
        const item = { id: generateId(), name: input.name.trim(), mediaUrl: input.mediaUrl || '', mediaType: input.mediaType || 'image', mediaPosition: input.mediaPosition || '50% 50%', price: Number(input.price) > 0 ? Number(input.price) : null, notes: input.notes || '', link: input.link || '', targetDate: input.targetDate || null, status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        this.data.items.unshift(item);
        this.record(item.id, 'added', this.mediaDetails(item));
        return this.saveData() ? item : null;
    }

    updateItem(itemId, updates) {
        const item = this.getItem(itemId);
        if (!item) return null;
        Object.assign(item, updates, { updatedAt: new Date().toISOString() });
        this.record(item.id, 'edited', this.mediaDetails(item));
        return this.saveData() ? item : null;
    }

    completeItem(itemId) {
        const item = this.getItem(itemId);
        if (!item) return null;
        item.status = item.status === 'completed' ? 'active' : 'completed';
        item.updatedAt = new Date().toISOString();
        this.record(item.id, item.status === 'completed' ? 'completed' : 'reopened', this.mediaDetails(item));
        return this.saveData() ? item : null;
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
