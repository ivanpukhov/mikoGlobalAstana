import { Box, Grid, SimpleGrid } from '@mantine/core';
import { HeroCarousel } from '../HeroCarousel/HeroCarousel';
import { CategoryTile } from '../CategoryTile/CategoryTile';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import styles from './MainTop.module.scss';
import banner from '../../images/bbner.png';
import bannergift from '../../images/bannergift.jpg';

const SLIDES = [
    { image: banner, alt: 'Главный баннер' },
    { image: bannergift, alt: 'Подарочные сертификаты', href: '/gift-certificates' },
];

export const MainTop = ({ categories = [], loading = false }) => {
    const topCategories = categories.slice(0, 12);

    return (
        <Box className={styles.mainTop}>
            <Grid gutter={{ base: 'md', md: 'xl' }} align="stretch">
                <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex' }}>
                    <HeroCarousel slides={SLIDES} fillHeight />
                </Grid.Col>

                {topCategories.length > 0 && (
                    <Grid.Col span={{ base: 12, md: 6 }}>
                        <Box style={{ height: '100%' }}>
                            <SectionHeader
                                title="Категории"
                                to="/categories"
                                linkLabel="Все категории"
                            />
                            <SimpleGrid
                                cols={{ base: 2, sm: 3, md: 4 }}
                                spacing={{ base: 'sm', md: 'md' }}
                            >
                                {loading
                                    ? Array.from({ length: 12 }).map((_, index) => (
                                        <Box key={index} className={styles.skeletonTile} />
                                    ))
                                    : topCategories.map((category) => (
                                        <CategoryTile
                                            key={category.id}
                                            to={`/catalog/${category.id}`}
                                            name={category.name}
                                        />
                                    ))}
                            </SimpleGrid>
                        </Box>
                    </Grid.Col>
                )}
            </Grid>
        </Box>
    );
};
