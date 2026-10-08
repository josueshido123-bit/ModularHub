import { storageService } from '../../services/storageService.js';
import { generateId } from '../../utilities/uiUtils.js';
import { DEFAULT_MEDIA_SCALE, normalizeMediaPosition, normalizeMediaScale } from '../../utilities/mediaUtils.js';

class BookmarksService {
    constructor() {
        this.dataKey = 'bookmarks_data';
        this.loadData();
    }

    loadData() {
        this.data = storageService.load(this.dataKey, { items: [], history: [] });
        this.data.items ||= [];
        this.data.history ||= [];
    }

    saveData() { storageService.save(this.dataKey, this.data); }
    mediaDetails(item) { return { name: item.name, mediaUrl: item.mediaUrl, mediaType: item.mediaType }; }
    record(itemId, action, details) { this.data.history.unshift({ id: generateId(), itemId, action, details, date: new Date().toISOString() }); }

    addItem(input) {
        const item = { id: generateId(), name: input.name.trim(), url: input.url.trim(), mediaUrl: input.mediaUrl || '', mediaType: input.mediaType || 'image', mediaPosition: normalizeMediaPosition(input.mediaPosition), mediaScale: normalizeMediaScale(input.mediaScale ?? DEFAULT_MEDIA_SCALE), description: input.description || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        this.data.items.unshift(item);
        this.record(item.id, 'added', this.mediaDetails(item));
        this.saveData();
        return item;
    }

    updateItem(itemId, updates) {
        const item = this.getItem(itemId);
        if (!item) return null;
        Object.assign(item, updates, { mediaPosition: normalizeMediaPosition(updates.mediaPosition ?? item.mediaPosition), mediaScale: normalizeMediaScale(updates.mediaScale ?? item.mediaScale), updatedAt: new Date().toISOString() });
        this.record(item.id, 'edited', this.mediaDetails(item));
        this.saveData();
        return item;
    }

    removeItem(itemId) {
        const item = this.getItem(itemId);
        if (!item) return;
        this.data.items = this.data.items.filter(existing => existing.id !== itemId);
        this.record(item.id, 'removed', this.mediaDetails(item));
        this.saveData();
    }

    getItem(itemId) { return this.data.items.find(item => item.id === itemId) || null; }
    getItems() { return [...this.data.items]; }
    getHistory() { return [...this.data.history]; }
}

export const bookmarksService = new BookmarksService();
