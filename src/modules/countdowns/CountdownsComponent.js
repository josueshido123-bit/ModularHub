import { countdownsService } from './countdownsService.js';
import { showToast } from '../../utilities/uiUtils.js';
import { bindMediaEditor, DEFAULT_MEDIA_SCALE, ensureMediaScaleControl, mediaStyle as getMediaStyle, mediaTransform as getMediaTransform, readMediaFile } from '../../utilities/mediaUtils.js';

export class CountdownsComponent {
    constructor(state = {}) {
        this.state = { filter: 'upcoming', editingId: null, formOpen: false, ...state };
        this.mediaDraft = {};
        this.timer = null;
        this.removalObserver = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'countdowns-module-content';
        container.innerHTML = this.renderContent();
        this.attachEvents(container);
        this.startTicker(container);
        return container;
    }

    renderContent() {
        const items = countdownsService.getCountdowns();
        const now = Date.now();
        const upcoming = items.filter(item => new Date(item.targetAt).getTime() > now).sort((a, b) => new Date(a.targetAt) - new Date(b.targetAt));
        const past = items.filter(item => new Date(item.targetAt).getTime() <= now).sort((a, b) => new Date(b.targetAt) - new Date(a.targetAt));
        const filtered = this.state.filter === 'past' ? past : this.state.filter === 'all' ? [...upcoming, ...past] : upcoming;
        const featured = upcoming[0];
        const featuredMedia = featured ? this.renderMedia(featured, 'featured') : '';

        return `<div class="countdowns-toolbar"><div><span class="countdowns-eyebrow">MARK THE MOMENT</span><h3>Your next chapter</h3></div><button class="btn btn-primary countdowns-add">+ New countdown</button></div><section class="countdowns-featured ${featuredMedia ? 'has-media' : ''}">${featured ? `${featuredMedia ? `<div class="countdowns-featured-media">${featuredMedia}</div>` : ''}<div class="countdowns-featured-copy"><span class="countdowns-featured-label">NEXT UP</span><h2>${this.escape(featured.title)}</h2><time>${this.formatDate(featured.targetAt)}</time>${featured.note ? `<p>${this.escape(featured.note)}</p>` : ''}</div><div class="countdowns-featured-clock">${this.renderTimer(featured.targetAt)}</div>` : '<div class="countdowns-featured-empty"><span class="countdowns-featured-label">NEXT UP</span><h2>No upcoming moments</h2><p>Add a date to start the countdown.</p></div>'}</section><div class="countdowns-list-toolbar"><div class="countdowns-filters" role="group" aria-label="Filter countdowns"><button class="countdowns-filter ${this.state.filter === 'upcoming' ? 'active' : ''}" data-filter="upcoming" aria-pressed="${this.state.filter === 'upcoming'}">Upcoming <span>${upcoming.length}</span></button><button class="countdowns-filter ${this.state.filter === 'past' ? 'active' : ''}" data-filter="past" aria-pressed="${this.state.filter === 'past'}">Past <span>${past.length}</span></button><button class="countdowns-filter ${this.state.filter === 'all' ? 'active' : ''}" data-filter="all" aria-pressed="${this.state.filter === 'all'}">All <span>${items.length}</span></button></div><span class="countdowns-list-caption">${filtered.length} ${filtered.length === 1 ? 'moment' : 'moments'}</span></div><div class="countdowns-list">${filtered.map(item => this.renderCard(item, now)).join('') || `<div class="countdowns-empty">${this.state.filter === 'past' ? 'No moments have passed yet.' : 'Nothing on the horizon. Add a countdown to begin.'}</div>`}</div>${this.state.formOpen ? this.renderForm() : ''}`;
    }

