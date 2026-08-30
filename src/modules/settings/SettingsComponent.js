/**
 * Settings Component
 * Application settings panel
 */

import { settingsService } from '../../services/settingsService.js';
import { showToast } from '../../utilities/uiUtils.js';

export class SettingsComponent {
    constructor(state = {}) {
        this.state = state;
    }

    /**
     * Render the settings panel
     * @returns {HTMLElement}
     */
    render() {
        const container = document.createElement('div');
        container.className = 'settings-panel';

        const settings = settingsService.getAll();

        container.innerHTML = `
            <div class="settings-content">
                <!-- Display Settings -->
                <div class="settings-section">
                    <h3>Display & Behavior</h3>
                    
                    <div class="settings-group">
                        <label class="settings-checkbox">
                            <input type="checkbox" name="animationsEnabled" ${settings.animationsEnabled ? 'checked' : ''}>
                            <span>Enable Animations</span>
                            <small>Smooth transitions throughout the app</small>
                        </label>
                    </div>

                    <div class="settings-group">
                        <label class="settings-checkbox">
                            <input type="checkbox" name="soundEnabled" ${settings.soundEnabled ? 'checked' : ''}>
                            <span>Enable Sound</span>
                            <small>Audio feedback for actions</small>
                        </label>
                    </div>
                </div>

                <!-- Data Management -->
                <div class="settings-section">
                    <h3>Data Management</h3>
                    
                    <div class="settings-group">
                        <p class="settings-description">Export your data as a backup</p>
                        <button class="btn btn-sm btn-primary export-btn">📥 Export Data</button>
                    </div>

                    <div class="settings-group">
                        <p class="settings-description">Restore from a backup file</p>
                        <input type="file" id="import-file" accept=".json" style="display:none;">
                        <button class="btn btn-sm btn-primary import-btn">📤 Import Data</button>
                    </div>

                    <div class="settings-group">
                        <p class="settings-description settings-warning">⚠️ This action cannot be undone</p>
                        <button class="btn btn-sm btn-secondary clear-btn">🗑️ Clear All Data</button>
                    </div>
                </div>

                <!-- About -->
                <div class="settings-section">
                    <h3>About SimpleDash</h3>
                    <p class="settings-description">Version 1.0.0</p>
                    <p class="settings-description">A modular personal dashboard</p>
                </div>
            </div>
        `;

        this.attachEventListeners(container);
        return container;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners(container) {
        // Animation toggle
        const animToggle = container.querySelector('input[name="animationsEnabled"]');
        if (animToggle) {
            animToggle.addEventListener('change', (e) => {
                settingsService.set('animationsEnabled', e.target.checked);
                showToast(e.target.checked ? 'Animations enabled' : 'Animations disabled', 'info');
            });
        }

        // Sound toggle
        const soundToggle = container.querySelector('input[name="soundEnabled"]');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                settingsService.set('soundEnabled', e.target.checked);
                showToast(e.target.checked ? 'Sound enabled' : 'Sound disabled', 'info');
            });
        }

        // Export button
        const exportBtn = container.querySelector('.export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                try {
                    settingsService.downloadData();
                    showToast('Data exported successfully', 'success');
                } catch (error) {
                    showToast('Failed to export data: ' + error.message, 'error');
                }
            });
        }

        // Import button
        const importBtn = container.querySelector('.import-btn');
        const importFile = container.querySelector('#import-file');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        settingsService.importData(data);
                        showToast('Data imported successfully. Please refresh the page.', 'success');
                    } catch (error) {
                        showToast('Failed to import data: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            });
        }

        // Clear data button
        const clearBtn = container.querySelector('.clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (settingsService.clearAllData()) {
                    showToast('All data cleared. Refreshing...', 'success');
                    setTimeout(() => window.location.reload(), 1000);
                }
            });
        }
    }
}
