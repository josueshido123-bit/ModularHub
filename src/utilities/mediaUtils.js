export const DEFAULT_MEDIA_SCALE = 1.5;
export const MIN_MEDIA_SCALE = 1;
export const MAX_MEDIA_SCALE = 2.5;

export async function readMediaFile(file) {
    if (!file.type.startsWith('image/') || ['image/gif', 'image/svg+xml'].includes(file.type)) {
        return readFileAsDataUrl(file);
    }

    let bitmap;
    try {
        bitmap = await createImageBitmap(file);
        const maxDimension = 1600;
        const ratio = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
        canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image processing is unavailable in this browser.');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        for (let attempt = 0; attempt < 5; attempt += 1) {
            const quality = 0.82 - attempt * 0.12;
            const dataUrl = await canvasToDataUrl(canvas, quality);
            if (dataUrl.length <= 350_000) return dataUrl;
            canvas.width = Math.max(1, Math.round(canvas.width * 0.8));
            canvas.height = Math.max(1, Math.round(canvas.height * 0.8));
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        }

        return await canvasToDataUrl(canvas, 0.3);
    } finally {
        bitmap?.close();
    }
}

function canvasToDataUrl(canvas, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (!blob) {
                reject(new Error('The selected image could not be optimized.'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('The optimized image could not be read.'));
            reader.readAsDataURL(blob);
        }, 'image/webp', quality);
    });
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error('The media file could not be read.'));
        reader.readAsDataURL(file);
    });
}

export function normalizeMediaPosition(position = '50% 50%') {
    const values = String(position || '50% 50%').split(/\s+/).slice(0, 2).map(value => {
        const parsed = Number.parseFloat(value);
        return `${Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 50}%`;
    });
    return `${values[0] || '50%'} ${values[1] || '50%'}`;
}

export function normalizeMediaScale(value = DEFAULT_MEDIA_SCALE) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(MIN_MEDIA_SCALE, Math.min(MAX_MEDIA_SCALE, parsed)) : DEFAULT_MEDIA_SCALE;
}

export function mediaTransform(position = '50% 50%', scale = DEFAULT_MEDIA_SCALE) {
    const [xValue, yValue] = normalizeMediaPosition(position).split(/\s+/);
    const x = Number.parseFloat(xValue);
    const y = Number.parseFloat(yValue);
    const zoom = normalizeMediaScale(scale);
    return `translate3d(${(x - 50) * (zoom - 1)}%, ${(y - 50) * (zoom - 1)}%, 0) scale(${zoom})`;
}

export function mediaStyle(position = '50% 50%', size = 'card', scale = DEFAULT_MEDIA_SCALE) {
    const transform = size === 'history' ? 'none' : mediaTransform(position, scale);
    return `object-position:50% 50%;transform:${transform};transform-origin:50% 50%`;
}

export function ensureMediaScaleControl(container, editor, initialScale = DEFAULT_MEDIA_SCALE) {
    const form = editor?.closest('form');
    if (!form || !editor) return null;

    let positionInput = form.querySelector('[name="mediaPosition"]');
    if (!positionInput) {
        positionInput = document.createElement('input');
        positionInput.type = 'hidden';
        positionInput.name = 'mediaPosition';
        positionInput.value = editor.dataset.position || '50% 50%';
        form.append(positionInput);
    }

    let scaleInput = form.querySelector('[name="mediaScale"]');
    let scaleOutput = form.querySelector('.media-scale-value');
    if (!scaleInput) {
        const control = document.createElement('div');
        control.className = 'media-scale-control';
        const heading = document.createElement('div');
        heading.className = 'media-scale-heading';
        const label = document.createElement('label');
        label.textContent = 'Media size';
        scaleOutput = document.createElement('output');
        scaleOutput.className = 'media-scale-value';
        heading.append(label, scaleOutput);
        scaleInput = document.createElement('input');
        scaleInput.type = 'range';
        scaleInput.name = 'mediaScale';
        scaleInput.className = 'media-scale-range';
        scaleInput.setAttribute('aria-label', 'Media size');
        scaleInput.min = String(MIN_MEDIA_SCALE);
        scaleInput.max = String(MAX_MEDIA_SCALE);
        scaleInput.step = '0.05';
        scaleInput.value = String(normalizeMediaScale(initialScale));
        control.append(heading, scaleInput);
        const previewWrap = editor.closest('.gacha-preview-wrap');
        const hint = editor.nextElementSibling?.tagName === 'SMALL' ? editor.nextElementSibling : null;
        (previewWrap || hint || editor).after(control);
    }

    const scale = normalizeMediaScale(scaleInput.value || initialScale);
    scaleInput.value = String(scale);
    if (scaleOutput) scaleOutput.value = `${Math.round(scale * 100)}%`;
    return { positionInput, scaleInput, scaleOutput };
}

export function bindMediaEditor(editor, positionInput, scaleInput, scaleOutput = null) {
    const applyTransform = () => {
        const media = editor.querySelector('img, video');
        if (!media) return;
        const position = normalizeMediaPosition(positionInput?.value || editor.dataset.position);
        const scale = normalizeMediaScale(scaleInput?.value);
        media.style.transform = mediaTransform(position, scale);
        editor.dataset.position = position;
        editor.dataset.scale = String(scale);
        if (scaleOutput) scaleOutput.value = `${Math.round(scale * 100)}%`;
    };

    if (scaleInput && scaleInput.dataset.mediaScaleBound !== 'true') {
        scaleInput.dataset.mediaScaleBound = 'true';
        scaleInput.addEventListener('input', applyTransform);
    }
    applyTransform();

    if (!editor || editor.dataset.bound === 'true' || !editor.querySelector('img, video')) return;
    editor.dataset.bound = 'true';

    editor.addEventListener('pointerdown', event => {
        if (event.target.closest('input, button, select, textarea')) return;
        const scale = normalizeMediaScale(scaleInput?.value);
        if (scale <= MIN_MEDIA_SCALE) return;
        event.preventDefault();
        try { editor.setPointerCapture(event.pointerId); } catch {}
        const rect = editor.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const [startPositionX, startPositionY] = normalizeMediaPosition(positionInput?.value || editor.dataset.position)
            .split(/\s+/).map(value => Number.parseFloat(value));
        const move = moveEvent => {
            const currentScale = normalizeMediaScale(scaleInput?.value);
            const panFactor = currentScale - 1;
            if (panFactor <= 0) return;
            const x = Math.max(0, Math.min(100, startPositionX + ((moveEvent.clientX - startX) / rect.width) * (100 / panFactor)));
            const y = Math.max(0, Math.min(100, startPositionY + ((moveEvent.clientY - startY) / rect.height) * (100 / panFactor)));
            const position = `${Math.round(x)}% ${Math.round(y)}%`;
            if (positionInput) positionInput.value = position;
            editor.dataset.position = position;
            applyTransform();
        };
        const stop = () => {
            editor.removeEventListener('pointermove', move);
            editor.removeEventListener('pointerup', stop);
            editor.removeEventListener('pointercancel', stop);
        };
        editor.addEventListener('pointermove', move);
        editor.addEventListener('pointerup', stop, { once: true });
        editor.addEventListener('pointercancel', stop, { once: true });
    });
}