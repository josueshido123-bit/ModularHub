import { moduleRegistry } from '../../core/moduleRegistry.js';
import { WishlistComponent } from './WishlistComponent.js';

export function registerWishlistModule() {
    moduleRegistry.register('wishlist', {
        name: 'Wishlist',
        description: 'Collect and track things you want',
        category: 'planning',
        version: '1.0.0',
        icon: '🛍️',
        component: WishlistComponent,
        defaultSize: { width: 2, height: 2 },
        state: { view: 'catalogue' }
    });
}
