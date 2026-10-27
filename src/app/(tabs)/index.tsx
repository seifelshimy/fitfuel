// View: Home screen (Ahmed Mohamed).
// Only renders what useHomeViewModel provides; no data logic lives here.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '@/components/ProductCard';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { Category, Product } from '@/models/product';
import { categoryColors, colors, radius, spacing, typography } from '@/theme';
import { useHomeViewModel } from '@/viewmodels/useHomeViewModel';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function HomeScreen() {
  const vm = useHomeViewModel();

  const openProduct = (p: Product) => router.push({ pathname: '/product/[id]', params: { id: p.id } });
  const openCategory = (category: Category) => router.push({ pathname: '/search', params: { category } });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.wordmark}>
            Fit<Text style={styles.wordmarkAccent}>Fuel</Text>
          </Text>
          <Text style={typography.caption}>Supplements you can trust</Text>
        </View>
      </View>

      <Pressable
        style={styles.searchBar}
        onPress={() => router.push('/search')}
        accessibilityRole="search"
        accessibilityLabel="Search products or brands"
      >
        <Ionicons name="search" size={18} color={colors.muted} />
        <Text style={styles.searchPlaceholder}>Search protein, creatine, brands…</Text>
      </Pressable>

      {vm.status === 'loading' ? (
        <LoadingState message="Loading the store…" />
      ) : vm.status === 'error' ? (
        <ErrorState message={vm.error ?? ''} onRetry={vm.retry} />
      ) : vm.isEmpty ? (
        <EmptyState
          icon="storefront-outline"
          title="The store is empty"
          message="No products have been added yet. Pull down to check again."
          actionLabel="Refresh"
          onAction={vm.refresh}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={vm.refreshing} onRefresh={vm.refresh} tintColor={colors.ink} />}
        >
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>THIS WEEK</Text>
            <Text style={styles.heroTitle}>Original products,{'\n'}one fair price.</Text>
            <Text style={styles.heroBody}>Every item shows its full nutrition facts before you buy.</Text>
            <Pressable
              style={styles.heroButton}
              onPress={() => openCategory('protein')}
              accessibilityRole="button"
              accessibilityLabel="Shop protein"
            >
              <Text style={styles.heroButtonText}>Shop protein</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.surface} />
            </Pressable>
            <Ionicons name="barbell" size={120} color={colors.accentInk} style={styles.heroIcon} />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Categories" />
            <View style={styles.categoryGrid}>
              {vm.categories.map((c) => (
                <Pressable
                  key={c.id}
                  style={({ pressed }) => [styles.category, pressed && { opacity: 0.8 }]}
                  onPress={() => openCategory(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${c.label}`}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: categoryColors[c.id] }]}>
                    <Ionicons name={c.icon as IconName} size={24} color={colors.ink} />
                  </View>
                  <Text style={styles.categoryLabel} numberOfLines={1}>
                    {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {vm.featured.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Featured" actionLabel="See all" onAction={() => router.push('/search')} />
              <FlatList
                horizontal
                data={vm.featured}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => <ProductCard product={item} onPress={() => openProduct(item)} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
                style={styles.bleed}
              />
            </View>
          ) : null}

          {vm.sections.map((s) => (
            <View key={s.id} style={styles.section}>
              <SectionHeader title={s.label} actionLabel="See all" onAction={() => openCategory(s.id)} />
              <FlatList
                horizontal
                data={s.products}
                keyExtractor={(p) => p.id}
                renderItem={({ item }) => <ProductCard product={item} onPress={() => openProduct(item)} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carousel}
                style={styles.bleed}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  wordmark: { fontSize: 30, fontWeight: '900', letterSpacing: -1.2, color: colors.ink },
  wordmarkAccent: { color: colors.ink, backgroundColor: colors.accent },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    height: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchPlaceholder: { marginLeft: spacing.sm, fontSize: 15, color: colors.muted },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  heroLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: colors.accentInk, opacity: 0.7 },
  heroTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.6, color: colors.accentInk, marginTop: spacing.xs },
  heroBody: { fontSize: 14, color: colors.accentInk, marginTop: spacing.sm, maxWidth: '70%', lineHeight: 19 },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
  },
  heroButtonText: { color: colors.surface, fontWeight: '700', fontSize: 14 },
  heroIcon: { position: 'absolute', right: -18, bottom: -18, opacity: 0.12, transform: [{ rotate: '-20deg' }] },
  section: { marginTop: spacing.xl },
  categoryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  category: { alignItems: 'center', width: '19%' },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: colors.inkSoft, marginTop: spacing.sm },
  bleed: { marginHorizontal: -spacing.lg },
  carousel: { paddingHorizontal: spacing.lg },
});
