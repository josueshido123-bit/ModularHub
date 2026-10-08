import { moduleRegistry } from '../../core/moduleRegistry.js';
import { CountdownsComponent } from './CountdownsComponent.js';

export function registerCountdownsModule() {
    moduleRegistry.register('countdowns', {
        name: 'Countdowns',
        description: 'Keep the moments ahead in view',
        category: 'planning',
        version: '1.0.0',
        icon: '⏳',
        component: CountdownsComponent,
        defaultSize: { width: 2, height: 2 },
        state: { filter: 'upcoming' }
    });
}