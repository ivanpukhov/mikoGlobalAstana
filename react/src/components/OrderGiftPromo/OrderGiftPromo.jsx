import { Link } from 'react-router-dom';
import {
    Badge,
    Box,
    Button,
    Card,
    Group,
    Image,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { IconArrowRight, IconGift, IconSparkles } from '@tabler/icons-react';
import { formatCurrency } from '../../utils/formatters';
import { resolveImage } from '../../utils/resolveImage';
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
                                  <Card key={index} className={classes.skeletonCard} radius="xl" />
                              ))
                            : items.map((rule) => (
                                  <Card key={rule.id} className={classes.card} radius="xl" padding="lg">
                                      <Stack gap="md" h="100%">
                                          <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
                                              <Badge color="red" variant="light" radius="xl" size="lg">
                                                  {rule.minAmount > 0 ? `от ${formatCurrency(rule.minAmount)}` : 'всегда'}
                                              </Badge>
                                              <ThemeIcon radius="xl" variant="light" color="miko" size={42}>
                                                  <IconGift size={20} />
                                              </ThemeIcon>
                                          </Group>

                                          <Box className={classes.imageWrap}>
                                              <Image
                                                  src={resolveImage(rule.product.image)}
                                                  alt={rule.product.name}
                                                  fit="contain"
                                                  className={classes.image}
                                              />
                                          </Box>

                                          <Stack gap={6} mt="auto">
                                              <Text className={classes.threshold}>{formatThreshold(rule)}</Text>
                                              <Text className={classes.productName} lineClamp={3}>
                                                  {rule.product.name}
                                              </Text>
                                              <Text className={classes.note}>
                                                  {formatRangeNote(rule)}
                                              </Text>
                                          </Stack>
                                      </Stack>
                                  </Card>
                              ))}
                    </SimpleGrid>
                </Stack>
            </Box>
        </Box>
    );
};
