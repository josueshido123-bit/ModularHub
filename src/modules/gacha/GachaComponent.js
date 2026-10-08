import { gachaService } from './gachaService.js';
import { GACHA_CATALOG, GACHA_GAMES, getCharacter, getCharacterArtwork, getGameName } from './gachaData.js';
import { showToast } from '../../utilities/uiUtils.js';
import { bindMediaEditor, DEFAULT_MEDIA_SCALE, ensureMediaScaleControl, mediaStyle, readMediaFile } from '../../utilities/mediaUtils.js';
import { attachCardSizeControl, loadCardSize, renderCardSizeControl } from '../../utilities/cardSizeUtils.js';

export class GachaComponent {
    constructor(state = {}) {
        this.state = { view: 'roster', game: 'all', search: '', formMode: null, editingId: null, ...state };
        this.imageDraft = '';
        this.cardSize = loadCardSize('gacha');
        this.timer = null;
        this.removalObserver = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'gacha-module-content';
        container.innerHTML = this.renderContent();
        this.attachEvents(container);
        this.startCountdowns(container);
        return container;
    }

    renderContent() {
        const roster = gachaService.getRoster();
        const targets = gachaService.getTargets();
        const items = this.state.view === 'roster' ? roster : targets;
        const filtered = items.filter(item => (this.state.game === 'all' || item.game === this.state.game)
            && `${item.name} ${getGameName(item.game)}`.toLowerCase().includes(this.state.search.toLowerCase()));
        const ownedCounts = GACHA_GAMES.map(game => {
            const count = roster.filter(character => character.game === game.id).length;
            return `<span class="gacha-owned-count">${this.escape(game.name)}: <strong>${count}</strong></span>`;
        }).join('');
        return `<div class="gacha-toolbar"><div><span class="gacha-eyebrow">GACHA COLLECTION</span><h3>Character Registry</h3><p aria-label="Owned characters by game and wishlist total">${ownedCounts}<span>${targets.length} wanted</span></p></div><button class="btn btn-primary gacha-add">${this.state.view === 'roster' ? '+ Add character' : '+ Add target'}</button></div><div class="gacha-controls"><div class="gacha-tabs" role="tablist" aria-label="Character lists"><button class="gacha-tab ${this.state.view === 'roster' ? 'active' : ''}" data-view="roster" role="tab" aria-selected="${this.state.view === 'roster'}">My registry <span>${roster.length}</span></button><button class="gacha-tab ${this.state.view === 'targets' ? 'active' : ''}" data-view="targets" role="tab" aria-selected="${this.state.view === 'targets'}">Character wishlist <span>${targets.length}</span></button></div><label class="gacha-search"><span class="sr-only">Search characters</span><input class="gacha-search-input" type="search" value="${this.escape(this.state.search)}" placeholder="Search characters"></label></div><div class="gacha-game-filters" role="group" aria-label="Filter by game">${[['all', 'All games'], ...GACHA_GAMES.map(game => [game.id, game.name])].map(([id, name]) => `<button class="gacha-game-filter ${this.state.game === id ? 'active' : ''}" data-game="${id}" aria-pressed="${this.state.game === id}">${this.escape(name)}</button>`).join('')}</div><div class="gacha-list-heading"><span>${this.state.view === 'roster' ? 'CHARACTER ROSTER' : 'WISH LIST & ARRIVAL COUNTDOWNS'}</span><span>${filtered.length} ${filtered.length === 1 ? 'character' : 'characters'}</span>${renderCardSizeControl(this.cardSize)}</div><div class="gacha-character-grid">${filtered.map(item => this.state.view === 'roster' ? this.renderCharacterCard(item) : this.renderTargetCard(item)).join('') || `<div class="gacha-empty">${this.state.view === 'roster' ? 'Your registry is empty. Add a character from either game to get started.' : 'No characters on your wish list yet. Plan who you want next.'}</div>`}</div>${this.state.formMode ? this.renderForm() : ''}`;
    }

