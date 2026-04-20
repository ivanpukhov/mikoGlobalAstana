import { Center, Stack, Text, Title } from '@mantine/core';
import { IconMoodSad } from '@tabler/icons-react';

export function EmptyState({
  icon: Icon = IconMoodSad,
  title = 'Ничего не найдено',
  description,
  action,
  minHeight = '40vh',
}) {
  return (
    <Center mih={minHeight} w="100%">
      <Stack align="center" gap="xs" maw={420} ta="center">
        <Icon size={56} stroke={1.5} color="var(--mantine-color-gray-5)" />
        <Title order={3} fw={700}>
          {title}
        </Title>
        {description ? (
          <Text c="dimmed" size="sm">
            {description}
          </Text>
        ) : null}
        {action}
      </Stack>
    </Center>
  );
}

export default EmptyState;
