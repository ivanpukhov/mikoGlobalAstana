import {
    ActionIcon,
    Badge,
    Box,
    Burger,
    Center,
    Combobox,
    Flex,
    Group,
    Input,
    Paper,
    Text,
    useCombobox,
    useMantineTheme,
    rem,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
    IconMapPin,
    IconSearch,
    IconShoppingCart,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import api from '../../api/api';
import { CityModal } from '../CityModal/CityModal';
import logo from '../../images/logo.svg';
import styles from './Header.module.scss';

function getCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '{}');
    return Object.values(cart).reduce((sum, item) => sum + (item?.quantity || 0), 0);
}

export const Header = ({ selectedCity, onCityChange }) => {
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);
    const [cartCount, setCartCount] = useState(getCartCount);

    const navigate = useNavigate();
    const combobox = useCombobox();
    const inputRef = useRef(null);

    // Re-read cart count on window focus so badge stays fresh after add-to-cart
    useEffect(() => {
        const refresh = () => setCartCount(getCartCount());
        window.addEventListener('focus', refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener('focus', refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    const fetchSuggestions = async (value) => {
        try {
            const res = await api.get(`/products/suggestions/?query=${value}`);
            setSuggestions(res.data || []);
            combobox.openDropdown();
        } catch {
            // silent
        }
    };

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (val.trim()) {
            fetchSuggestions(val);
        } else {
            setSuggestions([]);
            combobox.closeDropdown();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && query.trim()) {
            navigate(`/search/${query}`);
            combobox.closeDropdown();
        }
    };

    const handleSelect = (val) => {
        navigate(`/search/${val}`);
        setQuery('');
        combobox.closeDropdown();
    };

    const options = [
        ...(query.trim()
            ? [
                  <Combobox.Option value={query} key="__raw__">
                      <Group gap="xs">
                          <IconSearch size={14} />
                          <span>Искать «{query}»</span>
                      </Group>
                  </Combobox.Option>,
              ]
            : []),
        ...suggestions.map((s) => (
            <Combobox.Option value={s} key={s}>
                {s}
            </Combobox.Option>
        )),
    ];

    return (
        <header className={styles.header}>
            <div className={`${styles.header__inner} container`}>
                {/* Logo */}
                <Link to="/" className={styles.header__logo}>
                    <img src={logo} alt="Miko" />
                </Link>

                {/* Catalog button — hidden on mobile */}
                {!isMobile && (
                    <Link to="/categories" className={styles.header__catalog}>
                        <Burger color="#fff" size={18} opened={false} />
                        <span>Каталог</span>
                    </Link>
                )}

                {/* Search */}
                <Combobox store={combobox} onOptionSubmit={handleSelect}>
                    <Combobox.Target>
                        <Input
                            ref={inputRef}
                            className={styles.header__search}
                            leftSection={<IconSearch size={18} color="#aaa" />}
                            placeholder={isMobile ? 'Поиск…' : 'Найти на Miko'}
                            value={query}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => query.trim() && combobox.openDropdown()}
                            onBlur={() => setTimeout(() => combobox.closeDropdown(), 150)}
                            radius="md"
                            size={isMobile ? 'sm' : 'md'}
                        />
                    </Combobox.Target>
                    {options.length > 0 && (
                        <Combobox.Dropdown>
                            <Combobox.Options>{options}</Combobox.Options>
                        </Combobox.Dropdown>
                    )}
                </Combobox>

                {/* Right actions */}
                <Group gap={isMobile ? 6 : 12} wrap="nowrap">
                    {/* Cart */}
                    <Link to="/cart" className={styles.header__action}>
                        <Box pos="relative" display="inline-flex">
                            <ActionIcon
                                variant="subtle"
                                color="white"
                                size={isMobile ? 'md' : 'lg'}
                                aria-label="Корзина"
                            >
                                <IconShoppingCart
                                    size={isMobile ? 22 : 26}
                                    color="#fff"
                                />
                            </ActionIcon>
                            {cartCount > 0 && (
                                <Badge
                                    size="xs"
                                    color="red"
                                    variant="filled"
                                    pos="absolute"
                                    top={-4}
                                    right={-4}
                                    style={{ pointerEvents: 'none', minWidth: rem(18), padding: '0 4px' }}
                                >
                                    {cartCount > 99 ? '99+' : cartCount}
                                </Badge>
                            )}
                        </Box>
                        {!isMobile && (
                            <Text size="sm" fw={500} c="white">
                                Корзина
                            </Text>
                        )}
                    </Link>

                    {/* City */}
                    <Box
                        className={styles.header__action}
                        onClick={() => setIsCityModalOpen(true)}
                        style={{ cursor: 'pointer' }}
                    >
                        <ActionIcon
                            variant="subtle"
                            color="white"
                            size={isMobile ? 'md' : 'lg'}
                            aria-label="Выбрать город"
                        >
                            <IconMapPin size={isMobile ? 20 : 24} color="#fff" />
                        </ActionIcon>
                        {!isMobile && selectedCity && (
                            <Text size="sm" fw={500} c="white" style={{ whiteSpace: 'nowrap' }}>
                                {selectedCity.name}
                            </Text>
                        )}
                    </Box>
                </Group>
            </div>

            {isCityModalOpen && (
                <CityModal
                    open={isCityModalOpen}
                    onClose={() => setIsCityModalOpen(false)}
                    onCitySelect={(city) => {
                        onCityChange(city);
                        setIsCityModalOpen(false);
                    }}
                />
            )}
        </header>
    );
};
