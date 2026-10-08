import { storageService } from '../../services/storageService.js';
import { generateId } from '../../utilities/uiUtils.js';
import { getCharacter } from './gachaData.js';
import { DEFAULT_MEDIA_SCALE, normalizeMediaPosition, normalizeMediaScale } from '../../utilities/mediaUtils.js';

class GachaService {
    constructor() {
        this.dataKey = 'gacha_registry_data';
        this.loadData();
    }

    loadData() {
        this.data = storageService.load(this.dataKey, { roster: [], targets: [] });
        this.data.roster ||= [];
        this.data.targets ||= [];
    }

    saveData(nextData) {
        const previous = this.data;
        this.data = nextData;
        if (storageService.save(this.dataKey, this.data)) return true;
        this.data = previous;
        return false;
    }

    createRecord(game, characterId, input = {}) {
        const character = getCharacter(game, characterId);
        if (!character) return null;
        return {
            game,
            characterId,
            name: character.name,
            imageUrl: String(input.imageUrl || '').trim(),
            mediaPosition: normalizeMediaPosition(input.mediaPosition),
            mediaScale: normalizeMediaScale(input.mediaScale ?? DEFAULT_MEDIA_SCALE),
            note: String(input.note || '').trim()
        };
    }

    addCharacter(input) {
        const record = this.createRecord(input.game, input.characterId, input);
        if (!record || this.data.roster.some(item => item.game === record.game && item.characterId === record.characterId)) return null;
        const character = { id: generateId(), ...record, addedAt: new Date().toISOString() };
        return this.saveData({ ...this.data, roster: [character, ...this.data.roster] }) ? character : null;
    }

    updateCharacter(id, updates) {
        const current = this.data.roster.find(item => item.id === id);
        if (!current) return null;
        const merged = { ...current, ...updates };
        const record = this.createRecord(merged.game, merged.characterId, merged);
        if (!record) return null;
        if (this.data.roster.some(item => item.id !== id && item.game === record.game && item.characterId === record.characterId)) return null;
        const updated = { ...current, ...record, updatedAt: new Date().toISOString() };
        const roster = this.data.roster.map(item => item.id === id ? updated : item);
        return this.saveData({ ...this.data, roster }) ? updated : null;
    }

    removeCharacter(id) {
        const roster = this.data.roster.filter(item => item.id !== id);
        if (roster.length === this.data.roster.length) return false;
        return this.saveData({ ...this.data, roster });
    }

    addTarget(input) {
        const record = this.createRecord(input.game, input.characterId, input);
        if (!record || this.data.targets.some(item => item.game === record.game && item.characterId === record.characterId)) return null;
        const targetAt = input.targetAt ? new Date(input.targetAt) : null;
        if (targetAt && !Number.isFinite(targetAt.getTime())) return null;
        const target = {
            id: generateId(),
            ...record,
            targetAt: targetAt ? targetAt.toISOString() : null,
            createdAt: new Date().toISOString()
        };
        return this.saveData({ ...this.data, targets: [target, ...this.data.targets] }) ? target : null;
    }

    updateTarget(id, updates) {
        const current = this.data.targets.find(item => item.id === id);
        if (!current) return null;
        const merged = { ...current, ...updates };
        const record = this.createRecord(merged.game, merged.characterId, merged);
        if (!record) return null;
        if (this.data.targets.some(item => item.id !== id && item.game === record.game && item.characterId === record.characterId)) return null;
        const targetDate = Object.hasOwn(updates, 'targetAt') ? updates.targetAt : current.targetAt;
        const targetAt = targetDate ? new Date(targetDate) : null;
        if (targetAt && !Number.isFinite(targetAt.getTime())) return null;
        const updated = { ...current, ...record, targetAt: targetAt ? targetAt.toISOString() : null, updatedAt: new Date().toISOString() };
        const targets = this.data.targets.map(item => item.id === id ? updated : item);
        return this.saveData({ ...this.data, targets }) ? updated : null;
    }

    removeTarget(id) {
        const targets = this.data.targets.filter(item => item.id !== id);
        if (targets.length === this.data.targets.length) return false;
        return this.saveData({ ...this.data, targets });
    }

    moveTargetToRoster(id) {
        const target = this.data.targets.find(item => item.id === id);
        if (!target || this.data.roster.some(item => item.game === target.game && item.characterId === target.characterId)) return false;
        const character = { id: generateId(), game: target.game, characterId: target.characterId, name: target.name, imageUrl: target.imageUrl, mediaPosition: target.mediaPosition, mediaScale: target.mediaScale, note: target.note, addedAt: new Date().toISOString() };
        const targets = this.data.targets.filter(item => item.id !== id);
        return this.saveData({ ...this.data, roster: [character, ...this.data.roster], targets });
    }

    getCharacter(id) { return this.data.roster.find(item => item.id === id) || null; }
    getTarget(id) { return this.data.targets.find(item => item.id === id) || null; }
    getRoster() { return [...this.data.roster]; }
    getTargets() { return [...this.data.targets]; }
}

export const gachaService = new GachaService();