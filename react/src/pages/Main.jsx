import {MainTop} from "../components/MainTop/MainTop";
import {ProductsList} from "../components/Products/ProductsList";
import GiftCertificatesShop from "./GiftCertificatesShop";
import styles from "../components/Products/ProductsList.module.scss";
import React from "react";
import {Link} from "react-router-dom";

export const Main = () => {
    return (
        <div className='main'>
            <MainTop/>
            <div className="ads">
                <div>
                    <div className="ads__title">
                        Новинка! Подарочные сертификаты!
                    </div>
                    <div className="ads__sub">
                        Выберите тематику и номинал – дарите радость легко!
                    </div>
                </div>
                <Link to={'/gift-certificates'} className="ads__btn">
                    Перейти
                </Link>
            </div>

            <ProductsList title={'Топ товары'}/>

        </div>
    )
}
