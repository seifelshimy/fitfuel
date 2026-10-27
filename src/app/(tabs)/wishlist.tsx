// View: Wishlist screen (Seif Elshimy).
// Only renders what useWishlistViewModel gives it.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { colors, radius, spacing, typography } from '@/theme';
import { useWishlistViewModel } from '@/viewmodels/useWishlistViewModel';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function WishlistScreen() {
  const vm = useWishlistViewModel();

  const renderBody = () => {
    if (vm.status === 'loading') return <LoadingState message="Loading your wishlist…" />;
    if (vm.status === 'error') return <ErrorState message={vm.error ?? ''} onRetry={vm.retry} />;
    if (vm.items.length === 0) {
      return (
        <EmptyState
          icon="heart-outline"
          title="Your wishlist is empty"
          message="Tap the heart on any product to save it here."
          actionLabel="Browse products"
          onAction={() => router.push('/')}
        />
      );
    }
    return (
      <FlatList
        data={vm.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ProductCard product={item} layout="row" onPress={() => router.push(`/product/${item.id}`)} />
            <View style={styles.actions}>
              <ActionButton
                icon="create-outline"
                label="Write a review"
                onPress={() => router.push(`/review/${item.id}`)}
              />
              <ActionButton icon="trash-outline" label="Remove" danger onPress={() => vm.remove(item.id)} />
            </View>
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={typography.display}>Wishlist</Text>
        {vm.status === 'success' && vm.items.length > 0 ? (
          <Text style={[typography.caption, styles.count]}>{vm.countLabel}</Text>
        ) : null}
      </View>
      {renderBody()}
    </SafeAreaView>
  );
}

function ActionButton(props: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  const color = props.danger ? colors.danger : colors.ink;
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={props.icon} size={16} color={color} />
      <Text style={[styles.actionText, { color }]}>{props.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  count: { marginTop: spacing.xs },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  actionText: { fontSize: 13, fontWeight: '700' },
});
