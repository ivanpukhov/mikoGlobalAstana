import { Link } from 'react-router-dom';
import {
    Badge,
    Box,
    Button,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { IconArrowRight, IconGift, IconSparkles } from '@tabler/icons-react';
import { formatCurrency } from '../../utils/formatters';
import classes from './OrderGiftPromo.module.css';

const formatThreshold = (rule) => {
    const minAmount = Number(rule?.minAmount || 0);
    const maxAmount =
        rule?.maxAmount === null || typeof rule?.maxAmount === 'undefined'
            ? null
            : Number(rule.maxAmount);

    if (minAmount <= 0) {
        return 'К каждому заказу';
    }

    if (maxAmount === null) {
        return `При заказе от ${formatCurrency(minAmount)}`;
    }

    return `При заказе от ${formatCurrency(minAmount)} до ${formatCurrency(maxAmount)}`;
};

const formatRangeNote = (rule) => {
    const minAmount = Number(rule?.minAmount || 0);
    const maxAmount =
        rule?.maxAmount === null || typeof rule?.maxAmount === 'undefined'
            ? null
            : Number(rule.maxAmount);

    if (minAmount <= 0) {
        return 'Подарок добавляется автоматически к любому заказу';
    }

    if (maxAmount === null) {
        return 'Чем выше сумма заказа, тем этот подарок доступен';
    }

    return `Диапазон акции: ${formatCurrency(minAmount)} - ${formatCurrency(maxAmount)}`;
};

export const OrderGiftPromo = ({ rules = [], loading = false }) => {
    const items = rules
        .filter((rule) => rule?.product)
        .sort((a, b) => {
            const leftSort = Number(a?.sortOrder || 0);
            const rightSort = Number(b?.sortOrder || 0);

            if (leftSort !== rightSort) {
                return leftSort - rightSort;
            }

            return Number(a?.minAmount || 0) - Number(b?.minAmount || 0);
        });

    if (!loading && items.length === 0) {
        return null;
    }

    return (
        <Box className={classes.section}>
            <Box className={classes.shell}>
                <Stack gap="xl">
                    <Group justify="space-between" align="flex-start" gap="lg" wrap="wrap">
                        <Stack gap="sm" maw={620}>
                            <Group gap="sm">
                                <Badge
                                    variant="white"
                                    color="red"
                                    radius="xl"
                                    size="lg"
                                    leftSection={<IconSparkles size={14} />}
                                >
                                    Акция
                                </Badge>
                                <Badge
                                    variant="light"
                                    color="miko"
                                    radius="xl"
                                    size="lg"
                                    leftSection={<IconGift size={14} />}
                                >
                                    Подарки к заказу
                                </Badge>
                            </Group>

                            <Title order={2} className={classes.title}>
                                Выбирайте товары и получайте подарок за сумму заказа
                            </Title>

                            <Text className={classes.description}>
                                На главной сразу видно, какой подарок вы получите на каждом пороге.
                                Чем больше заказ, тем приятнее бонус.
                            </Text>
                        </Stack>

                        <Button
                            component={Link}
                            to="/categories"
                            variant="white"
                            color="dark"
                            radius="xl"
                            size="md"
                            rightSection={<IconArrowRight size={16} />}
                            className={classes.cta}
                        >
                            Собрать заказ
                        </Button>
                    </Group>

                    <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md">
                        {loading
                            ? Array.from({ length: 4 }).map((_, index) => (
                                  <Box key={index} className={classes.skeletonRow} />
                              ))
                            : items.map((rule) => (
                                  <Box key={rule.id} className={classes.ruleRow}>
                                      <Stack gap={8}>
                                          <Group gap="sm" wrap="nowrap" align="flex-start">
                                              <Box className={classes.ruleBullet}>
                                                  <IconGift size={18} />
                                              </Box>
                                              <Stack gap={4}>
                                                  <Text className={classes.threshold}>{formatThreshold(rule)}</Text>
                                                  <Text className={classes.productName}>
                                                      В подарок: {rule.product.name}
                                                  </Text>
                                                  <Text className={classes.note}>
                                                      {formatRangeNote(rule)}
                                                  </Text>
                                              </Stack>
                                          </Group>
                                      </Stack>
                                  </Box>
                              ))}
                    </SimpleGrid>
                </Stack>
            </Box>
        </Box>
    );
};
