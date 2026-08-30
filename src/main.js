/**
 * Main Application Entry Point
 * Initializes the dashboard and loads all modules
 */

import { moduleSystem } from './core/moduleSystem.js';
import { registerFinanceModule } from './modules/finance/financeModule.js';
import { SettingsComponent } from './modules/settings/SettingsComponent.js';

/**
 * Initialize the application
 */
async function initializeApp() {
    console.log('🚀 SimpleDash Starting...');

    try {
        // Get the modules grid container
        const modulesGrid = document.getElementById('modules-grid');
        if (!modulesGrid) {
            throw new Error('Modules grid container not found');
        }

        // Initialize module system with container
        await moduleSystem.init(modulesGrid);

        // Register all modules
        console.log('📦 Registering modules...');
        registerFinanceModule();

        // Load all registered modules
        console.log('⚙️  Loading modules...');
        await moduleSystem.loadAllModules();

        // Setup settings button
        setupSettingsButton();

        console.log('✓ SimpleDash Ready!');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background-color: #0f172a;
                color: #f1f5f9;
                font-family: system-ui;
                flex-direction: column;
                gap: 1rem;
                text-align: center;
                padding: 2rem;
            ">
                <h1>⚠️ Failed to load SimpleDash</h1>
                <p style="color: #cbd5e1; max-width: 500px;">${error.message}</p>
                <p style="color: #94a3b8; font-size: 0.875rem;">Check the console for more details</p>
            </div>
        `;
    }
}

/**
 * Setup the settings button
 */
function setupSettingsButton() {
    const settingsBtn = document.getElementById('settings-btn');
    if (!settingsBtn) return;

    settingsBtn.addEventListener('click', () => {
        openSettingsModal();
    });
}

/**
 * Open settings modal
 */
function openSettingsModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'module-modal';
    modal.id = 'settings-modal';

    // Create modal content
    const content = document.createElement('div');
    content.className = 'module-modal-content';

    // Settings header
    const header = document.createElement('div');
    header.className = 'module-modal-header';
    header.innerHTML = `
        <div class="module-modal-title">
            <span class="module-modal-icon">⚙️</span>
            <h2>Settings</h2>
        </div>
        <button class="module-modal-close" aria-label="Close">×</button>
    `;

    // Settings body
    const body = document.createElement('div');
    body.className = 'module-modal-body';
    
    const component = new SettingsComponent();
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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
