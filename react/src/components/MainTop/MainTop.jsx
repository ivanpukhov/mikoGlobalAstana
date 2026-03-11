import React, {useEffect, useState} from "react";
import banner1 from "../../images/bannner3.webp";
import banner11 from "../../images/1.webp";
import banner12 from "../../images/2.webp";
import banner13 from "../../images/3.webp";
import banner14 from "../../images/4.webp";
import banner15 from "../../images/5.webp";
import banner16 from "../../images/6.webp";
import banner from "../../images/bbner.png";
import kpop from "../../images/catalog/kpop.png";
import bads from "../../images/catalog/bads.png";
import hoz from "../../images/catalog/hoz.png";
import cosmetic from "../../images/catalog/cosmetic.png";
import products from "../../images/catalog/products.png";
import icon from "../../images/catalog/icon.svg";
import styles from "./MainTop.module.scss";
import {Link} from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../api/api"; // Модуль для API-запросов
import {Swiper, SwiperSlide} from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import {Autoplay} from "swiper/modules";

export const MainTop = () => {
    const [categories, setCategories] = useState([]);

    // Конфигурация для визуализации ссылок
    const linksConfig = [
        {name: "Продукты", image: products, color: "#3099B6"},
        {name: "Косметика", image: cosmetic, color: "#ED712D"},
        {name: "БАДы", image: bads, color: "#5d87c5"},
        {name: "Бытовая химия", image: hoz, color: "#30B67E"},
        {name: "Уход за волосами", image: kpop, color: "#c5695d"},
    ];

    useEffect(() => {
        // Запрос категорий с API
        const fetchCategories = async () => {
            try {
                const response = await api.get("/categories");
                setCategories(response.data); // Сохраняем данные в состояние
            } catch (error) {
                console.error("Ошибка при загрузке категорий:", error);
            }
        };
        fetchCategories();
    }, []);

    // Функция для получения ID категории по имени
    const getCategoryId = (categoryName) => {
        const category = categories.find((cat) => cat.name === categoryName);
        return category ? category.id : null;
    };

    // Функция обработки клика
    const handleLinkClick = (categoryName) => {
        const categoryId = getCategoryId(categoryName);
        if (!categoryId) {
            // Показываем уведомление, если категория отсутствует
            Swal.fire({
                title: "Категория недоступна",
                text: `Извините, но товары для категории "${categoryName}" пока не добавлены.`,
                icon: "info",
                confirmButtonText: "Понятно",
                confirmButtonColor: "#0CE3CB",
            });
            return null;
        }
        return `/catalog/${categoryId}`; // Возвращаем корректный маршрут
    };

    return (
        <div className={styles.mainTop}>

            <Swiper
                modules={[Autoplay]}
                autoplay={{delay: 2500, disableOnInteraction: false}}
                loop={true}
                slidesPerView={1}
                className={styles["mainTop__banner"]}
            >
                <SwiperSlide>
                    <img src={banner} alt="Banner 1" className="w-full h-auto"/>
                </SwiperSlide>
                <SwiperSlide>
                    <img src={banner12} alt="Banner 1" className="w-full h-auto"/>
                </SwiperSlide>
                <SwiperSlide>
                    <Link to={'/test'}><img src={banner1} alt="Banner 2" className="w-full h-auto"/></Link>
                </SwiperSlide>

            </Swiper>

            <div className={styles["mainTop__catalog"]}>
                <div className={styles["mainTop__catalog--title"]}>Каталог</div>
                {linksConfig.map((link, index) => (
                    <Link
                        key={index}
                        to={getCategoryId(link.name) ? `/catalog/${getCategoryId(link.name)}` : "/"}
                        style={{background: link.color}}
                        className={styles["mainTop__catalog--item"]}
                        onClick={(e) => {
                            const categoryId = getCategoryId(link.name);
                            if (!categoryId) {
                                e.preventDefault(); // Отменяем переход
                                handleLinkClick(link.name);
                            }
                        }}
                    >
                        <div className={styles["mainTop__catalog--text"]}>{link.name}</div>
                        <div className={styles["mainTop__catalog--img"]}>
                            <img src={link.image} alt={link.name}/>
                        </div>
                    </Link>

                ))}
                <Link
                    to="/categories"
                    style={{background: "#0CE3CB"}}
                    className={styles["mainTop__catalog--item"]}
                >
                    <div className={styles["mainTop__catalog--text"]}>Смотреть все</div>
                    <div className={styles["icon"]}>
                        <img src={icon} alt="Смотреть все"/>
                    </div>
                </Link>
            </div>
        </div>
    );
};
