export const TEXT_BANNER_BACKGROUNDS = [
    {
        value: 'sunset',
        label: 'Тёплый оранжевый',
        style: 'linear-gradient(135deg, #ff6a52 0%, #ff8a45 46%, #ffd77e 100%)',
    },
    {
        value: 'mint',
        label: 'Свежий мятный',
        style: 'linear-gradient(135deg, #0ce3cb 0%, #1d9a8c 100%)',
    },
    {
        value: 'berry',
        label: 'Ягодный',
        style: 'linear-gradient(135deg, #ef476f 0%, #ff7a59 100%)',
    },
    {
        value: 'night',
        label: 'Тёмный синий',
        style: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
    },
];

export const BANNER_TYPE_OPTIONS = [
    { value: 'image', label: 'Изображение' },
    { value: 'image_link', label: 'Изображение со ссылкой' },
    { value: 'text', label: 'Текстовый баннер' },
];

export const getBannerBackgroundStyle = (value) =>
    TEXT_BANNER_BACKGROUNDS.find((item) => item.value === value)?.style ||
    TEXT_BANNER_BACKGROUNDS[0].style;
