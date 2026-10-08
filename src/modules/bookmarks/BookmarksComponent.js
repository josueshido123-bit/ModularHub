import { bookmarksService } from './bookmarksService.js';
import { formatDate, showToast } from '../../utilities/uiUtils.js';
import { bindMediaEditor, DEFAULT_MEDIA_SCALE, ensureMediaScaleControl, mediaStyle as getMediaStyle, mediaTransform as getMediaTransform } from '../../utilities/mediaUtils.js';

export class BookmarksComponent {
    constructor(state = {}) {
        this.state = { view: 'library', editingId: null, detailId: null, ...state };
        this.mediaDraft = {};
    }

    render() {
        const container = document.createElement('div');
        container.className = 'bookmarks-module-content';
        container.innerHTML = this.renderContent();
        this.attachEvents(container);
        return container;
    }

    renderContent() {
        return `${this.state.view === 'history' ? this.renderHistory() : this.renderLibrary()}${this.renderForm()}${this.renderDetail()}`;
    }

    renderLibrary() {
        const items = bookmarksService.getItems();
        const featured = items[0];
        return `<div class="bookmarks-command-bar"><div><span class="eyebrow">Reference shelf</span><h3>Saved for later</h3><p>${items.length} link${items.length === 1 ? '' : 's'} in your library</p></div><div class="bookmarks-command-actions"><button class="bookmarks-tab active" data-view="library">Library</button><button class="bookmarks-tab" data-view="history">History</button><button class="btn btn-primary bookmarks-add-btn">+ Add bookmark</button></div></div>${featured ? `<div class="bookmarks-featured-wrap"><span class="bookmarks-section-label">Featured bookmark</span>${this.renderFeatured(featured)}</div><div class="bookmarks-quick-list"><span class="bookmarks-section-label">Quick access</span>${items.slice(1).map(item => this.renderCompact(item)).join('') || '<div class="bookmarks-empty">Add another bookmark to build your quick access list.</div>'}</div>` : '<div class="bookmarks-empty">Your reference shelf is empty. Save a useful link to get started.</div>'}`;
    }

    renderFeatured(item) {
        return `<article class="bookmarks-featured bookmarks-card" data-id="${item.id}"><button class="bookmarks-featured-open bookmarks-card-open" aria-label="Open ${this.escape(item.name)}">${this.renderMedia(item, 'card')}</button><div class="bookmarks-featured-info"><span class="eyebrow">Saved reference</span><h2>${this.escape(item.name)}</h2><p>${this.escape(item.description || item.url)}</p><div class="bookmarks-featured-actions"><a class="btn btn-primary" href="${this.escape(item.url)}" target="_blank" rel="noopener">Open link</a><button class="btn btn-secondary bookmarks-edit-btn">Edit</button><button class="btn btn-secondary bookmarks-delete-btn">Delete</button></div></div></article>`;
    }

    renderCompact(item) {
        return `<article class="bookmarks-quick-item bookmarks-card" data-id="${item.id}"><button class="bookmarks-quick-media bookmarks-card-open" aria-label="Open ${this.escape(item.name)}">${this.renderMedia(item, 'history')}</button><div class="bookmarks-quick-info"><h4>${this.escape(item.name)}</h4><p>${this.escape(item.description || item.url)}</p></div><div class="bookmarks-quick-actions"><button class="btn-icon bookmarks-edit-btn" aria-label="Edit bookmark">✎</button><button class="btn-icon bookmarks-delete-btn" aria-label="Delete bookmark">×</button></div></article>`;
    }

    renderCard(item) {
        return `<article class="bookmarks-card" data-id="${item.id}"><button class="bookmarks-card-open" aria-label="Open ${this.escape(item.name)}">${this.renderMedia(item, 'card')}</button><div class="bookmarks-card-body"><h3>${this.escape(item.name)}</h3><p>${this.escape(item.description || item.url)}</p><div class="bookmarks-card-actions"><button class="btn btn-sm btn-secondary bookmarks-edit-btn">Edit</button><button class="btn btn-sm btn-primary bookmarks-delete-btn">Delete</button></div></div></article>`;
    }

