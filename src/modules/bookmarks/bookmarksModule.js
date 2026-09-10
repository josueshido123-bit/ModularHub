import { moduleRegistry } from '../../core/moduleRegistry.js';
import { BookmarksComponent } from './BookmarksComponent.js';

export function registerBookmarksModule() {
    moduleRegistry.register('bookmarks', {
        name: 'Bookmarks',
        description: 'Keep useful links in one visual library',
        category: 'reference',
        version: '1.0.0',
        icon: '🔖',
        component: BookmarksComponent,
        defaultSize: { width: 2, height: 2 },
        state: { view: 'library' }
    });
}
