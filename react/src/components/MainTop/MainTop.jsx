import { Box, Grid, SimpleGrid } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { HeroCarousel } from '../HeroCarousel/HeroCarousel';
import { CategoryTile } from '../CategoryTile/CategoryTile';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import styles from './MainTop.module.scss';

export const MainTop = ({ categories = [], loading = false }) => {
    const [slides, setSlides] = useState([]);
    const [slidesLoading, setSlidesLoading] = useState(true);
    const topCategories = categories.slice(0, 7);
    const tiles = [
        ...topCategories,
        {
            id: 'all-categories',
            name: 'Смотреть все',
            to: '/categories',
            isSeeAll: true,
        },
    ];

    useEffect(() => {
        let cancelled = false;

        api.get('/banners')
            .then(({ data }) => {
                if (!cancelled) {
                    setSlides(Array.isArray(data) ? data : []);
                    setSlidesLoading(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSlides([]);
                    setSlidesLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <Box className={styles.mainTop}>
            <Grid gutter={{ base: 'md', md: 'xl' }} align="stretch">
                <Grid.Col span={{ base: 12, md: 6 }} style={{ display: 'flex' }}>
                    <HeroCarousel slides={slides} loading={slidesLoading} fillHeight />
                </Grid.Col>

                {(topCategories.length > 0 || loading) && (
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
                                    ? Array.from({ length: 8 }).map((_, index) => (
                                        <Box key={index} className={styles.skeletonTile} />
                                    ))
                                    : tiles.map((category) =>
                                          category.isSeeAll ? (
                                              <Link
                                                  key={category.id}
                                                  to={category.to}
                                                  className={styles.seeAllTile}
                                              >
                                                  <span className={styles.seeAllText}>{category.name}</span>
                                              </Link>
                                          ) : (
                                              <CategoryTile
                                                  key={category.id}
                                                  to={`/catalog/${category.id}`}
                                                  name={category.name}
                                              />
                                          )
                                      )}
                            </SimpleGrid>
                        </Box>
                    </Grid.Col>
                )}
            </Grid>
        </Box>
    );
};