    renderHistory() {
        return `<section class="bookmarks-history"><div class="bookmarks-history-heading"><div><span class="eyebrow">Audit trail</span><h3>Bookmark history</h3></div><div class="bookmarks-command-actions"><button class="bookmarks-tab" data-view="library">Library</button><button class="bookmarks-tab active" data-view="history">History</button><button class="btn btn-primary bookmarks-add-btn">+ Add bookmark</button></div></div><div class="bookmarks-timeline">${bookmarksService.getHistory().map(entry => { const item = bookmarksService.getItem(entry.itemId); const historyItem = item || entry.details; return `<div class="bookmarks-timeline-entry"><div class="bookmarks-timeline-marker"></div><div class="bookmarks-timeline-media">${this.renderMedia(historyItem, 'history')}</div><div class="bookmarks-timeline-copy"><strong>${this.escape(entry.details?.name || item?.name || 'Removed bookmark')}</strong><span>${this.escape(entry.action)}</span></div><time>${formatDate(entry.date, 'short')}</time></div>`; }).join('') || '<div class="bookmarks-empty">Bookmark changes will appear here.</div>'}</div></section>`;
    }

    renderMedia(item, size) {
        if (!item?.mediaUrl) return `<div class="bookmarks-media-placeholder ${size === 'history' ? 'history' : ''}">🔖</div>`;
        const url = this.escape(item.mediaUrl);
        const position = this.escape(item.mediaPosition || '50% 50%');
        const scale = item.mediaScale ?? DEFAULT_MEDIA_SCALE;
        const hoverMedia = item.mediaType === 'video' || item.mediaType === 'gif' || /\.gif(?:$|[?#])/i.test(item.mediaUrl);
        if (hoverMedia) return `<div class="bookmarks-media-placeholder bookmarks-hover-media ${size === 'history' ? 'history' : ''}" data-media-url="${url}" data-media-type="${item.mediaType === 'video' ? 'video' : 'gif'}" data-media-position="${position}" data-media-scale="${scale}" data-media-alt="${this.escape(item.name)}">${item.mediaType === 'video' ? '▶' : 'GIF'}</div>`;
        return `<img src="${url}" alt="${this.escape(item.name)}" loading="lazy" style="${this.mediaStyle(position, size, scale)}">`;
    }

    mediaStyle(position, size = 'card', scale = DEFAULT_MEDIA_SCALE) { return getMediaStyle(position, size, scale); }

    mediaTransform(x, y, scale = DEFAULT_MEDIA_SCALE) { return getMediaTransform(`${x}% ${y}%`, scale); }

    renderEditorMedia(item) {
        const url = this.mediaDraft.url || item?.mediaUrl || '';
        const type = this.mediaDraft.type || item?.mediaType || 'image';
        const position = this.mediaDraft.position || item?.mediaPosition || '50% 50%';
        const scale = this.mediaDraft.scale ?? item?.mediaScale ?? DEFAULT_MEDIA_SCALE;
        if (!url) return '<div class="bookmarks-upload-empty">Choose media to preview and position it</div>';
        const tag = type === 'video' ? 'video' : 'img';
        return `<${tag} src="${this.escape(url)}" ${tag === 'video' ? 'muted playsinline' : `alt="${this.escape(item?.name || 'Bookmark media')}"`} style="${this.mediaStyle(position, 'editor', scale)}"></${tag}>`;
    }

    renderForm() {
        const item = this.state.editingId ? bookmarksService.getItem(this.state.editingId) : null;
        const position = this.mediaDraft.position || item?.mediaPosition || '50% 50%';
        return `<div class="bookmarks-form-modal hidden"><div class="bookmarks-form-panel"><div class="modal-header"><h2>${item ? 'Edit bookmark' : 'Add bookmark'}</h2><button class="bookmarks-form-close" type="button">×</button></div><form class="bookmarks-form"><div class="form-group"><label>Name</label><input name="name" required value="${this.escape(item?.name || '')}" placeholder="Project docs"></div><div class="form-group"><label>Link</label><input name="url" type="url" required value="${this.escape(item?.url || '')}" placeholder="https://example.com"></div><div class="form-group"><label>Upload media</label><label class="btn btn-secondary bookmarks-file-label">Choose file<input class="bookmarks-media-file" type="file" accept="image/*,video/*"></label><div class="bookmarks-media-editor" data-position="${this.escape(position)}">${this.renderEditorMedia(item)}</div><small>Drag the preview to choose its crop position.</small></div><div class="bookmarks-form-grid"><div class="form-group"><label>Media URL</label><input name="mediaUrl" type="url" value="${this.escape(this.mediaDraft.url || item?.mediaUrl || '')}" placeholder="Or paste media URL"></div><div class="form-group"><label>Media type</label><select name="mediaType"><option value="image" ${item?.mediaType !== 'gif' && item?.mediaType !== 'video' ? 'selected' : ''}>Image</option><option value="gif" ${item?.mediaType === 'gif' ? 'selected' : ''}>GIF</option><option value="video" ${item?.mediaType === 'video' ? 'selected' : ''}>Video</option></select></div></div><input name="mediaPosition" type="hidden" value="${this.escape(position)}"><div class="form-group"><label>Description</label><textarea name="description" rows="4" placeholder="What is this useful for?">${this.escape(item?.description || '')}</textarea></div><button class="btn btn-primary" type="submit">${item ? 'Save changes' : 'Save bookmark'}</button></form></div></div>`;
    }

    renderDetail() {
        const item = this.state.detailId ? bookmarksService.getItem(this.state.detailId) : null;
        if (!item) return '';
        return `<div class="bookmarks-detail-modal"><div class="bookmarks-detail-panel"><button class="bookmarks-detail-close" type="button">×</button><div class="bookmarks-detail-media">${this.renderMedia(item, 'detail')}</div><div class="bookmarks-detail-info"><span class="eyebrow">Saved bookmark</span><h2>${this.escape(item.name)}</h2><a class="btn btn-primary" href="${this.escape(item.url)}" target="_blank" rel="noopener">Open bookmark</a>${item.description ? `<p>${this.escape(item.description)}</p>` : ''}<div class="bookmarks-detail-actions"><button class="btn btn-secondary bookmarks-detail-edit">Edit bookmark</button><button class="btn btn-secondary bookmarks-detail-delete">Delete bookmark</button></div></div></div></div>`;
    }

    attachEvents(container) {
        container.querySelectorAll('.bookmarks-tab').forEach(button => button.addEventListener('click', () => this.rerender(container, button.dataset.view)));
        container.querySelector('.bookmarks-add-btn')?.addEventListener('click', () => {
            this.state.editingId = null;
            this.mediaDraft = {};
            this.rerender(container);
            container.querySelector('.bookmarks-form-modal').classList.remove('hidden');
        });
        container.querySelector('.bookmarks-form-close')?.addEventListener('click', () => this.closeOverlay(container.querySelector('.bookmarks-form-modal')));
        container.querySelector('.bookmarks-media-file')?.addEventListener('change', event => this.handleMediaFile(event, container));
        container.querySelector('.bookmarks-form input[name="mediaUrl"]')?.addEventListener('input', () => this.updateMediaPreview(container));
        container.querySelector('.bookmarks-form select[name="mediaType"]')?.addEventListener('change', () => this.updateMediaPreview(container));
        this.setupMediaEditor(container);
        container.querySelector('.bookmarks-form')?.addEventListener('submit', event => this.saveItem(event, container));
        container.querySelectorAll('.bookmarks-card-open').forEach(button => button.addEventListener('click', event => { this.state.detailId = event.currentTarget.closest('.bookmarks-card').dataset.id; this.rerender(container); }));
        container.querySelectorAll('.bookmarks-hover-media').forEach(media => { media.addEventListener('mouseenter', () => this.activateHoverMedia(media)); media.addEventListener('mouseleave', () => this.deactivateHoverMedia(media)); media.addEventListener('focus', () => this.activateHoverMedia(media)); media.addEventListener('blur', () => this.deactivateHoverMedia(media)); });
        container.querySelectorAll('.bookmarks-edit-btn').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); this.openEditor(container, event.target.closest('.bookmarks-card').dataset.id); }));
        container.querySelectorAll('.bookmarks-delete-btn').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); this.deleteItem(container, event.target.closest('.bookmarks-card').dataset.id); }));
        container.querySelector('.bookmarks-detail-close')?.addEventListener('click', () => this.closeDetail(container));
        container.querySelector('.bookmarks-detail-edit')?.addEventListener('click', () => { const id = this.state.detailId; this.state.detailId = null; this.state.editingId = id; this.mediaDraft = {}; this.rerender(container); container.querySelector('.bookmarks-form-modal').classList.remove('hidden'); });
        container.querySelector('.bookmarks-detail-delete')?.addEventListener('click', () => this.deleteItem(container, this.state.detailId, true));
    }

    openEditor(container, itemId) { this.state.editingId = itemId; this.mediaDraft = {}; this.rerender(container); container.querySelector('.bookmarks-form-modal').classList.remove('hidden'); }
    deleteItem(container, itemId, fromDetail = false) { if (!confirm('Delete this bookmark?')) return; bookmarksService.removeItem(itemId); this.state.detailId = fromDetail ? null : this.state.detailId; showToast('Bookmark deleted', 'success'); this.rerender(container); }
    saveItem(event, container) { event.preventDefault(); const input = Object.fromEntries(new FormData(event.target).entries()); if (!input.name.trim() || !input.url.trim()) return showToast('Name and link are required', 'error'); input.mediaPosition ||= '50% 50%'; if (this.state.editingId) bookmarksService.updateItem(this.state.editingId, input); else bookmarksService.addItem(input); showToast(this.state.editingId ? 'Bookmark updated' : 'Bookmark saved', 'success'); this.state.editingId = null; this.mediaDraft = {}; this.rerender(container); }
    handleMediaFile(event, container) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            this.mediaDraft = { url: reader.result, type: file.type.startsWith('video/') ? 'video' : file.type === 'image/gif' ? 'gif' : 'image', position: '50% 50%', scale: DEFAULT_MEDIA_SCALE };
            const form = container.querySelector('.bookmarks-form');
            form.querySelector('input[name="mediaUrl"]').value = this.mediaDraft.url;
            form.querySelector('select[name="mediaType"]').value = this.mediaDraft.type;
            form.querySelector('input[name="mediaPosition"]').value = this.mediaDraft.position;
            form.querySelector('input[name="mediaScale"]').value = String(this.mediaDraft.scale);
            form.querySelector('.media-scale-value').value = `${Math.round(this.mediaDraft.scale * 100)}%`;
            this.renderMediaEditor(container);
        };
        reader.readAsDataURL(file);
    }

    updateMediaPreview(container) {
        const form = container.querySelector('.bookmarks-form');
        this.mediaDraft = {
            url: form.querySelector('input[name="mediaUrl"]').value.trim(),
            type: form.querySelector('select[name="mediaType"]').value,
            position: form.querySelector('input[name="mediaPosition"]').value || '50% 50%',
            scale: Number(form.querySelector('input[name="mediaScale"]')?.value) || DEFAULT_MEDIA_SCALE
        };
        this.renderMediaEditor(container);
    }

    renderMediaEditor(container) {
        const currentEditor = container.querySelector('.bookmarks-media-editor');
        const editor = currentEditor.cloneNode(false);
        editor.removeAttribute('data-bound');
        editor.dataset.position = this.mediaDraft.position || '50% 50%';
        editor.dataset.scale = String(this.mediaDraft.scale ?? DEFAULT_MEDIA_SCALE);
        editor.innerHTML = this.renderEditorMedia({ name: container.querySelector('.bookmarks-form input[name="name"]').value });
        currentEditor.replaceWith(editor);
        this.setupMediaEditor(container);
    }
    setupMediaEditor(container) {
        const editor = container.querySelector('.bookmarks-media-editor');
        if (!editor) return;
        const item = this.state.editingId ? bookmarksService.getItem(this.state.editingId) : null;
        const controls = ensureMediaScaleControl(container, editor, this.mediaDraft.scale ?? item?.mediaScale ?? DEFAULT_MEDIA_SCALE);
        if (!controls) return;
        bindMediaEditor(editor, controls.positionInput, controls.scaleInput, controls.scaleOutput);
        if (controls.scaleInput.dataset.bookmarksDraftBound !== 'true') {
            controls.scaleInput.dataset.bookmarksDraftBound = 'true';
            controls.scaleInput.addEventListener('input', () => { this.mediaDraft.scale = Number(controls.scaleInput.value); });
        }
    }
    activateHoverMedia(placeholder) { if (placeholder.querySelector('img, video')) return; const media = document.createElement(placeholder.dataset.mediaType === 'video' ? 'video' : 'img'); media.src = placeholder.dataset.mediaUrl; media.alt = placeholder.dataset.mediaAlt || ''; media.style.cssText = this.mediaStyle(placeholder.dataset.mediaPosition || '50% 50%', placeholder.classList.contains('history') ? 'history' : 'card', placeholder.dataset.mediaScale ?? DEFAULT_MEDIA_SCALE); if (media.tagName === 'VIDEO') { media.muted = true; media.loop = true; media.autoplay = true; media.playsInline = true; media.play().catch(() => {}); } placeholder.replaceChildren(media); placeholder.classList.add('is-playing'); }
    deactivateHoverMedia(placeholder) { const media = placeholder.querySelector('video'); if (media) media.pause(); placeholder.innerHTML = placeholder.dataset.mediaType === 'video' ? '▶' : 'GIF'; placeholder.classList.remove('is-playing'); }
    closeOverlay(overlay) { if (!overlay || overlay.classList.contains('is-closing')) return; overlay.classList.add('is-closing'); setTimeout(() => overlay.classList.add('hidden'), 220); }
    closeDetail(container) { const overlay = container.querySelector('.bookmarks-detail-modal'); if (!overlay) return; overlay.classList.add('is-closing'); setTimeout(() => { this.state.detailId = null; this.rerender(container); }, 220); }
    rerender(container, view = this.state.view) { this.state.view = view; container.innerHTML = this.renderContent(); this.attachEvents(container); }
    escape(value) { return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
}
