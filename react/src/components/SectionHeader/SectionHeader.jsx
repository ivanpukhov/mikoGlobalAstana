import { Link } from 'react-router-dom';
import { Anchor, Group, Title } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';

export const SectionHeader = ({ title, to, linkLabel = 'Смотреть все' }) => (
    <Group justify="space-between" align="flex-end" mb="md" mt="xl">
        <Title order={2} fz={{ base: 22, sm: 26, md: 30 }} fw={800}>
            {title}
        </Title>
        {to && (
            <Anchor
                component={Link}
                to={to}
                fw={600}
                fz="sm"
                c="miko.7"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
                {linkLabel}
                <IconArrowRight size={16} />
            </Anchor>
        )}
    </Group>
);
