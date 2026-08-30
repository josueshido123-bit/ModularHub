/**
 * Module System
 * Handles module lifecycle, rendering, and state management.
 * This is the core of the dashboard framework.
 */

import { moduleRegistry } from './moduleRegistry.js';

class ModuleSystem {
    constructor() {
        this.activeModules = new Map(); // Instance data for active modules
        this.moduleContainer = null;
    }

    /**
     * Initialize the module system
     * @param {HTMLElement} containerElement - Element where modules will be rendered
     */
    async init(containerElement) {
        this.moduleContainer = containerElement;
        console.log('Module system initialized');
    }

    /**
     * Load and render all registered modules
     */
    async loadAllModules() {
        const modules = moduleRegistry.getAll();
        
        for (const moduleDef of modules) {
            await this.loadModule(moduleDef.id);
        }
    }

    /**
     * Load a single module
     * @param {string} moduleId
     */
    async loadModule(moduleId) {
        const moduleDef = moduleRegistry.get(moduleId);
        
        if (!moduleDef) {
            console.error(`Module not found: ${moduleId}`);
            return;
        }

        try {
            // Call module initialization if it exists
            if (moduleDef.init) {
                await moduleDef.init();
            }

            // Create module instance
            const instance = {
                id: moduleId,
                definition: moduleDef,
                state: moduleDef.state || {},
                element: null
            };

            this.activeModules.set(moduleId, instance);

            // Render the module
            this.renderModule(instance);

            console.log(`✓ Module loaded: ${moduleDef.name}`);
        } catch (error) {
            console.error(`Failed to load module ${moduleId}:`, error);
        }
    }

    /**
     * Render a module to the DOM as a card preview
     * @param {Object} instance - Module instance
     */
    renderModule(instance) {
        const { definition } = instance;
        
        // Create module card wrapper (square card for toolbelt view)
        const card = document.createElement('div');
        card.className = 'module-card module-preview';
        card.id = `module-${instance.id}`;
        card.setAttribute('data-module-id', instance.id);

        // Module card preview content
        card.innerHTML = `
            <div class="module-preview-content">
                <div class="module-icon">${definition.icon}</div>
                <div class="module-name">${definition.name}</div>
                <div class="module-description">${definition.description}</div>
            </div>
        `;
        
        // Click to open module
        card.addEventListener('click', () => this.openModule(instance));
        
        instance.element = card;
        this.moduleContainer.appendChild(card);

        // Trigger animation
        requestAnimationFrame(() => {
            card.classList.add('visible');
        });
    }

    /**
     * Open module in expanded view (modal)
     * @param {Object} instance - Module instance
     */
    openModule(instance) {
        const { definition } = instance;

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'module-modal';
        modal.setAttribute('data-module-id', instance.id);

        // Create modal content
        const content = document.createElement('div');
        content.className = 'module-modal-content';

        // Module header
        const header = document.createElement('div');
        header.className = 'module-modal-header';
        header.innerHTML = `
            <div class="module-modal-title">
                <span class="module-modal-icon">${definition.icon}</span>
                <h2>${definition.name}</h2>
            </div>
            <button class="module-modal-close" aria-label="Close">×</button>
        `;

        // Module body - render component
        const body = document.createElement('div');
        body.className = 'module-modal-body';
        
        const component = new definition.component(instance.state);
        const componentContent = component.render();
        body.appendChild(componentContent);

        // Assemble modal
        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);

        // Close button handler
        header.querySelector('.module-modal-close').addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        });

        document.body.appendChild(modal);

        // Trigger animation
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
    }

    /**
     * Unload a module
     * @param {string} moduleId
     */
    async unloadModule(moduleId) {
        const instance = this.activeModules.get(moduleId);
        
        if (!instance) {
            console.warn(`Module not loaded: ${moduleId}`);
            return;
        }

        try {
            // Call module cleanup if it exists
            const definition = moduleRegistry.get(moduleId);
            if (definition && definition.destroy) {
                await definition.destroy();
            }

            // Remove from DOM
            if (instance.element) {
                instance.element.classList.remove('visible');
                setTimeout(() => {
                    instance.element.remove();
                }, 300);
            }

            this.activeModules.delete(moduleId);
            console.log(`✓ Module unloaded: ${moduleId}`);
        } catch (error) {
            console.error(`Failed to unload module ${moduleId}:`, error);
        }
    }

    /**
     * Get an active module instance
     * @param {string} moduleId
     * @returns {Object|null}
     */
    getModule(moduleId) {
        return this.activeModules.get(moduleId) || null;
    }

    /**
     * Get all active module instances
     * @returns {Array}
     */
    getAllModules() {
        return Array.from(this.activeModules.values());
    }

    /**
     * Update module state
     * @param {string} moduleId
     * @param {Object} newState - Partial state update
     */
    updateModuleState(moduleId, newState) {
        const instance = this.activeModules.get(moduleId);
        if (instance) {
            instance.state = { ...instance.state, ...newState };
        }
    }
}

export const moduleSystem = new ModuleSystem();
