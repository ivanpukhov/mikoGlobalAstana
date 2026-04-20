import * as TablerIcons from '@tabler/icons-react';

const EXCLUDED_EXPORTS = new Set([
    'createReactComponent',
    'icons',
    'iconsList',
    'default',
]);

export const TABLER_ICON_OPTIONS = Object.entries(TablerIcons)
    .filter(([name, value]) =>
        name.startsWith('Icon') &&
        !EXCLUDED_EXPORTS.has(name) &&
        typeof value === 'function'
    )
    .sort(([left], [right]) => left.localeCompare(right, 'en'));

export const TABLER_ICON_MAP = Object.fromEntries(TABLER_ICON_OPTIONS);

export const findTablerIcon = (iconName) => TABLER_ICON_MAP[iconName] || null;
