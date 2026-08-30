/**
 * Settings Panel Module
 * Application-wide settings
 */

export class SettingsPanel {
    constructor(state = {}) {
        this.state = state;
    }

    /**
     * Render settings panel
     * @returns {HTMLElement}
     */
    render() {
        const { SettingsComponent } = require('./SettingsComponent.js');
        const component = new SettingsComponent(this.state);
        return component.render();
    }
}
