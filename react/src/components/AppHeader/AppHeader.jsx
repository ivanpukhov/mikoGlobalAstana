import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ActionIcon,
    Autocomplete,
    Box,
    Container,
    Group,
    Image,
    Indicator,
    Stack,
    Text,
    UnstyledButton,
} from '@mantine/core';
import {
    IconCategory,
    IconMapPin,
    IconSearch,
    IconShoppingCart,
} from '@tabler/icons-react';
import logo from '../../images/logo.svg';
import api from '../../api/api';
import { useCart } from '../../hooks/useCart';
import classes from './AppHeader.module.css';

const fetchSuggestions = async (query) => {
    if (!query || !query.trim()) {
        return [];
    }

    try {
        const { data } = await api.get(`/products/suggestions/?query=${encodeURIComponent(query)}`);
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
};

export const AppHeader = ({ selectedCity, onOpenCityModal }) => {
    const navigate = useNavigate();
    const cart = useCart();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(async () => {
            const nextSuggestions = await fetchSuggestions(query);
            if (!cancelled) {
                setSuggestions(nextSuggestions);
            }
        }, 220);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query]);

    const submitSearch = (value) => {
        const nextValue = (value ?? query).trim();
        if (!nextValue) {
            return;
        }

        setQuery('');
        setSuggestions([]);
        navigate(`/search/${encodeURIComponent(nextValue)}`);
    };

    return (
        <Box component="header" className={classes.root}>
            <Container size="xl" className={classes.inner}>
                <UnstyledButton component={Link} to="/" className={classes.logo}>
                    <Image src={logo} alt="Miko" h={36} w="auto" fit="contain" />
                </UnstyledButton>

                <UnstyledButton component={Link} to="/categories" className={classes.catalogBtn}>
                    <IconCategory size={20} stroke={2} />
                    <Text fw={600} fz="sm" c="white">
                        Каталог
                    </Text>
                </UnstyledButton>

                <Autocomplete
                    className={classes.search}
                    placeholder="Найти на Miko"
                    value={query}
                    onChange={setQuery}
                    onOptionSubmit={(value) => submitSearch(value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            submitSearch();
                        }
                    }}
                    data={suggestions}
                    leftSection={<IconSearch size={18} />}
                    radius="md"
                    size="md"
                    comboboxProps={{ shadow: 'md' }}
                />

                <Group gap={6} wrap="nowrap" className={classes.actions}>
                    <UnstyledButton onClick={onOpenCityModal} className={classes.cityBtn}>
                        <Stack gap={0}>
                            <Group gap={4} wrap="nowrap">
                                <IconMapPin size={14} color="rgba(255,255,255,0.8)" />
                                <Text fz={11} c="rgba(255,255,255,0.7)">
                                    Город
                                </Text>
                            </Group>
                            <Text fz="sm" fw={600} c="white" lineClamp={1}>
                                {selectedCity?.name || 'Выбрать'}
                            </Text>
                        </Stack>
                    </UnstyledButton>

                    <Indicator
                        label={cart.count}
                        size={16}
                        color="red"
                        disabled={cart.count === 0}
                        offset={6}
                    >
                        <ActionIcon
                            component={Link}
                            to="/cart"
                            variant="subtle"
                            color="white"
                            size="xl"
                            radius="md"
                            aria-label="Корзина"
                            style={{ color: '#fff' }}
                        >
                            <IconShoppingCart size={22} />
                        </ActionIcon>
                    </Indicator>
                </Group>
            </Container>
        </Box>
    );
};
