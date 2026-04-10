import {useState} from "react";
import styles from "./ProductItem.module.scss"; // Импорт CSS-модуля
import products from "../../images/products/12.webp";
import favorite from "../../images/favorite.svg";
import {Link} from "react-router-dom";
import { formatCurrency } from "../../utils/formatters";

export const ProductItem = () => {
    const [cart, setCart] = useState(false);
    const [isfavorite, setIsFavorite] = useState(true);

    const AddToCart = () => {
        setCart(!cart);
    };


    const AddToWishList = () => {
        setIsFavorite(!isfavorite);
    };

    return (
        <div className={styles["products__item"]}>
            <div className={styles["products__item--img"]}>

                <Link to={'/product'} ><img src={products} alt=""/></Link>
                <div className={styles["favorite"]} style={isfavorite ? {background: "#0CE3CB"} : {background: "red"}}
                     onClick={AddToWishList}>
                    <img src={favorite} alt=""/>
                </div>
            </div>
            <Link to={'/product'} className={styles["products__item--name"]}>
                Острый соус куриный Buldak Karbonara Hot Chicken Sauce, 200гр.
            </Link>
            <div className={styles["products__item--price"]}>
                <span className={styles["price"]}>{formatCurrency(2470)}</span>
                <span className={styles["subprice"]}>{formatCurrency(2600)}</span>
            </div>
            {cart ? (
                <Link to={'/cart'} className={styles["products__item--btn"]}>
                   Оформить
                </Link>
            ) : (
                <div className={styles["products__item--btn"]} onClick={AddToCart}>
                    В корзину
                </div>
            )}
        </div>
    );
};
