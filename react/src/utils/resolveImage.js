import placeholder from '../images/products/i.jpg';

const BASE = '/api';

export function resolveImage(image, fallback = placeholder) {
    if (!image) {
        return fallback;
    }

    if (image.startsWith('http')) {
        return image;
    }

    return `${BASE}${image}`;
}
