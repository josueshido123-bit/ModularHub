import { storageService } from './storageService.js';

export const themes = {
    midnight: { name: 'Midnight', description: 'Deep blue-black with indigo accents' },
    graphite: { name: 'Graphite', description: 'Formal charcoal with cool steel accents' },
    paper: { name: 'Paper', description: 'Light, calm, and editorial' },
    forest: { name: 'Forest', description: 'Dark green with warm copper accents' }
};

class ThemeService {
    constructor() {
        this.data = storageService.load('theme_settings', { theme: 'midnight' });
        this.apply(this.data.theme);
    }

    getCurrent() { return this.data.theme; }
    set(theme) { if (!themes[theme]) return; this.data.theme = theme; storageService.save('theme_settings', this.data); this.apply(theme); }
    apply(theme) { document.documentElement.dataset.theme = theme; }
}

export const themeService = new ThemeService();
