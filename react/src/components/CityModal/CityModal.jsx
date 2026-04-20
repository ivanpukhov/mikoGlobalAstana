import { useEffect, useState } from 'react';
import {
    Button,
    Loader,
    Modal,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    UnstyledButton,
} from '@mantine/core';
import { IconMapPin, IconSearch } from '@tabler/icons-react';
import api from '../../api/api';
import classes from './CityModal.module.css';

export const CityModal = ({ open, onClose, onCitySelect }) => {
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        if (!open) return;

        let cancelled = false;
        setLoading(true);

        try {
            const savedCity = JSON.parse(localStorage.getItem('selectedCity') || 'null');
            setSelected(savedCity);
        } catch {
            setSelected(null);
        }

        api.get('/cities')
            .then(({ data }) => {
                if (!cancelled && Array.isArray(data)) {
                    setCities(data);
                }
            })
            .catch((err) => console.error('Ошибка при загрузке городов:', err))
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open]);

    const filtered = filter.trim()
        ? cities.filter((city) => city.name.toLowerCase().includes(filter.trim().toLowerCase()))
        : cities;

    return (
        <Modal
            opened={open}
            onClose={onClose}
            title={
                <Text fw={700} fz="lg">
                    Выберите ваш город
                </Text>
            }
            centered
            closeOnClickOutside={false}
            withCloseButton={false}
            size="md"
        >
            <Stack gap="md">
                <TextInput
                    leftSection={<IconSearch size={16} />}
                    placeholder="Поиск по городам"
                    value={filter}
                    onChange={(event) => setFilter(event.currentTarget.value)}
                />

                {loading ? (
                    <Stack align="center" py="xl">
                        <Loader color="miko" />
                        <Text size="sm" c="dimmed">
                            Загружаем города...
                        </Text>
                    </Stack>
                ) : (
                    <ScrollArea.Autosize mah={320}>
                        <Stack gap={4}>
                            {filtered.map((city) => {
                                const isActive = selected?.id === city.id;

                                return (
                                    <UnstyledButton
                                        key={city.id}
                                        className={classes.cityItem}
                                        data-active={isActive || undefined}
                                        onClick={() => setSelected(city)}
                                    >
                                        <IconMapPin
                                            size={16}
                                            color={
                                                isActive
                                                    ? 'var(--mantine-color-miko-7)'
                                                    : 'var(--mantine-color-gray-6)'
                                            }
                                        />
                                        <Text fw={isActive ? 700 : 500}>{city.name}</Text>
                                    </UnstyledButton>
                                );
                            })}
                            {filtered.length === 0 && (
                                <Text ta="center" c="dimmed" py="md">
                                    Ничего не найдено
                                </Text>
                            )}
                        </Stack>
                    </ScrollArea.Autosize>
                )}

                <Button
                    fullWidth
                    color="miko"
                    disabled={!selected || loading}
                    onClick={() => selected && onCitySelect(selected)}
                >
                    Сохранить
                </Button>
            </Stack>
        </Modal>
    );
};