    renderCharacterCard(item) {
        const imageUrl = item.imageUrl || getCharacterArtwork(item.game, item.characterId);
        return `<article class="gacha-character-card" data-record-id="${this.escape(item.id)}"><div class="gacha-card-art">${this.renderArt(imageUrl, item.name, item.mediaPosition, item.mediaScale)}</div><div class="gacha-card-copy"><span class="gacha-game-label game-${item.game}">${this.escape(getGameName(item.game))}</span><h4>${this.escape(item.name)}</h4>${item.note ? `<p>${this.escape(item.note)}</p>` : '<p class="gacha-card-note">In your registry</p>'}</div><div class="gacha-card-actions"><button class="btn btn-sm btn-secondary gacha-edit" aria-label="Edit ${this.escape(item.name)}">Edit</button><button class="btn btn-sm btn-secondary gacha-remove" aria-label="Remove ${this.escape(item.name)}">Remove</button></div></article>`;
    }

    renderTargetCard(item) {
        const imageUrl = item.imageUrl || getCharacterArtwork(item.game, item.characterId);
        return `<article class="gacha-character-card gacha-target-card" data-target-id="${this.escape(item.id)}"><div class="gacha-card-art">${this.renderArt(imageUrl, item.name, item.mediaPosition, item.mediaScale)}</div><div class="gacha-card-copy"><span class="gacha-game-label game-${item.game}">${this.escape(getGameName(item.game))}</span><h4>${this.escape(item.name)}</h4>${item.note ? `<p>${this.escape(item.note)}</p>` : '<p class="gacha-card-note">On your wish list</p>'}${item.targetAt ? this.renderTimer(item.targetAt) : '<p class="gacha-no-date">No arrival date set</p>'}</div><div class="gacha-card-actions"><button class="btn btn-sm btn-secondary gacha-edit-target" aria-label="Edit ${this.escape(item.name)} target">Edit</button><button class="btn btn-sm btn-primary gacha-obtained" aria-label="Move ${this.escape(item.name)} to registry">Got them</button><button class="btn btn-sm btn-secondary gacha-remove-target" aria-label="Remove ${this.escape(item.name)} target">Remove</button></div></article>`;
    }

    renderArt(imageUrl, name, position = '50% 50%', scale = DEFAULT_MEDIA_SCALE) {
        if (!imageUrl) return `<div class="gacha-art-fallback">${this.escape(this.initials(name))}</div>`;
        return `<img class="gacha-art-image" src="${this.escape(imageUrl)}" alt="${this.escape(name)}" loading="lazy" data-initials="${this.escape(this.initials(name))}" style="${mediaStyle(position, 'card', scale)}">`;
    }

    renderTimer(targetAt) {
        return `<div class="gacha-target-timer" data-target-timer data-target="${new Date(targetAt).getTime()}"><span class="gacha-timer-label">TIME UNTIL TARGET</span><div class="gacha-timer-units"><span><strong data-unit="days">00</strong><small>days</small></span><span><strong data-unit="hours">00</strong><small>hrs</small></span><span><strong data-unit="minutes">00</strong><small>min</small></span><span><strong data-unit="seconds">00</strong><small>sec</small></span></div></div>`;
    }

