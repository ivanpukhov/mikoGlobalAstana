import {NavLink} from "react-router-dom";
import homeActive from "../../images/bar/home__active.svg";
import homeBtn from "../../images/bar/home.svg";
import catalogActive from "../../images/bar/catalog__active.svg";
import catalogBtn from "../../images/bar/catalog.svg";
import favoriteActive from "../../images/bar/favorite__active.svg";
import favoriteBtn from "../../images/bar/favorite.svg";
import shopActive from "../../images/bar/shop__active.svg";
import shopBtn from "../../images/bar/shop.svg";
import React from "react";
import './Bar.scss'

const BarMobile = () => {
    return(
        <div className="barMobile dn">
            <div className="barMobile__item">
                <NavLink to="/">
                    {({isActive}) => (<img src={isActive ? homeActive : homeBtn} alt="Home"/>)}
                </NavLink>
            </div>
            <div className="barMobile__item">
                <NavLink to="/categories">
                    {({isActive}) => (<img src={isActive ? catalogActive : catalogBtn} alt="Home"/>)}
                </NavLink>
            </div>
            <div className="barMobile__item">
                <NavLink to="/favorite">
                    {({isActive}) => (<img src={isActive ? favoriteActive : favoriteBtn} alt="Home"/>)}
                </NavLink>
            </div>
            <div className="barMobile__item">
                <NavLink to="/cart">
                    {({isActive}) => (<img src={isActive ? shopActive : shopBtn} alt="Home"/>)}
                </NavLink>
            </div>


        </div>


    )
}

export default BarMobile
