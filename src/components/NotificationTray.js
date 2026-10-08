import { notificationService } from '../services/notificationService.js';

export class NotificationTray {
    constructor() {
        this.isOpen = false;
    }

    mount(container) {
        if (!container) return;
        this.container = container;
        this.unsubscribe = notificationService.subscribe(() => this.render());
        this.handleClick = event => this.onClick(event);
        this.handleOutsideClick = event => {
            if (this.isOpen && !event.composedPath().includes(this.container)) {
                this.isOpen = false;
                this.render();
            }
        };
        this.handleKeydown = event => {
            if (event.key === 'Escape' && this.isOpen) {
                this.isOpen = false;
                this.render();
                this.container.querySelector('.notification-trigger')?.focus();
            }
        };
        container.addEventListener('click', this.handleClick);
        document.addEventListener('click', this.handleOutsideClick);
        document.addEventListener('keydown', this.handleKeydown);
        this.render();
    }

    render() {
        if (!this.container) return;
        const { notifications, unreadCount } = notificationService.getState();
        const label = unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications';
        this.container.innerHTML = `<button class="notification-trigger settings-button" type="button" aria-label="${label}" aria-expanded="${this.isOpen}" aria-controls="notification-panel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"></path></svg>${unreadCount ? `<span class="notification-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>` : ''}</button>${this.isOpen ? `<section class="notification-panel" id="notification-panel" aria-label="Notifications"><header class="notification-panel-header"><div><h2>Notifications</h2><span>${unreadCount ? `${unreadCount} unread` : 'All caught up'}</span></div><div class="notification-panel-actions"><button type="button" class="notification-mark-all" ${unreadCount ? '' : 'disabled'}>Mark all read</button><button type="button" class="notification-close" aria-label="Close notifications">×</button></div></header>${notifications.length ? `<div class="notification-list">${notifications.map(item => this.renderItem(item)).join('')}</div><footer class="notification-panel-footer"><button type="button" class="notification-clear">Clear all</button></footer>` : '<div class="notification-empty">No notifications yet.</div>'}</section>` : ''}`;
    }

    renderItem(item) {
        const icon = this.escape(item.icon || this.sourceIcon(item.source));
        return `<button class="notification-item ${item.read ? 'is-read' : 'is-unread'} notification-${item.type}" type="button" data-notification-id="${this.escape(item.id)}"><span class="notification-item-icon" aria-hidden="true">${icon}</span><span class="notification-item-copy"><strong>${this.escape(item.title)}</strong><span>${this.escape(item.message)}</span><time>${this.formatDate(item.createdAt)}</time></span>${item.read ? '' : '<span class="notification-unread-dot" aria-label="Unread"></span>'}</button>`;
    }

    onClick(event) {
        event.stopPropagation();
        if (event.target.closest('.notification-trigger')) {
            this.isOpen = !this.isOpen;
            this.render();
        } else if (event.target.closest('.notification-close')) {
            this.isOpen = false;
            this.render();
        } else if (event.target.closest('.notification-mark-all')) {
            notificationService.markAllRead();
        } else if (event.target.closest('.notification-clear')) {
            notificationService.clearAll();
        } else {
            const item = event.target.closest('[data-notification-id]');
            if (item) notificationService.markRead(item.dataset.notificationId);
        }
    }

    sourceIcon(source) {
        return ({ finance: '💰', wishlist: '🛍️', countdowns: '⏳' })[source] || '🔔';
    }

    formatDate(value) {
        return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
    }

    escape(value) {
        return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    }
}