import { moduleRegistry } from '../../core/moduleRegistry.js';
import { GachaComponent } from './GachaComponent.js';

export function registerGachaModule() {
    moduleRegistry.register('gacha', {
        name: 'Character Registry',
        description: 'Track your favorite game characters',
        category: 'gacha',
        version: '1.0.0',
        icon: '🎴',
        component: GachaComponent,
        defaultSize: { width: 2, height: 2 },
        state: { view: 'roster', game: 'all' }
    });
}