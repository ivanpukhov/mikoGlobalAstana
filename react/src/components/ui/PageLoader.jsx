import { Center, Loader, Stack, Text } from '@mantine/core';

export function PageLoader({ label = 'Загрузка…', minHeight = '60vh' }) {
  return (
    <Center mih={minHeight} w="100%">
      <Stack align="center" gap="sm">
        <Loader size="lg" type="dots" />
        {label ? <Text c="dimmed" size="sm">{label}</Text> : null}
      </Stack>
    </Center>
  );
}

export default PageLoader;