    renderCard(item, now) {
        const isPast = new Date(item.targetAt).getTime() <= now;
        const media = this.renderMedia(item, 'card');
        return `<article class="countdowns-card ${isPast ? 'is-past' : ''} ${media ? 'has-media' : ''}" data-countdown-id="${this.escape(item.id)}">${media ? `<div class="countdowns-card-media">${media}</div>` : ''}<div class="countdowns-card-copy"><span class="countdowns-card-date">${this.formatDate(item.targetAt)}</span><h3>${this.escape(item.title)}</h3>${item.note ? `<p>${this.escape(item.note)}</p>` : ''}</div><div class="countdowns-card-timer">${this.renderTimer(item.targetAt)}</div><div class="countdowns-card-actions"><button class="btn btn-sm btn-secondary countdowns-edit" aria-label="Edit ${this.escape(item.title)}">Edit</button><button class="btn btn-sm btn-secondary countdowns-delete" aria-label="Delete ${this.escape(item.title)}">Delete</button></div></article>`;
    }

    renderMedia(item, size) {
        if (!item?.mediaUrl) return '';
        const url = this.escape(item.mediaUrl);
        const name = this.escape(item.title || 'Countdown media');
        const position = this.escape(item.mediaPosition || '50% 50%');
        const scale = item.mediaScale ?? DEFAULT_MEDIA_SCALE;
        const hoverMedia = item.mediaType === 'video' || item.mediaType === 'gif' || /\.gif(?:$|[?#])/i.test(item.mediaUrl);
        if (hoverMedia) {
            const type = item.mediaType === 'video' ? 'video' : 'gif';
            return `<div class="countdowns-media-frame countdowns-hover-media ${size}" data-media-url="${url}" data-media-type="${type}" data-media-position="${position}" data-media-scale="${scale}" data-media-alt="${name}" role="img" aria-label="Preview ${name}" tabindex="0">${type === 'video' ? '▶' : 'GIF'}</div>`;
        }
        return `<img class="countdowns-media-image ${size}" src="${url}" alt="${name}" loading="lazy" style="${this.mediaStyle(position, size, scale)}">`;
    }

    mediaStyle(position, size = 'card', scale = DEFAULT_MEDIA_SCALE) { return getMediaStyle(position, size, scale); }

    mediaTransform(x, y, scale = DEFAULT_MEDIA_SCALE) { return getMediaTransform(`${x}% ${y}%`, scale); }

    renderTimer(targetAt) {
        const elapsed = new Date(targetAt).getTime() <= Date.now();
        return `<div class="countdowns-timer ${elapsed ? 'is-expired' : ''}" data-countdown-timer data-target="${new Date(targetAt).getTime()}"><span class="countdowns-timer-state">${elapsed ? 'TIME REACHED' : 'TIME LEFT'}</span><div class="countdowns-units"><div><strong data-unit="days">00</strong><span>days</span></div><div><strong data-unit="hours">00</strong><span>hrs</span></div><div><strong data-unit="minutes">00</strong><span>min</span></div><div><strong data-unit="seconds">00</strong><span>sec</span></div></div></div>`;
    }

    renderForm() {
        const item = this.state.editingId ? countdownsService.getCountdown(this.state.editingId) : null;
        const position = this.mediaDraft.position || item?.mediaPosition || '50% 50%';
        const mediaType = this.mediaDraft.type || item?.mediaType || 'image';
        return `<div class="countdowns-form-overlay"><section class="countdowns-form-panel" role="dialog" aria-modal="true" aria-labelledby="countdowns-form-title"><div class="countdowns-form-heading"><div><span class="countdowns-eyebrow">A DATE TO REMEMBER</span><h2 id="countdowns-form-title">${item ? 'Edit countdown' : 'New countdown'}</h2></div><button class="countdowns-form-close" type="button" aria-label="Close">×</button></div><form class="countdowns-form"><label class="countdowns-field">Title<input name="title" maxlength="80" required value="${this.escape(item?.title || '')}" placeholder="Summer trip, launch day..."></label><label class="countdowns-field">Date and time<input name="targetAt" type="datetime-local" required value="${item ? this.toLocalInputValue(item.targetAt) : ''}"></label><label class="countdowns-field">Note <span>optional</span><textarea name="note" maxlength="240" rows="3" placeholder="What makes this moment special?">${this.escape(item?.note || '')}</textarea></label><div class="countdowns-media-fields"><span class="countdowns-media-label">Countdown media <span>optional</span></span><label class="btn btn-secondary countdowns-file-label">Choose file<input class="countdowns-media-file" type="file" accept="image/*,video/*"></label><div class="countdowns-media-editor" data-position="${this.escape(position)}">${this.renderEditorMedia(item)}</div><small>Drag the preview to choose its crop position.</small><div class="countdowns-media-inputs"><label class="countdowns-field">Media URL<input name="mediaUrl" type="url" value="${this.escape(this.mediaDraft.url || item?.mediaUrl || '')}" placeholder="Paste an image, GIF, or video URL"></label><label class="countdowns-field">Media type<select name="mediaType"><option value="image" ${mediaType === 'image' ? 'selected' : ''}>Image</option><option value="gif" ${mediaType === 'gif' ? 'selected' : ''}>GIF</option><option value="video" ${mediaType === 'video' ? 'selected' : ''}>Video</option></select></label></div><input name="mediaPosition" type="hidden" value="${this.escape(position)}"></div><div class="countdowns-form-actions"><button class="btn btn-secondary countdowns-cancel" type="button">Cancel</button><button class="btn btn-primary" type="submit">${item ? 'Save changes' : 'Create countdown'}</button></div></form></section></div>`;
    }

    renderEditorMedia(item) {
        const mediaUrl = this.mediaDraft.url || item?.mediaUrl || '';
        const mediaType = this.mediaDraft.type || item?.mediaType || 'image';
        const position = this.mediaDraft.position || item?.mediaPosition || '50% 50%';
        const scale = this.mediaDraft.scale ?? item?.mediaScale ?? DEFAULT_MEDIA_SCALE;
        if (!mediaUrl) return '<div class="countdowns-upload-empty">Choose an image, GIF, or video to preview it here</div>';
        const tag = mediaType === 'video' ? 'video' : 'img';
        const attributes = tag === 'video' ? 'muted playsinline' : `alt="${this.escape(item?.title || 'Countdown media')}"`;
        return `<${tag} src="${this.escape(mediaUrl)}" ${attributes} style="${this.mediaStyle(position, 'editor', scale)}"></${tag}>`;
    }

    attachEvents(container) {
        container.querySelector('.countdowns-add')?.addEventListener('click', () => this.openForm(container));
        container.querySelectorAll('.countdowns-filter').forEach(button => button.addEventListener('click', () => {
            this.state.filter = button.dataset.filter;
            this.rerender(container);
        }));
        container.querySelectorAll('.countdowns-edit').forEach(button => button.addEventListener('click', event => {
            this.state.editingId = event.currentTarget.closest('[data-countdown-id]').dataset.countdownId;
            this.state.formOpen = true;
            this.mediaDraft = {};
            this.rerender(container);
            container.querySelector('.countdowns-form [name="title"]')?.focus();
        }));
        container.querySelectorAll('.countdowns-delete').forEach(button => button.addEventListener('click', event => {
            const card = event.currentTarget.closest('[data-countdown-id]');
            if (!confirm(`Delete “${card.querySelector('h3').textContent}”?`)) return;
            if (!countdownsService.removeCountdown(card.dataset.countdownId)) {
                showToast('Countdown could not be deleted. Your changes were not saved.', 'error');
                return;
            }
            showToast('Countdown deleted', 'success');
            this.rerender(container);
        }));
        container.querySelector('.countdowns-form-close')?.addEventListener('click', () => this.closeForm(container));
        container.querySelector('.countdowns-cancel')?.addEventListener('click', () => this.closeForm(container));
        container.querySelector('.countdowns-form-overlay')?.addEventListener('click', event => {
            if (event.target === event.currentTarget) this.closeForm(container);
        });
        container.querySelector('.countdowns-media-file')?.addEventListener('change', event => this.handleMediaFile(event, container));
        container.querySelector('.countdowns-form input[name="mediaUrl"]')?.addEventListener('input', () => this.updateMediaPreview(container));
        container.querySelector('.countdowns-form select[name="mediaType"]')?.addEventListener('change', () => this.updateMediaPreview(container));
        this.setupMediaEditor(container);
        this.mediaEvents(container);
        container.querySelector('.countdowns-form')?.addEventListener('submit', event => this.saveCountdown(event, container));
    }

    openForm(container) {
        this.state.editingId = null;
        this.state.formOpen = true;
        this.mediaDraft = {};
        this.rerender(container);
        container.querySelector('.countdowns-form [name="title"]')?.focus();
    }

    closeForm(container) {
        this.state.editingId = null;
        this.state.formOpen = false;
        this.mediaDraft = {};
        this.rerender(container);
    }

    saveCountdown(event, container) {
        event.preventDefault();
        const input = Object.fromEntries(new FormData(event.currentTarget).entries());
        const editing = Boolean(this.state.editingId);
        const countdown = editing
            ? countdownsService.updateCountdown(this.state.editingId, input)
            : countdownsService.addCountdown(input);
        if (!countdown) {
            showToast('Countdown could not be saved. Your changes were not saved.', 'error');
            return;
        }
        this.state.formOpen = false;
        this.state.editingId = null;
        this.mediaDraft = {};
        showToast(editing ? 'Countdown updated' : 'Countdown created', 'success');
        this.rerender(container);
    }

    handleMediaFile(event, container) {
        const file = event.target.files[0];
        if (!file) return;
        readMediaFile(file).then(url => {
            const form = container.querySelector('.countdowns-form');
            if (!form) return;
            const type = file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image';
            this.mediaDraft = { url, type, position: '50% 50%', scale: DEFAULT_MEDIA_SCALE };
            form.querySelector('input[name="mediaUrl"]').value = this.mediaDraft.url;
            form.querySelector('select[name="mediaType"]').value = type;
            form.querySelector('input[name="mediaPosition"]').value = this.mediaDraft.position;
            form.querySelector('input[name="mediaScale"]').value = String(this.mediaDraft.scale);
            form.querySelector('.media-scale-value').value = `${Math.round(this.mediaDraft.scale * 100)}%`;
            this.renderMediaEditor(container);
        }).catch(error => showToast(error.message, 'error'));
    }

    updateMediaPreview(container) {
        const form = container.querySelector('.countdowns-form');
        this.mediaDraft = {
            url: form.querySelector('input[name="mediaUrl"]').value.trim(),
            type: form.querySelector('select[name="mediaType"]').value,
            position: form.querySelector('input[name="mediaPosition"]').value || '50% 50%',
            scale: Number(form.querySelector('input[name="mediaScale"]')?.value) || DEFAULT_MEDIA_SCALE
        };
        this.renderMediaEditor(container);
    }

    renderMediaEditor(container) {
        const currentEditor = container.querySelector('.countdowns-media-editor');
        if (!currentEditor) return;
        const editor = currentEditor.cloneNode(false);
        editor.removeAttribute('data-bound');
        editor.dataset.position = this.mediaDraft.position || '50% 50%';
        editor.dataset.scale = String(this.mediaDraft.scale ?? DEFAULT_MEDIA_SCALE);
        editor.innerHTML = this.renderEditorMedia({ title: container.querySelector('.countdowns-form input[name="title"]').value });
        currentEditor.replaceWith(editor);
        this.setupMediaEditor(container);
    }

    setupMediaEditor(container) {
        const editor = container.querySelector('.countdowns-media-editor');
        if (!editor) return;
        const item = this.state.editingId ? countdownsService.getCountdown(this.state.editingId) : null;
        const controls = ensureMediaScaleControl(container, editor, this.mediaDraft.scale ?? item?.mediaScale ?? DEFAULT_MEDIA_SCALE);
        if (!controls) return;
        bindMediaEditor(editor, controls.positionInput, controls.scaleInput, controls.scaleOutput);
        if (controls.scaleInput.dataset.countdownsDraftBound !== 'true') {
            controls.scaleInput.dataset.countdownsDraftBound = 'true';
            controls.scaleInput.addEventListener('input', () => { this.mediaDraft.scale = Number(controls.scaleInput.value); });
        }
    }

    activateHoverMedia(placeholder) {
        if (placeholder.querySelector('img, video')) return;
        const media = document.createElement(placeholder.dataset.mediaType === 'video' ? 'video' : 'img');
        media.src = placeholder.dataset.mediaUrl;
        media.alt = placeholder.dataset.mediaAlt || '';
        media.style.cssText = this.mediaStyle(placeholder.dataset.mediaPosition || '50% 50%', placeholder.classList.contains('featured') ? 'featured' : 'card', placeholder.dataset.mediaScale ?? DEFAULT_MEDIA_SCALE);
        if (media.tagName === 'VIDEO') {
            media.muted = true;
            media.loop = true;
            media.autoplay = true;
            media.playsInline = true;
            media.preload = 'none';
            media.play().catch(() => {});
        }
        placeholder.replaceChildren(media);
        placeholder.classList.add('is-playing');
    }

    deactivateHoverMedia(placeholder) {
        const media = placeholder.querySelector('video');
        if (media) media.pause();
        placeholder.textContent = placeholder.dataset.mediaType === 'video' ? '▶' : 'GIF';
        placeholder.classList.remove('is-playing');
    }

    mediaEvents(container) {
        container.querySelectorAll('.countdowns-hover-media').forEach(media => {
            media.addEventListener('mouseenter', () => this.activateHoverMedia(media));
            media.addEventListener('mouseleave', () => this.deactivateHoverMedia(media));
            media.addEventListener('focus', () => this.activateHoverMedia(media));
            media.addEventListener('blur', () => this.deactivateHoverMedia(media));
        });
    }

    startTicker(container) {
        const update = () => {
            const now = Date.now();
            const crossedTarget = [...container.querySelectorAll('[data-countdown-timer]')].some(timer => timer.classList.contains('is-expired') !== (Number(timer.dataset.target) <= now));
            if (crossedTarget) {
                this.rerender(container);
                update();
                return;
            }
            container.querySelectorAll('[data-countdown-timer]').forEach(timer => {
                const target = Number(timer.dataset.target);
                const elapsed = target <= now;
                const remaining = Math.abs(target - now);
                const totalSeconds = Math.floor(remaining / 1000);
                const values = {
                    days: Math.floor(totalSeconds / 86400),
                    hours: Math.floor(totalSeconds / 3600) % 24,
                    minutes: Math.floor(totalSeconds / 60) % 60,
                    seconds: totalSeconds % 60
                };
                Object.entries(values).forEach(([unit, value]) => {
                    const element = timer.querySelector(`[data-unit="${unit}"]`);
                    if (element) element.textContent = String(value).padStart(2, '0');
                });
                timer.classList.toggle('is-expired', elapsed);
                const label = timer.querySelector('.countdowns-timer-state');
                if (label) label.textContent = elapsed ? 'TIME REACHED' : 'TIME LEFT';
            });
        };
        update();
        this.timer = setInterval(update, 1000);
        this.removalObserver = new MutationObserver(() => {
            if (container.isConnected) return;
            clearInterval(this.timer);
            this.removalObserver.disconnect();
        });
        this.removalObserver.observe(document.body, { childList: true, subtree: true });
    }

    rerender(container) {
        container.innerHTML = this.renderContent();
        this.attachEvents(container);
    }

    formatDate(value) {
        return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
    }

    toLocalInputValue(value) {
        const date = new Date(value);
        const pad = number => String(number).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    escape(value) {
        return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    }
}