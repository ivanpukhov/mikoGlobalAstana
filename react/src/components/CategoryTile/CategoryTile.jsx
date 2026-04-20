import { Link } from 'react-router-dom';
import { Box, Stack, Text } from '@mantine/core';
import { getCategoryIcon } from '../../utils/categoryIcon';
import classes from './CategoryTile.module.css';

export const CategoryTile = ({ to, name }) => {
    const Icon = getCategoryIcon(name);

    return (
        <Link to={to} className={classes.tile}>
            <Stack gap={8} align="center">
                <Box className={classes.iconWrap}>
                    <Icon size={32} stroke={1.5} color="var(--mantine-color-miko-7)" />
                </Box>
                <Text fz="sm" fw={600} ta="center" lineClamp={2} className={classes.label}>
                    {name}
                </Text>
            </Stack>
        </Link>
    );
};
