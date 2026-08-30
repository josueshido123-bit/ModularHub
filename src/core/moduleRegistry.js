/**
 * Module Registry
 * Central registry for all available modules in the dashboard.
 * Modules are discovered and registered here, allowing the dashboard
 * to dynamically load and render them without hardcoded module logic.
 */

class ModuleRegistry {
    constructor() {
        this.modules = new Map();
    }

    /**
     * Register a module with the registry
     * @param {string} moduleId - Unique identifier for the module
     * @param {ModuleDefinition} definition - Module definition object
     */
    register(moduleId, definition) {
        if (this.modules.has(moduleId)) {
            console.warn(`Module ${moduleId} is already registered. Overwriting...`);
        }

        // Validate required fields
        if (!definition.name || !definition.icon || !definition.component) {
            throw new Error(`Module ${moduleId} must have name, icon, and component`);
        }

        this.modules.set(moduleId, {
            id: moduleId,
            ...definition
        });

        console.log(`✓ Module registered: ${definition.name}`);
    }

    /**
     * Get a module by ID
     * @param {string} moduleId
     * @returns {ModuleDefinition|null}
     */
    get(moduleId) {
        return this.modules.get(moduleId) || null;
    }

    /**
     * Get all registered modules
     * @returns {Array<ModuleDefinition>}
     */
    getAll() {
        return Array.from(this.modules.values());
    }

    /**
     * Check if a module is registered
     * @param {string} moduleId
     * @returns {boolean}
     */
    has(moduleId) {
        return this.modules.has(moduleId);
    }
}

// Export singleton instance
export const moduleRegistry = new ModuleRegistry();

/**
 * Module Definition Structure:
 * {
 *   id: string,                          // Unique identifier
 *   name: string,                        // Display name
 *   description: string,                 // Short description
 *   category: string,                    // Category (e.g., 'finance', 'productivity')
 *   version: string,                     // Module version
 *   icon: string,                        // SVG or unicode icon
 *   component: Class,                    // Vue/Lit/Vanilla component class
 *   defaultSize: { width: 1, height: 1 }, // Grid size (1x1, 2x1, etc.)
 *   init?: function,                     // Optional initialization
 *   destroy?: function,                  // Optional cleanup
 *   settings?: object                    // Optional settings schema
 * }
 */
