import { Link } from 'react-router-dom';
import {
    Badge,
    Box,
    Button,
    Group,
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
                <Stack gap="md">
                    <Group justify="space-between" align="center" gap="md" wrap="wrap">
                        <Stack gap={6} maw={720}>
                            <Group gap="sm">
                                <Badge
                                    variant="white"
                                    color="red"
                                    radius="xl"
                                    size="sm"
                                    leftSection={<IconSparkles size={14} />}
                                >
                                    Акция
                                </Badge>
                                <Badge
                                    variant="light"
                                    color="miko"
                                    radius="xl"
                                    size="sm"
                                    leftSection={<IconGift size={14} />}
                                >
                                    Подарки к заказу
                                </Badge>
                            </Group>

                            <Title order={3} className={classes.title}>
                                Подарки за сумму заказа
                            </Title>

                            <Text className={classes.description}>
                                Чем больше заказ, тем приятнее подарок. Все условия видны сразу.
                            </Text>
                        </Stack>

                        <Button
                            component={Link}
                            to="/categories"
                            variant="white"
                            color="dark"
                            radius="md"
                            size="sm"
                            rightSection={<IconArrowRight size={16} />}
                            className={classes.cta}
                        >
                            В каталог
                        </Button>
                    </Group>

                    <Box className={classes.rulesPanel}>
                        <Stack gap={6}>
                            {loading
                                ? Array.from({ length: 4 }).map((_, index) => (
                                      <Box
                                          key={index}
                                          className={classes.skeletonRow}
                                      />
                                  ))
                                : items.map((rule, index) => (
                                      <Box
                                          key={rule.id}
                                          className={classes.ruleRow}
                                      >
                                          <Group gap="sm" wrap="nowrap" align="flex-start">
                                              <Box className={classes.ruleIndex}>
                                                  {index + 1}
                                              </Box>

                                              <Text className={classes.ruleText}>
                                                  <Text span className={classes.threshold}>
                                                      {formatThreshold(rule)}
                                                  </Text>
                                                  {' '}— {rule.product.name} в подарок
                                              </Text>
                                          </Group>
                                      </Box>
                                  ))}
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
};
