import { wishlistService } from './wishlistService.js';
import { financeService } from '../finance/financeService.js';
import { formatCurrency, formatDate, showToast } from '../../utilities/uiUtils.js';
import { bindMediaEditor, DEFAULT_MEDIA_SCALE, ensureMediaScaleControl, mediaStyle as getMediaStyle, mediaTransform as getMediaTransform, readMediaFile } from '../../utilities/mediaUtils.js';

export class WishlistComponent {
    constructor(state = {}) {
        this.state = { view: 'catalogue', editingId: null, detailId: null, ...state };
        this.mediaDraft = {};
    }

    render() {
        const container = document.createElement('div');
        container.className = 'wishlist-module-content';
        container.innerHTML = this.renderContent();
        this.attachEvents(container);
        this.startCountdowns(container);
        return container;
    }

    renderContent() {
        const items = wishlistService.getItems();
        return `<div class="wishlist-toolbar"><div class="wishlist-tabs"><button class="wishlist-tab ${this.state.view === 'catalogue' ? 'active' : ''}" data-view="catalogue">Catalogue</button><button class="wishlist-tab ${this.state.view === 'history' ? 'active' : ''}" data-view="history">History</button></div><button class="btn btn-primary wishlist-add-btn">+ Add item</button></div>${this.state.view === 'history' ? this.renderHistory() : `<div class="wishlist-summary"><span>${items.filter(item => item.status === 'active').length} active items</span><span>${items.filter(item => item.status === 'completed').length} completed</span></div><div class="wishlist-catalogue">${items.map(item => this.renderCard(item)).join('') || '<div class="wishlist-empty">Your catalogue is empty. Add something worth waiting for.</div>'}</div>`}${this.renderForm()}${this.renderDetail()}`;
    }

    renderCard(item) {
        const media = this.renderMedia(item, 'card');
        const progress = item.price ? Math.min(100, Math.max(0, financeService.getBalance() / item.price * 100)) : null;
        return `<article class="wishlist-card ${item.status === 'completed' ? 'completed' : ''}" data-id="${item.id}"><button class="wishlist-card-open" aria-label="Open ${this.escape(item.name)}">${media}</button><div class="wishlist-card-body"><div class="wishlist-card-title"><h3>${this.escape(item.name)}</h3>${item.status === 'completed' ? '<span class="wishlist-complete-badge">Done</span>' : ''}</div>${item.price ? `<div class="wishlist-price">${formatCurrency(item.price)}</div><div class="wishlist-progress"><div class="wishlist-progress-fill" style="width:${progress}%"></div></div><small>${Math.round(progress)}% covered by current balance</small>` : '<small class="wishlist-no-price">No price set</small>'}${item.targetDate ? `<div class="wishlist-countdown" data-date="${item.targetDate}">Calculating...</div>` : ''}<div class="wishlist-card-actions"><button class="btn btn-sm btn-secondary wishlist-edit-btn">Edit</button><button class="btn btn-sm ${item.status === 'completed' ? 'btn-secondary' : 'btn-primary'} wishlist-complete-btn">${item.status === 'completed' ? 'Reopen' : 'Complete'}</button></div></div></article>`;
    }

    renderHistory() {
        return `<section class="wishlist-history"><h3>Wishlist history</h3>${wishlistService.getHistory().map(entry => { const item = wishlistService.getItem(entry.itemId); const historyItem = item || entry.details; return `<div class="wishlist-history-row"><div>${this.renderMedia(historyItem, 'history')}</div><span class="wishlist-history-action">${this.escape(entry.action)}</span><span>${this.escape(entry.details?.name || item?.name || 'Removed item')}</span><time>${formatDate(entry.date, 'short')}</time></div>`; }).join('') || '<div class="wishlist-empty">Changes to your wishlist will appear here.</div>'}</section>`;
    }

