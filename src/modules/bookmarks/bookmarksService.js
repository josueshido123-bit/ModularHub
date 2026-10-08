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
        const history = this.data.history.slice(0, 100).map(entry => {
            if (!entry.details?.mediaUrl) return entry;
            return { ...entry, details: { ...entry.details, mediaUrl: '' } };
        });
        if (history.length !== this.data.history.length || history.some((entry, index) => entry !== this.data.history[index])) {
            this.data.history = history;
            storageService.save(this.dataKey, this.data);
        }
    }

    saveData() { return storageService.save(this.dataKey, this.data); }
    mediaDetails(item) { return { name: item.name, mediaType: item.mediaType }; }
    record(itemId, action, details) { this.data.history.unshift({ id: generateId(), itemId, action, details, date: new Date().toISOString() }); this.data.history.length = Math.min(this.data.history.length, 100); }

    addItem(input) {
        const item = { id: generateId(), name: input.name.trim(), url: input.url.trim(), mediaUrl: input.mediaUrl || '', mediaType: input.mediaType || 'image', mediaPosition: normalizeMediaPosition(input.mediaPosition), mediaScale: normalizeMediaScale(input.mediaScale ?? DEFAULT_MEDIA_SCALE), description: input.description || '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        const previousHistory = this.data.history.slice();
        this.data.items.unshift(item);
        this.record(item.id, 'added', this.mediaDetails(item));
        if (this.saveData()) return item;
        this.data.items = this.data.items.filter(existing => existing.id !== item.id);
        this.data.history = previousHistory;
        return null;
    }

    updateItem(itemId, updates) {
        const item = this.getItem(itemId);
        if (!item) return null;
        const previousItem = { ...item };
        const previousHistory = this.data.history.slice();
        Object.assign(item, updates, { mediaPosition: normalizeMediaPosition(updates.mediaPosition ?? item.mediaPosition), mediaScale: normalizeMediaScale(updates.mediaScale ?? item.mediaScale), updatedAt: new Date().toISOString() });
        this.record(item.id, 'edited', this.mediaDetails(item));
        if (this.saveData()) return item;
        Object.assign(item, previousItem);
        this.data.history = previousHistory;
        return null;
    }

    removeItem(itemId) {
        const item = this.getItem(itemId);
        if (!item) return false;
        const previousItems = this.data.items;
        const previousHistory = this.data.history.slice();
        this.data.items = this.data.items.filter(existing => existing.id !== itemId);
        this.record(item.id, 'removed', this.mediaDetails(item));
        if (this.saveData()) return true;
        this.data.items = previousItems;
        this.data.history = previousHistory;
        return false;
    }

    getItem(itemId) { return this.data.items.find(item => item.id === itemId) || null; }
    getItems() { return [...this.data.items]; }
    getHistory() { return [...this.data.history]; }
}

export const bookmarksService = new BookmarksService();
