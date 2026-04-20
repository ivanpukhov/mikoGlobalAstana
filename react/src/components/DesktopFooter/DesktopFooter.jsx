import { Link } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    Divider,
    Group,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
} from '@mantine/core';
import {
    IconChevronRight,
    IconGift,
    IconMapPin,
    IconSearch,
    IconShoppingBag,
} from '@tabler/icons-react';
import logo from '../../images/logo.svg';
import classes from './DesktopFooter.module.css';

const SHOP_LINKS = [
    { to: '/categories', label: 'Каталог' },
    { to: '/gift-certificates', label: 'Подарочные сертификаты' },
    { to: '/cart', label: 'Корзина' },
    { to: '/search/miko', label: 'Поиск товаров' },
];

const HELP_LINKS = [
    { to: '/gift-certificates', label: 'Как выбрать сертификат' },
    { to: '/test', label: 'Тест по уходу' },
    { to: '/categories', label: 'Популярные категории' },
];

export const DesktopFooter = ({ selectedCity }) => {
    const year = new Date().getFullYear();

    return (
        <Box component="footer" className={classes.root}>
            <Container size="xl" className={classes.container}>
                <SimpleGrid cols={{ md: 2, lg: 4 }} spacing={{ md: 'xl', lg: 40 }}>
                    <Stack gap="md">
                        <Link to="/" className={classes.logoLink}>
                            <img src={logo} alt="Miko" className={classes.logo} />
                        </Link>
                        <Text className={classes.lead}>
                            Онлайн-витрина с акцентом на быстрый поиск, понятную навигацию и
                            покупки с учётом выбранного города.
                        </Text>
                        <Group gap="sm" align="flex-start" wrap="nowrap">
                            <ThemeIcon size={42} radius="xl" variant="light" color="white">
                                <IconMapPin size={20} />
                            </ThemeIcon>
                            <Stack gap={2}>
                                <Text className={classes.kicker}>Ваш город</Text>
                                <Text className={classes.city}>
                                    {selectedCity?.name || 'Выберите город для актуального наличия'}
                                </Text>
                            </Stack>
                        </Group>
                    </Stack>

                    <Stack gap="sm">
                        <Text className={classes.title}>Покупки</Text>
                        {SHOP_LINKS.map((item) => (
                            <Link key={item.to} to={item.to} className={classes.link}>
                                <IconChevronRight size={16} />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </Stack>

                    <Stack gap="sm">
                        <Text className={classes.title}>Полезное</Text>
                        {HELP_LINKS.map((item) => (
                            <Link key={item.to} to={item.to} className={classes.link}>
                                <IconChevronRight size={16} />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </Stack>

                    <Stack gap="md" className={classes.ctaCard}>
                        <Group gap="sm" wrap="nowrap" align="flex-start">
                            <ThemeIcon size={44} radius="xl" variant="white" color="miko">
                                <IconShoppingBag size={22} />
                            </ThemeIcon>
                            <Stack gap={2}>
                                <Text className={classes.cardTitle}>Удобно покупать</Text>
                                <Text className={classes.cardText}>
                                    На главной и в каталоге показываются товары с учётом выбранного
                                    города и текущего наличия.
                                </Text>
                            </Stack>
                        </Group>

                        <Group gap="sm" wrap="nowrap" align="flex-start">
                            <ThemeIcon size={44} radius="xl" variant="white" color="miko">
                                <IconGift size={22} />
                            </ThemeIcon>
                            <Stack gap={2}>
                                <Text className={classes.cardTitle}>Подарки и сертификаты</Text>
                                <Text className={classes.cardText}>
                                    Сертификат можно выбрать и оформить прямо на сайте за пару минут.
                                </Text>
                            </Stack>
                        </Group>

                        <Button
                            component={Link}
                            to="/search/miko"
                            color="white"
                            c="miko.8"
                            radius="xl"
                            leftSection={<IconSearch size={16} />}
                        >
                            Найти товар
                        </Button>
                    </Stack>
                </SimpleGrid>

                <Divider className={classes.divider} color="rgba(255,255,255,0.18)" />

                <Group justify="space-between" align="center" className={classes.bottom}>
                    <Text className={classes.copy}>Miko, {year}. Все права защищены.</Text>
                    <Link to="/gift-certificates" className={classes.bottomLink}>
                        <IconGift size={16} />
                        <span>Подарочные сертификаты</span>
                    </Link>
                </Group>
            </Container>
        </Box>
    );
};
