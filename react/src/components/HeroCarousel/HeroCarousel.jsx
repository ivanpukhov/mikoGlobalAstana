import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import classes from './HeroCarousel.module.css';

export const HeroCarousel = ({ slides = [], fillHeight = false }) => {
    const rootClassName = [classes.root, fillHeight && classes.rootFill].filter(Boolean).join(' ');
    const slideClassName = [classes.slide, fillHeight && classes.slideFill].filter(Boolean).join(' ');

    return (
        <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 4500, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            loop
            className={rootClassName}
        >
            {slides.map((slide, index) => (
                <SwiperSlide key={`${slide.image}-${index}`}>
                    <div className={slideClassName}>
                        <div className={classes.slideInner}>
                            {slide.href ? (
                                <Link to={slide.href} className={classes.link}>
                                    <img
                                        src={slide.image}
                                        alt={slide.alt || `banner-${index}`}
                                        className={classes.image}
                                    />
                                </Link>
                            ) : (
                                <img
                                    src={slide.image}
                                    alt={slide.alt || `banner-${index}`}
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
