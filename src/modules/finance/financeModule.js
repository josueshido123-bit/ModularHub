/**
 * Finance Module
 * Personal finance tracker module
 */

import { moduleRegistry } from '../../core/moduleRegistry.js';
import { FinanceComponent } from './FinanceComponent.js';

/**
 * Register the Finance module
 */
export function registerFinanceModule() {
    moduleRegistry.register('finance', {
        name: 'Finance',
        description: 'Track income and expenses',
        category: 'finance',
        version: '1.0.0',
        icon: '💰',
        component: FinanceComponent,
        defaultSize: { width: 1, height: 1 },
        state: {
            view: 'overview'
        }
    });
}