    renderForm() {
        const targetMode = this.state.formMode.startsWith('target');
        const editing = this.state.formMode.endsWith('edit');
        const record = editing ? targetMode ? gachaService.getTarget(this.state.editingId) : gachaService.getCharacter(this.state.editingId) : null;
        const game = record?.game || (this.state.game === 'all' ? 'genshin' : this.state.game);
        const characterId = record?.characterId || GACHA_CATALOG[game][0]?.id || '';
        const character = getCharacter(game, characterId);
        const imageUrl = this.imageDraft || record?.imageUrl || '';
        const previewUrl = imageUrl || getCharacterArtwork(game, characterId);
        const position = record?.mediaPosition || '50% 50%';
        const scale = record?.mediaScale ?? DEFAULT_MEDIA_SCALE;
        return `<div class="gacha-form-overlay"><section class="gacha-form-panel" role="dialog" aria-modal="true" aria-labelledby="gacha-form-title"><header class="gacha-form-header"><div><span class="gacha-eyebrow">${targetMode ? 'PLAN YOUR NEXT PULL' : 'BUILD YOUR COLLECTION'}</span><h2 id="gacha-form-title">${targetMode ? editing ? 'Edit wishlist target' : 'Wishlist a character' : editing ? 'Edit registry entry' : 'Add a character'}</h2></div><button class="gacha-form-close" type="button" aria-label="Close">×</button></header><form class="gacha-form"><label class="gacha-field">Game<select name="game">${GACHA_GAMES.map(option => `<option value="${option.id}" ${game === option.id ? 'selected' : ''}>${this.escape(option.name)}</option>`).join('')}</select></label><label class="gacha-field">Character<select name="characterId">${this.renderCharacterOptions(game, characterId)}</select></label><div class="gacha-preview-wrap"><div class="gacha-form-preview" data-position="${this.escape(position)}" data-scale="${scale}">${this.renderArt(previewUrl, character?.name || 'Character artwork', position, scale)}</div><span>Automatic character artwork</span></div><div class="gacha-art-controls"><label class="gacha-field">Custom image URL<input name="imageUrl" type="text" value="${this.escape(imageUrl)}" placeholder="Optional image URL"></label><label class="btn btn-secondary gacha-upload-label">Upload image<input class="gacha-image-file" type="file" accept="image/*"></label><button class="btn btn-sm btn-secondary gacha-reset-art" type="button">Use game artwork</button></div>${targetMode ? `<label class="gacha-field">Target date and time <span>optional</span><input name="targetAt" type="datetime-local" value="${record?.targetAt ? this.toLocalInputValue(record.targetAt) : ''}"></label>` : ''}<label class="gacha-field">Note <span>optional</span><textarea name="note" rows="3" maxlength="240" placeholder="Add a note">${this.escape(record?.note || '')}</textarea></label><div class="gacha-form-actions"><button class="btn btn-secondary gacha-cancel" type="button">Cancel</button><button class="btn btn-primary" type="submit">${targetMode ? editing ? 'Save target' : 'Add to wishlist' : editing ? 'Save changes' : 'Add to registry'}</button></div></form></section></div>`;
    }

    renderCharacterOptions(game, selectedId) {
        return GACHA_CATALOG[game].map(character => `<option value="${character.id}" ${character.id === selectedId ? 'selected' : ''}>${this.escape(character.name)}</option>`).join('');
    }

    attachEvents(container) {
        attachCardSizeControl(container, 'gacha', this.cardSize, size => { this.cardSize = size; });
        container.querySelector('.gacha-add')?.addEventListener('click', () => this.openForm(container, this.state.view === 'roster' ? 'roster-add' : 'target-add'));
        container.querySelectorAll('.gacha-tab').forEach(button => button.addEventListener('click', () => {
            this.state.view = button.dataset.view;
            this.state.search = '';
            this.rerender(container);
        }));
        container.querySelectorAll('.gacha-game-filter').forEach(button => button.addEventListener('click', () => {
            this.state.game = button.dataset.game;
            this.rerender(container);
        }));
        container.querySelector('.gacha-search-input')?.addEventListener('input', event => {
            this.state.search = event.target.value;
            const cursor = event.target.selectionStart;
            this.rerender(container);
            const search = container.querySelector('.gacha-search-input');
            search.focus();
            search.setSelectionRange(cursor, cursor);
        });
        container.querySelectorAll('.gacha-edit').forEach(button => button.addEventListener('click', event => this.openForm(container, 'roster-edit', event.currentTarget.closest('[data-record-id]').dataset.recordId)));
        container.querySelectorAll('.gacha-edit-target').forEach(button => button.addEventListener('click', event => this.openForm(container, 'target-edit', event.currentTarget.closest('[data-target-id]').dataset.targetId)));
        container.querySelectorAll('.gacha-remove').forEach(button => button.addEventListener('click', event => this.removeCharacter(container, event.currentTarget.closest('[data-record-id]').dataset.recordId)));
        container.querySelectorAll('.gacha-remove-target').forEach(button => button.addEventListener('click', event => this.removeTarget(container, event.currentTarget.closest('[data-target-id]').dataset.targetId)));
        container.querySelectorAll('.gacha-obtained').forEach(button => button.addEventListener('click', event => this.moveTargetToRoster(container, event.currentTarget.closest('[data-target-id]').dataset.targetId)));
        container.querySelector('.gacha-form-close')?.addEventListener('click', () => this.closeForm(container));
        container.querySelector('.gacha-cancel')?.addEventListener('click', () => this.closeForm(container));
        container.querySelector('.gacha-form-overlay')?.addEventListener('click', event => { if (event.target === event.currentTarget) this.closeForm(container); });
        container.querySelector('.gacha-form select[name="game"]')?.addEventListener('change', () => {
            this.imageDraft = '';
            const form = container.querySelector('.gacha-form');
            form.querySelector('select[name="characterId"]').innerHTML = this.renderCharacterOptions(form.querySelector('[name="game"]').value, '');
            form.querySelector('[name="imageUrl"]').value = '';
            form.querySelector('[name="mediaPosition"]').value = '50% 50%';
            form.querySelector('[name="mediaScale"]').value = String(DEFAULT_MEDIA_SCALE);
            form.querySelector('.media-scale-value').value = `${Math.round(DEFAULT_MEDIA_SCALE * 100)}%`;
            this.updateFormPreview(container);
        });
        container.querySelector('.gacha-form select[name="characterId"]')?.addEventListener('change', () => {
            this.imageDraft = '';
            const form = container.querySelector('.gacha-form');
            form.querySelector('[name="imageUrl"]').value = '';
            form.querySelector('[name="mediaPosition"]').value = '50% 50%';
            form.querySelector('[name="mediaScale"]').value = String(DEFAULT_MEDIA_SCALE);
            form.querySelector('.media-scale-value').value = `${Math.round(DEFAULT_MEDIA_SCALE * 100)}%`;
            this.updateFormPreview(container);
        });
        container.querySelector('.gacha-form input[name="imageUrl"]')?.addEventListener('input', event => {
            this.imageDraft = event.target.value.trim();
            this.updateFormPreview(container);
        });
        container.querySelector('.gacha-image-file')?.addEventListener('change', event => this.handleImageFile(event, container));
        container.querySelector('.gacha-reset-art')?.addEventListener('click', () => {
            this.imageDraft = '';
            const form = container.querySelector('.gacha-form');
            form.querySelector('[name="imageUrl"]').value = '';
            form.querySelector('[name="mediaPosition"]').value = '50% 50%';
            form.querySelector('[name="mediaScale"]').value = String(DEFAULT_MEDIA_SCALE);
            form.querySelector('.media-scale-value').value = `${Math.round(DEFAULT_MEDIA_SCALE * 100)}%`;
            this.updateFormPreview(container);
        });
        this.setupMediaEditor(container);
        container.querySelector('.gacha-form')?.addEventListener('submit', event => this.saveForm(event, container));
        this.attachImageFallbacks(container);
        this.updateCountdowns(container);
    }

