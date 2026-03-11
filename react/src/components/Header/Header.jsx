import logo from '../../images/logo.svg';
import search from '../../images/search.svg';
import searchMobile from '../../images/searchMobile.svg';
import burger from '../../images/burger.svg';
import favorite from '../../images/favorite.svg';
import cart from '../../images/cart.svg';
import styles from './Header.module.scss';
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../../api/api";
import {CityModal} from "../CityModal/CityModal";
export const Header = ({ selectedCity, onCityChange }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();

    const [isCityModalOpen, setIsCityModalOpen] = useState(false);

    const handleFavoriteClick = () => {
        setIsCityModalOpen(true);
    };

    const handleCitySelect = (city) => {
        onCityChange(city);
        setIsCityModalOpen(false);
    };

    const fetchSuggestions = async (searchQuery) => {
        try {
            const response = await api.get(`/products/suggestions/?query=${searchQuery}`);
            setSuggestions(response.data);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        if (value.trim() !== '') {
            fetchSuggestions(value);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleInputBlur = () => {
        setTimeout(() => {
            setShowSuggestions(false);
        }, 500);
    };

    const handleSuggestionClick = () => {
        setQuery('');
        setShowSuggestions(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && query.trim() !== '') {
            navigate(`/search/${query}`);
            setShowSuggestions(false);
        }
    };

    return (
        <header className={styles.header}>
            <div className={`${styles.header__block} container`}>
                <Link to='/' className={styles.header__logo}>
                    <img src={logo} alt=""/>
                </Link>
                <Link to={'/categories'} className={styles.header__catalog}>
                    <img src={burger} alt=""/>
                    <span>Каталог</span>
                </Link>
                <label htmlFor="search" className={styles.header__search}>
                    <img src={search} alt=""/>
                    <img src={searchMobile} alt=""/>
                    <input
                        type="text"
                        placeholder='Найти на miko'
                        id='search'
                        value={query}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onFocus={() => query.trim() && setShowSuggestions(true)}
                        onKeyDown={handleKeyDown}
                    />
                </label>
                {showSuggestions && (
                    <ul
                        className={styles.suggestions}
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        {query.trim() && (
                            <li>
                                <Link
                                    to={`/search/${query}`}
                                    onClick={handleSuggestionClick}
                                >
                                    Искать "{query}"
                                </Link>
                            </li>
                        )}
                        {suggestions.map((item, index) => (
                            <li key={index}>
                                <Link to={`/search/${item}`} onClick={handleSuggestionClick}>
                                    {item}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
                <Link to={'/cart'} className={styles.header__catalog}>
                    <img src={cart} alt=""/>
                    <span>Корзина</span>
                </Link>
                <div className={styles.header__catalog} onClick={handleFavoriteClick}>
                    <img src={favorite} alt=""/>
                </div>
                {isCityModalOpen && (
                    <CityModal
                        open={isCityModalOpen}
                        onClose={() => setIsCityModalOpen(false)}
                        onCitySelect={handleCitySelect}
                    />
                )}
            </div>
        </header>
    );
};
