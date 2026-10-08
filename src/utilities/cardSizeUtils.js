import { storageService } from '../services/storageService.js';
import { showToast } from './uiUtils.js';

const CARD_SIZES = ['small', 'medium', 'large'];
const DEFAULT_CARD_SIZE = 'medium';

export function loadCardSize(moduleId) {
    const savedSize = storageService.load(`card-size-${moduleId}`, DEFAULT_CARD_SIZE);
    return CARD_SIZES.includes(savedSize) ? savedSize : DEFAULT_CARD_SIZE;
}

export function renderCardSizeControl(selectedSize) {
    return `<div class="card-size-control"><span class="card-size-label">Card size</span><div class="card-size-options" role="group" aria-label="Card size">${CARD_SIZES.map(size => `<button type="button" class="card-size-option${selectedSize === size ? ' active' : ''}" data-card-size="${size}" aria-pressed="${selectedSize === size}">${size[0].toUpperCase()}${size.slice(1)}</button>`).join('')}</div></div>`;
}

export function attachCardSizeControl(container, moduleId, selectedSize, onChange) {
    container.dataset.cardSize = selectedSize;
    container.querySelectorAll('.card-size-option').forEach(button => {
        button.addEventListener('click', () => {
            const size = button.dataset.cardSize;
            if (!CARD_SIZES.includes(size) || size === selectedSize) return;
            if (!storageService.save(`card-size-${moduleId}`, size)) {
                showToast('Card size preference could not be saved.', 'error');
                return;
            }
            selectedSize = size;
            container.dataset.cardSize = size;
            container.querySelectorAll('.card-size-option').forEach(option => {
                const isSelected = option.dataset.cardSize === size;
                option.classList.toggle('active', isSelected);
                option.setAttribute('aria-pressed', String(isSelected));
            });
            onChange(size);
        });
    });
}