    openForm(container, mode, id = null) {
        this.state.formMode = mode;
        this.state.editingId = id;
        this.imageDraft = '';
        this.rerender(container);
        container.querySelector('.gacha-form [name="game"]')?.focus();
    }

    closeForm(container) {
        this.state.formMode = null;
        this.state.editingId = null;
        this.imageDraft = '';
        this.rerender(container);
    }

    saveForm(event, container) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());
        const imageUrl = String(data.imageUrl || '').trim();
        if (imageUrl && !imageUrl.startsWith('data:image/')) {
            try {
                const url = new URL(imageUrl);
                if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported image URL');
            } catch {
                showToast('Enter a valid image URL or choose an image file.', 'error');
                return;
            }
        }
        const targetMode = this.state.formMode.startsWith('target');
        const editing = this.state.formMode.endsWith('edit');
        const record = targetMode
            ? editing ? gachaService.updateTarget(this.state.editingId, data) : gachaService.addTarget(data)
            : editing ? gachaService.updateCharacter(this.state.editingId, data) : gachaService.addCharacter(data);
        if (!record) {
            showToast('That character is already on this list, or the entry could not be saved.', 'error');
            return;
        }
        showToast(targetMode ? editing ? 'Wishlist target updated' : 'Character added to wishlist' : editing ? 'Registry entry updated' : 'Character added to registry', 'success');
        this.state.formMode = null;
        this.state.editingId = null;
        this.imageDraft = '';
        this.rerender(container);
    }

    handleImageFile(event, container) {
        const file = event.target.files[0];
        if (!file) return;
        readMediaFile(file).then(url => {
            const form = container.querySelector('.gacha-form');
            if (!form) return;
            this.imageDraft = url;
            form.querySelector('[name="imageUrl"]').value = this.imageDraft;
            form.querySelector('[name="mediaPosition"]').value = '50% 50%';
            form.querySelector('[name="mediaScale"]').value = String(DEFAULT_MEDIA_SCALE);
            form.querySelector('.media-scale-value').value = `${Math.round(DEFAULT_MEDIA_SCALE * 100)}%`;
            this.updateFormPreview(container);
        }).catch(error => showToast(error.message, 'error'));
    }

    updateFormPreview(container) {
        const form = container.querySelector('.gacha-form');
        const game = form.querySelector('[name="game"]').value;
        const character = getCharacter(game, form.querySelector('[name="characterId"]').value);
        const imageUrl = this.imageDraft || form.querySelector('[name="imageUrl"]').value.trim() || getCharacterArtwork(game, character?.id);
        const position = form.querySelector('[name="mediaPosition"]')?.value || '50% 50%';
        const scale = Number(form.querySelector('[name="mediaScale"]')?.value) || DEFAULT_MEDIA_SCALE;
        const preview = container.querySelector('.gacha-form-preview');
        preview.dataset.position = position;
        preview.dataset.scale = String(scale);
        preview.innerHTML = this.renderArt(imageUrl, character?.name || 'Character artwork', position, scale);
        this.attachImageFallbacks(preview);
        this.setupMediaEditor(container);
    }

    setupMediaEditor(container) {
        const editor = container.querySelector('.gacha-form-preview');
        if (!editor) return;
        const record = this.state.editingId
            ? this.state.formMode.startsWith('target') ? gachaService.getTarget(this.state.editingId) : gachaService.getCharacter(this.state.editingId)
            : null;
        const controls = ensureMediaScaleControl(container, editor, record?.mediaScale ?? DEFAULT_MEDIA_SCALE);
        if (controls) bindMediaEditor(editor, controls.positionInput, controls.scaleInput, controls.scaleOutput);
    }

    removeCharacter(container, id) {
        const character = gachaService.getCharacter(id);
        if (!character || !confirm(`Remove ${character.name} from your registry?`)) return;
        if (!gachaService.removeCharacter(id)) {
            showToast('Character could not be removed.', 'error');
            return;
        }
        this.rerender(container);
    }

    removeTarget(container, id) {
        const target = gachaService.getTarget(id);
        if (!target || !confirm(`Remove ${target.name} from your character wishlist?`)) return;
        if (!gachaService.removeTarget(id)) {
            showToast('Wishlist target could not be removed.', 'error');
            return;
        }
        this.rerender(container);
    }

    moveTargetToRoster(container, id) {
        if (!gachaService.moveTargetToRoster(id)) {
            showToast('This character may already be in your registry.', 'info');
            return;
        }
        showToast('Character moved to your registry', 'success');
        this.rerender(container);
    }

    attachImageFallbacks(container) {
        container.querySelectorAll('.gacha-art-image').forEach(image => image.addEventListener('error', () => {
            const fallback = document.createElement('div');
            fallback.className = 'gacha-art-fallback';
            fallback.textContent = image.dataset.initials || '✦';
            image.replaceWith(fallback);
        }, { once: true }));
    }

    startCountdowns(container) {
        const update = () => this.updateCountdowns(container);
        update();
        this.timer = setInterval(update, 1000);
        this.removalObserver = new MutationObserver(() => {
            if (container.isConnected) return;
            clearInterval(this.timer);
            this.removalObserver.disconnect();
        });
        this.removalObserver.observe(document.body, { childList: true, subtree: true });
    }

    updateCountdowns(container) {
        container.querySelectorAll('[data-target-timer]').forEach(timer => {
            const target = Number(timer.dataset.target);
            const remaining = Math.max(0, target - Date.now());
            const seconds = Math.floor(remaining / 1000);
            const values = { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 };
            Object.entries(values).forEach(([unit, value]) => {
                const output = timer.querySelector(`[data-unit="${unit}"]`);
                if (output) output.textContent = String(value).padStart(2, '0');
            });
            timer.classList.toggle('is-ended', target <= Date.now());
            const label = timer.querySelector('.gacha-timer-label');
            if (label) label.textContent = target <= Date.now() ? 'TARGET DATE REACHED' : 'TIME UNTIL TARGET';
        });
    }

    rerender(container) {
        container.innerHTML = this.renderContent();
        this.attachEvents(container);
    }

    toLocalInputValue(value) {
        const date = new Date(value);
        const pad = number => String(number).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    initials(name) { return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }

    escape(value) {
        return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    }
}