    renderMedia(item, size) {
        if (!item?.mediaUrl) return `<div class="wishlist-media-placeholder ${size === 'history' ? 'history' : ''}">✦</div>`;
        const url = this.escape(item.mediaUrl);
        const isHoverMedia = item.mediaType === 'video' || item.mediaType === 'gif' || /\.gif(?:$|[?#])/i.test(item.mediaUrl);
        const position = this.escape(item.mediaPosition || '50% 50%');
        const scale = item.mediaScale ?? DEFAULT_MEDIA_SCALE;
        if (isHoverMedia) return `<div class="wishlist-media-placeholder wishlist-hover-media ${size === 'history' ? 'history' : ''}" data-media-url="${url}" data-media-type="${item.mediaType === 'video' ? 'video' : 'gif'}" data-media-position="${position}" data-media-scale="${scale}" data-media-alt="${this.escape(item.name || '')}">${item.mediaType === 'video' ? '▶' : 'GIF'}</div>`;
        return `<img src="${url}" alt="${this.escape(item.name || '')}" loading="lazy" style="${this.mediaStyle(position, size, scale)}">`;
    }

    mediaStyle(position, size = 'card', scale = DEFAULT_MEDIA_SCALE) { return getMediaStyle(position, size, scale); }

    mediaTransform(x, y, scale = DEFAULT_MEDIA_SCALE) { return getMediaTransform(`${x}% ${y}%`, scale); }

    renderEditorMedia(item) {
        const mediaUrl = this.mediaDraft.url || item?.mediaUrl || '';
        const mediaType = this.mediaDraft.type || item?.mediaType || 'image';
        const position = this.mediaDraft.position || item?.mediaPosition || '50% 50%';
        const scale = this.mediaDraft.scale ?? item?.mediaScale ?? DEFAULT_MEDIA_SCALE;
        if (!mediaUrl) return '<div class="wishlist-upload-empty">Choose an image, GIF, or video to position it here</div>';
        const tag = mediaType === 'video' ? 'video' : 'img';
        const attributes = tag === 'video' ? 'muted playsinline' : `alt="${this.escape(item?.name || 'Wishlist media')}"`;
        return `<${tag} src="${this.escape(mediaUrl)}" ${attributes} style="${this.mediaStyle(position, 'editor', scale)}"></${tag}>`;
    }

    renderForm() {
        const item = this.state.editingId ? wishlistService.getItem(this.state.editingId) : null;
        const position = this.mediaDraft.position || item?.mediaPosition || '50% 50%';
        return `<div class="wishlist-form-modal hidden"><div class="wishlist-form-panel"><div class="modal-header"><h2>${item ? 'Edit wishlist item' : 'Add to wishlist'}</h2><button class="wishlist-form-close" type="button">×</button></div><form class="wishlist-form"><div class="form-group"><label>Name</label><input name="name" required value="${this.escape(item?.name || '')}" placeholder="A game, book, film..."></div><div class="form-group"><label>Upload media</label><label class="btn btn-secondary wishlist-file-label">Choose file<input class="wishlist-media-file" type="file" accept="image/*,video/*"></label><div class="wishlist-media-editor" data-position="${this.escape(position)}">${this.renderEditorMedia(item)}</div><small>Drag the preview to choose the crop position.</small></div><div class="wishlist-form-grid"><div class="form-group"><label>Media URL</label><input name="mediaUrl" type="url" value="${this.escape(this.mediaDraft.url || item?.mediaUrl || '')}" placeholder="Or paste an image, GIF, or video URL"></div><div class="form-group"><label>Media type</label><select name="mediaType"><option value="image" ${item?.mediaType !== 'video' && item?.mediaType !== 'gif' ? 'selected' : ''}>Image</option><option value="gif" ${item?.mediaType === 'gif' ? 'selected' : ''}>GIF</option><option value="video" ${item?.mediaType === 'video' ? 'selected' : ''}>Video</option></select></div><div class="form-group"><label>Price</label><input name="price" type="number" min="0" step="0.01" value="${item?.price || ''}" placeholder="Optional"></div><div class="form-group"><label>Target date</label><input name="targetDate" type="date" value="${item?.targetDate?.slice(0, 10) || ''}"></div></div><input name="mediaPosition" type="hidden" value="${this.escape(position)}"><div class="form-group"><label>Link</label><input name="link" type="url" value="${this.escape(item?.link || '')}" placeholder="Where to find it"></div><div class="form-group"><label>Notes</label><textarea name="notes" rows="3" placeholder="Why is it on your wishlist?">${this.escape(item?.notes || '')}</textarea></div><button class="btn btn-primary" type="submit">${item ? 'Save changes' : 'Add item'}</button></form></div></div>`;
    }

    renderDetail() {
        const item = this.state.detailId ? wishlistService.getItem(this.state.detailId) : null;
        if (!item) return '';
        const media = this.renderMedia(item, 'detail');
        return `<div class="wishlist-detail-modal"><div class="wishlist-detail-panel"><button class="wishlist-detail-close" type="button">×</button><div class="wishlist-detail-media">${media}</div><div class="wishlist-detail-info"><span class="eyebrow">Wishlist item</span><h2>${this.escape(item.name)}</h2>${item.price ? `<p class="wishlist-detail-price">${formatCurrency(item.price)}</p><div class="wishlist-progress"><div class="wishlist-progress-fill" style="width:${Math.min(100, Math.max(0, financeService.getBalance() / item.price * 100))}%"></div></div>` : ''}${item.targetDate ? `<p class="wishlist-detail-countdown" data-date="${item.targetDate}"></p>` : ''}${item.notes ? `<p>${this.escape(item.notes)}</p>` : ''}${item.link ? `<a class="btn btn-secondary" href="${this.escape(item.link)}" target="_blank" rel="noopener">Open link</a>` : ''}<div class="wishlist-detail-actions"><button class="btn btn-primary detail-edit-btn">Edit item</button><button class="btn btn-secondary detail-complete-btn">${item.status === 'completed' ? 'Reopen item' : 'Mark completed'}</button></div></div></div></div>`;
    }

    attachEvents(container) {
        container.querySelectorAll('.wishlist-tab').forEach(button => button.addEventListener('click', () => this.rerender(container, button.dataset.view)));
        container.querySelector('.wishlist-add-btn')?.addEventListener('click', () => {
            this.state.editingId = null;
            this.mediaDraft = {};
            this.rerender(container);
            container.querySelector('.wishlist-form-modal').classList.remove('hidden');
        });
        container.querySelector('.wishlist-form-close')?.addEventListener('click', () => this.closeOverlay(container.querySelector('.wishlist-form-modal')));
        container.querySelector('.wishlist-media-file')?.addEventListener('change', event => this.handleMediaFile(event, container));
        container.querySelector('.wishlist-form input[name="mediaUrl"]')?.addEventListener('input', () => this.updateMediaPreview(container));
        container.querySelector('.wishlist-form select[name="mediaType"]')?.addEventListener('change', () => this.updateMediaPreview(container));
        this.setupMediaEditor(container);
        container.querySelector('.wishlist-form')?.addEventListener('submit', event => this.saveItem(event, container));
        container.querySelectorAll('.wishlist-card-actions').forEach(actions => {
            if (actions.querySelector('.wishlist-delete-btn')) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn btn-sm btn-secondary wishlist-delete-btn';
            button.textContent = 'Delete';
            button.addEventListener('click', event => {
                event.stopPropagation();
                if (!confirm('Delete this wishlist item?')) return;
                const itemId = event.currentTarget.closest('.wishlist-card').dataset.id;
                if (!wishlistService.removeItem(itemId)) {
                    showToast('Wishlist item could not be deleted. Your changes were not saved.', 'error');
                    this.rerender(container);
                    return;
                }
                showToast('Wishlist item deleted', 'success');
                this.rerender(container);
            });
            actions.append(button);
        });
        container.querySelectorAll('.wishlist-card-open').forEach(button => {
            button.addEventListener('click', event => { this.state.detailId = event.currentTarget.closest('.wishlist-card').dataset.id; this.rerender(container); });
        });
        container.querySelectorAll('.wishlist-hover-media').forEach(media => {
            media.addEventListener('mouseenter', () => this.activateHoverMedia(media));
            media.addEventListener('mouseleave', () => this.deactivateHoverMedia(media));
            media.addEventListener('focus', () => this.activateHoverMedia(media));
            media.addEventListener('blur', () => this.deactivateHoverMedia(media));
        });
        container.querySelectorAll('.wishlist-edit-btn').forEach(button => button.addEventListener('click', event => {
            event.stopPropagation();
            this.mediaDraft = {};
            this.state.editingId = event.currentTarget.closest('.wishlist-card').dataset.id;
            this.rerender(container);
            container.querySelector('.wishlist-form-modal').classList.remove('hidden');
        }));
        container.querySelectorAll('.wishlist-complete-btn').forEach(button => button.addEventListener('click', event => {
            event.stopPropagation();
            const item = wishlistService.completeItem(event.currentTarget.closest('.wishlist-card').dataset.id);
            if (!item) showToast('Wishlist item could not be updated. Your changes were not saved.', 'error');
            this.rerender(container);
        }));
        container.querySelector('.wishlist-detail-close')?.addEventListener('click', () => this.closeDetail(container));
        container.querySelector('.detail-edit-btn')?.addEventListener('click', () => { this.mediaDraft = {}; this.state.editingId = this.state.detailId; this.state.detailId = null; this.rerender(container); container.querySelector('.wishlist-form-modal').classList.remove('hidden'); });
        container.querySelector('.detail-complete-btn')?.addEventListener('click', () => {
            if (!wishlistService.completeItem(this.state.detailId)) {
                showToast('Wishlist item could not be updated. Your changes were not saved.', 'error');
                return;
            }
            this.state.detailId = null;
            this.rerender(container);
        });
    }

    saveItem(event, container) {
        event.preventDefault();
        const data = new FormData(event.target);
        const input = Object.fromEntries(data.entries());
        if (!input.name.trim()) return showToast('Add a name first', 'error');
        input.mediaPosition = input.mediaPosition || '50% 50%';
        const isEditing = Boolean(this.state.editingId);
        const item = isEditing ? wishlistService.updateItem(this.state.editingId, input) : wishlistService.addItem(input);
        if (!item) return showToast('Wishlist item could not be saved. Your changes were not saved.', 'error');
        showToast(isEditing ? 'Wishlist item updated' : 'Wishlist item added', 'success');
        this.state.editingId = null;
        this.mediaDraft = {};
        this.rerender(container);
    }

    handleMediaFile(event, container) {
        const file = event.target.files[0];
        if (!file) return;
        readMediaFile(file).then(url => {
            const form = container.querySelector('.wishlist-form');
            if (!form) return;
            this.mediaDraft = { url, type: file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image', position: '50% 50%', scale: DEFAULT_MEDIA_SCALE };
            form.querySelector('input[name="mediaUrl"]').value = this.mediaDraft.url;
            form.querySelector('select[name="mediaType"]').value = this.mediaDraft.type;
            form.querySelector('input[name="mediaPosition"]').value = this.mediaDraft.position;
            form.querySelector('input[name="mediaScale"]').value = String(this.mediaDraft.scale);
            form.querySelector('.media-scale-value').value = `${Math.round(this.mediaDraft.scale * 100)}%`;
            this.renderMediaEditor(container);
        }).catch(error => showToast(error.message, 'error'));
    }

    updateMediaPreview(container) {
        const form = container.querySelector('.wishlist-form');
        this.mediaDraft = {
            url: form.querySelector('input[name="mediaUrl"]').value.trim(),
            type: form.querySelector('select[name="mediaType"]').value,
            position: form.querySelector('input[name="mediaPosition"]').value || '50% 50%',
            scale: Number(form.querySelector('input[name="mediaScale"]')?.value) || DEFAULT_MEDIA_SCALE
        };
        this.renderMediaEditor(container);
    }

    renderMediaEditor(container) {
        const currentEditor = container.querySelector('.wishlist-media-editor');
        const editor = currentEditor.cloneNode(false);
        editor.removeAttribute('data-bound');
        editor.dataset.position = this.mediaDraft.position || '50% 50%';
        editor.dataset.scale = String(this.mediaDraft.scale ?? DEFAULT_MEDIA_SCALE);
        editor.innerHTML = this.renderEditorMedia({ name: container.querySelector('.wishlist-form input[name="name"]').value });
        currentEditor.replaceWith(editor);
        this.setupMediaEditor(container);
    }

    setupMediaEditor(container) {
        const editor = container.querySelector('.wishlist-media-editor');
        if (!editor) return;
        const item = this.state.editingId ? wishlistService.getItem(this.state.editingId) : null;
        const controls = ensureMediaScaleControl(container, editor, this.mediaDraft.scale ?? item?.mediaScale ?? DEFAULT_MEDIA_SCALE);
        if (!controls) return;
        bindMediaEditor(editor, controls.positionInput, controls.scaleInput, controls.scaleOutput);
        if (controls.scaleInput.dataset.wishlistDraftBound !== 'true') {
            controls.scaleInput.dataset.wishlistDraftBound = 'true';
            controls.scaleInput.addEventListener('input', () => { this.mediaDraft.scale = Number(controls.scaleInput.value); });
        }
    }

    closeOverlay(overlay) {
        if (!overlay || overlay.classList.contains('is-closing')) return;
        overlay.classList.add('is-closing');
        setTimeout(() => overlay.classList.add('hidden'), 220);
    }

    closeDetail(container) {
        const overlay = container.querySelector('.wishlist-detail-modal');
        if (!overlay) return;
        overlay.classList.add('is-closing');
        setTimeout(() => { this.state.detailId = null; this.rerender(container); }, 220);
    }

    rerender(container, view = this.state.view) { this.state.view = view; container.innerHTML = this.renderContent(); this.attachEvents(container); this.startCountdowns(container); }
    activateHoverMedia(placeholder) {
        if (placeholder.querySelector('img, video')) return;
        const media = document.createElement(placeholder.dataset.mediaType === 'video' ? 'video' : 'img');
        media.src = placeholder.dataset.mediaUrl;
        media.alt = placeholder.dataset.mediaAlt || '';
        media.style.cssText = this.mediaStyle(placeholder.dataset.mediaPosition || '50% 50%', placeholder.classList.contains('history') ? 'history' : 'card', placeholder.dataset.mediaScale ?? DEFAULT_MEDIA_SCALE);
        if (media.tagName === 'VIDEO') { media.muted = true; media.loop = true; media.autoplay = true; media.playsInline = true; media.play().catch(() => {}); }
        placeholder.replaceChildren(media);
        placeholder.classList.add('is-playing');
    }
    deactivateHoverMedia(placeholder) {
        const media = placeholder.querySelector('video');
        if (media) media.pause();
        if (placeholder.dataset.mediaUrl) {
            placeholder.innerHTML = placeholder.dataset.mediaType === 'video' ? '▶' : 'GIF';
            placeholder.classList.remove('is-playing');
        }
    }
    startCountdowns(container) { container.querySelectorAll('[data-date]').forEach(element => { const date = new Date(element.dataset.date); const update = () => { const days = Math.ceil((date - new Date()) / 86400000); element.textContent = days > 0 ? `${days} days remaining` : days === 0 ? 'Today' : `${Math.abs(days)} days ago`; }; update(); }); }
    escape(value) { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
}
