import {MainTop} from "../components/MainTop/MainTop";
import {ProductsList} from "../components/Products/ProductsList";
import GiftCertificatesShop from "./GiftCertificatesShop";
import styles from "../components/Products/ProductsList.module.scss";
import React from "react";
import {Link} from "react-router-dom";
import { formatCurrency } from "../utils/formatters";
import { EVERY_ORDER_GIFT, ORDER_GIFT_TIERS } from "../utils/orderGifts";

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

            <div className="gift-program">
                <div className="gift-program__title">Подарки к заказу</div>
                <div className="gift-program__lead">
                    При каждом заказе подарок: <strong>{EVERY_ORDER_GIFT}</strong>
                </div>
                <div className="gift-program__list">
                    {ORDER_GIFT_TIERS.map((tier) => (
                        <div key={tier.min} className="gift-program__item">
                            <div className="gift-program__range">
                                🎁 При заказе от {formatCurrency(tier.min)}{tier.max !== Number.POSITIVE_INFINITY ? ` до ${formatCurrency(tier.max)}` : ""}
                            </div>
                            <div className="gift-program__gift">{tier.gift}</div>
                        </div>
                    ))}
                </div>
            </div>

            <ProductsList title={'Топ товары'}/>

        </div>
    )
}
