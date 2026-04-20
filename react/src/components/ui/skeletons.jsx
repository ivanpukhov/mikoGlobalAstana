import { Card, Group, SimpleGrid, Skeleton, Stack } from '@mantine/core';

export function ProductCardSkeleton() {
  return (
    <Card padding="sm" radius="lg">
      <Card.Section>
        <Skeleton height={180} radius={0} />
      </Card.Section>
      <Stack gap={8} mt="sm">
        <Skeleton height={12} width="60%" radius="sm" />
        <Skeleton height={12} width="90%" radius="sm" />
        <Skeleton height={20} width="50%" mt={6} radius="sm" />
        <Skeleton height={36} mt={6} radius="md" />
      </Stack>
    </Card>
  );
}

export function ProductGridSkeleton({ count = 10 }) {
  return (
    <SimpleGrid cols={{ base: 2, xs: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </SimpleGrid>
  );
}

export function MainBannerSkeleton() {
  return (
    <Stack gap="md">
      <Skeleton height={260} radius="lg" />
      <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="md">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={120} radius="lg" />
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export function HeaderSkeleton() {
  return (
    <Group justify="space-between" px="md" py="sm" wrap="nowrap">
      <Skeleton height={36} width={120} radius="md" />
      <Skeleton height={40} radius="md" style={{ flex: 1, maxWidth: 720 }} />
      <Group gap="sm" wrap="nowrap">
        <Skeleton height={36} width={36} radius="md" />
        <Skeleton height={36} width={36} radius="md" />
      </Group>
    </Group>
  );
}

export function TableSkeleton({ rows = 8, columns = 5 }) {
  return (
    <Stack gap={6}>
      {Array.from({ length: rows }).map((_, r) => (
        <Group key={r} gap="md" wrap="nowrap">
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton key={c} height={20} style={{ flex: 1 }} radius="sm" />
          ))}
        </Group>
      ))}
    </Stack>
  );
}
