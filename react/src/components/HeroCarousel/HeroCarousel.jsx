import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { getBannerBackgroundStyle } from '../../utils/bannerPresets';
import classes from './HeroCarousel.module.css';

const FALLBACK_SLIDES = [
    {
        id: 'fallback-welcome',
        type: 'text',
        title: 'Добро пожаловать в MIKO',
        description: 'Выбирайте любимые товары онлайн и оформляйте заказ в пару кликов.',
        buttonText: 'Перейти в каталог',
        buttonLink: '/categories',
        background: 'mint',
    },
];

const LOADING_SLIDES = [
    {
        id: 'loading-banner',
        type: 'text',
        title: 'Загрузка баннеров…',
        description: 'Скоро здесь появятся актуальные предложения и ссылки.',
        background: 'night',
    },
];

const isExternalLink = (href = '') => /^https?:\/\//i.test(href);

const resolveBannerImage = (image) => {
    if (!image) {
        return '';
    }

    if (image.startsWith('http')) {
        return image;
    }

    return `/api${image}`;
};

export const HeroCarousel = ({ slides = [], loading = false, fillHeight = false }) => {
    const rootClassName = [classes.root, fillHeight && classes.rootFill].filter(Boolean).join(' ');
    const slideClassName = [classes.slide, fillHeight && classes.slideFill].filter(Boolean).join(' ');
    const normalizedSlides = (Array.isArray(slides) ? slides : []).filter((slide) => {
        if (slide?.type === 'text') {
            return Boolean(slide?.title);
        }

        return Boolean(slide?.image);
    });

    const carouselSlides = normalizedSlides.length > 0
        ? normalizedSlides
        : loading
        ? LOADING_SLIDES
        : FALLBACK_SLIDES;

    const renderLink = (href, className, children) => {
        if (!href) {
            return children;
        }

        if (isExternalLink(href)) {
            return (
                <a href={href} className={className} target="_blank" rel="noreferrer">
                    {children}
                </a>
            );
        }

        return (
            <Link to={href} className={className}>
                {children}
            </Link>
        );
    };

    return (
        <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            loop
            className={rootClassName}
        >
            {carouselSlides.map((slide, index) => (
                <SwiperSlide key={`${slide.id || slide.title || slide.image || 'banner'}-${index}`}>
                    <div
                        className={[
                            slideClassName,
                            slide.type === 'text' ? classes.textSlide : '',
                        ].filter(Boolean).join(' ')}
                        style={
                            slide.type === 'text'
                                ? { background: getBannerBackgroundStyle(slide.background) }
                                : undefined
                        }
                    >
                        <div className={classes.slideInner}>
                            {slide.type === 'text' ? (
                                <div className={classes.textBanner}>
                                    <div className={classes.textContent}>
                                        <span className={classes.eyebrow}>Главная</span>
                                        <h3 className={classes.textTitle}>{slide.title}</h3>
                                        {slide.description && (
                                            <p className={classes.textDescription}>{slide.description}</p>
                                        )}
                                        {slide.buttonText && slide.buttonLink && renderLink(
                                            slide.buttonLink,
                                            classes.slideButton,
                                            <span>{slide.buttonText}</span>
                                        )}
                                    </div>
                                </div>
                            ) : slide.linkUrl ? (
                                renderLink(
                                    slide.linkUrl,
                                    classes.link,
                                    <img
                                        src={resolveBannerImage(slide.image)}
                                        alt={slide.title || `banner-${index}`}
                                        className={classes.image}
                                    />
                                )
                            ) : (
                                <img
                                    src={resolveBannerImage(slide.image)}
                                    alt={slide.title || `banner-${index}`}
                                    className={classes.image}
                                />
                            )}
                        </div>
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
};
