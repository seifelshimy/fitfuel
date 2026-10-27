// View: Search & filter screen (Ahmed Mohamed).

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { CATEGORIES, Category, GOALS, SORT_OPTIONS } from '@/models/product';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';
import { MAX_QUERY_LENGTH } from '@/utils/productFilters';
import { useSearchViewModel } from '@/viewmodels/useSearchViewModel';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function parseCategory(value: string | undefined): Category | null {
  return CATEGORIES.some((c) => c.id === value) ? (value as Category) : null;
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const vm = useSearchViewModel(parseCategory(params.category));

  // Keep the URL in step with the chosen category, so tapping the same
  // category on Home again still works after it was cleared here.
  useEffect(() => {
    const current = parseCategory(params.category);
    if (current !== vm.filters.category) {
      router.setParams({ category: vm.filters.category ?? undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm.filters.category]);

  const f = vm.filters;
  const activeChips: { key: keyof typeof f; label: string }[] = [];
  if (f.category) activeChips.push({ key: 'category', label: CATEGORIES.find((c) => c.id === f.category)!.label });
  if (f.goal) activeChips.push({ key: 'goal', label: GOALS.find((g) => g.id === f.goal)!.label });
  if (f.flavor) activeChips.push({ key: 'flavor', label: f.flavor });
  if (f.minPrice !== null) activeChips.push({ key: 'minPrice', label: `Min ${formatPrice(f.minPrice)}` });
  if (f.maxPrice !== null) activeChips.push({ key: 'maxPrice', label: `Max ${formatPrice(f.maxPrice)}` });
  if (f.sort !== 'relevance') activeChips.push({ key: 'sort', label: SORT_OPTIONS.find((s) => s.id === f.sort)!.label });

  const renderBody = () => {
    if (vm.status === 'loading') return <LoadingState message="Loading products…" />;
    if (vm.status === 'error') return <ErrorState message={vm.error ?? ''} onRetry={vm.retry} />;
    if (vm.queryError) {
      return <EmptyState icon="alert-circle-outline" title="Check your search" message={vm.queryError} />;
    }
    if (vm.results.length === 0 && !vm.isTyping) {
      return (
        <EmptyState
          title="No products found"
          message="Try a different name or brand, or remove some filters."
          actionLabel="Clear search and filters"
          onAction={vm.clearAll}
        />
      );
    }
    return (
      <FlatList
        data={vm.results}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={[typography.caption, styles.count]}>
            {vm.hasCriteria
              ? `${vm.results.length} ${vm.results.length === 1 ? 'result' : 'results'}`
              : `All products · ${vm.results.length}`}
          </Text>
        }
        renderItem={({ item }) => (
          <ProductCard
            layout="row"
            product={item}
            onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
          />
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={[typography.display, styles.title]} accessibilityRole="header">
        Search
      </Text>

      <View style={styles.searchRow}>
        <View style={[styles.inputWrap, vm.queryError && styles.inputError]}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={vm.queryText}
            onChangeText={vm.setQueryText}
            placeholder="Product name or brand"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            maxLength={MAX_QUERY_LENGTH + 10}
            accessibilityLabel="Search products"
          />
          {vm.queryText.length > 0 ? (
            <Pressable onPress={() => vm.setQueryText('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={vm.openFilters}
          style={({ pressed }) => [styles.filterBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel={`Filters${vm.activeFilterCount ? `, ${vm.activeFilterCount} active` : ''}`}
        >
          <Ionicons name="options-outline" size={20} color={colors.surface} />
          {vm.activeFilterCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{vm.activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
      {vm.queryError ? <Text style={styles.errorText}>{vm.queryError}</Text> : null}

      {activeChips.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeChips} style={styles.activeChipsBar}>
          {activeChips.map((c) => (
            <Chip key={c.key} label={c.label} selected removable onPress={() => vm.removeFilter(c.key)} />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.body}>{renderBody()}</View>

      <FilterSheet vm={vm} />
    </SafeAreaView>
  );
}

function FilterSheet({ vm }: { vm: ReturnType<typeof useSearchViewModel> }) {
  const d = vm.draft;
  return (
    <Modal
      visible={vm.filtersOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={vm.closeFilters}
    >
      <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheetHeader}>
          <Pressable onPress={vm.closeFilters} hitSlop={10} accessibilityLabel="Close filters">
            <Ionicons name="close" size={24} color={colors.ink} />
          </Pressable>
          <Text style={typography.title}>Filters</Text>
          <Pressable onPress={vm.resetDraft} hitSlop={10} accessibilityRole="button">
            <Text style={styles.reset}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <FilterGroup title="Category">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                icon={c.icon as IconName}
                selected={d.category === c.id}
                onPress={() => vm.updateDraft({ category: d.category === c.id ? null : c.id })}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Goal">
            {GOALS.map((g) => (
              <Chip
                key={g.id}
                label={g.label}
                selected={d.goal === g.id}
                onPress={() => vm.updateDraft({ goal: d.goal === g.id ? null : g.id })}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Flavor">
            {vm.flavors.map((fl) => (
              <Chip
                key={fl}
                label={fl}
                selected={d.flavor === fl}
                onPress={() => vm.updateDraft({ flavor: d.flavor === fl ? null : fl })}
              />
            ))}
          </FilterGroup>

          <View style={styles.group}>
            <Text style={typography.label}>Price (EGP)</Text>
            <View style={styles.priceRow}>
              <PriceInput
                label="Minimum"
                value={d.minPrice}
                onChange={(v) => vm.updateDraft({ minPrice: v })}
                invalid={!!vm.priceError}
              />
              <Text style={styles.priceDash}>–</Text>
              <PriceInput
                label="Maximum"
                value={d.maxPrice}
                onChange={(v) => vm.updateDraft({ maxPrice: v })}
                invalid={!!vm.priceError}
              />
            </View>
            {vm.priceError ? (
              <Text style={[styles.errorText, { paddingHorizontal: 0 }]} accessibilityRole="alert">
                {vm.priceError}
              </Text>
            ) : (
              <Text style={[typography.caption, { marginTop: spacing.sm }]}>Leave empty for no limit.</Text>
            )}
          </View>

          <FilterGroup title="Sort by">
            {SORT_OPTIONS.map((s) => (
              <Chip key={s.id} label={s.label} selected={d.sort === s.id} onPress={() => vm.updateDraft({ sort: s.id })} />
            ))}
          </FilterGroup>
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.sheetFooter}>
          <PrimaryButton label="Show results" onPress={vm.applyFilters} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={typography.label}>{title}</Text>
      <View style={styles.groupChips}>{children}</View>
    </View>
  );
}

function PriceInput(props: { label: string; value: string; onChange: (v: string) => void; invalid: boolean }) {
  return (
    <View style={styles.priceField}>
      <Text style={styles.priceLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        keyboardType="number-pad"
        placeholder="Any"
        placeholderTextColor={colors.muted}
        style={[styles.priceInput, props.invalid && styles.inputError]}
        accessibilityLabel={`${props.label} price`}
        maxLength={7}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  searchRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.ink, height: '100%' },
  inputError: { borderColor: colors.danger },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.accentInk },
  errorText: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing.sm, paddingHorizontal: spacing.lg },
  activeChipsBar: { flexGrow: 0, marginTop: spacing.md },
  activeChips: { paddingHorizontal: spacing.lg },
  body: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  count: { marginTop: spacing.md, marginBottom: spacing.md },
  sheet: { flex: 1, backgroundColor: colors.background },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  reset: { fontSize: 15, fontWeight: '700', color: colors.inkSoft, textDecorationLine: 'underline' },
  sheetContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  group: { marginBottom: spacing.xl },
  groupChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  priceField: { flex: 1 },
  priceLabel: { fontSize: 12, color: colors.muted, marginBottom: spacing.xs, fontWeight: '600' },
  priceInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.ink,
  },
  priceDash: { marginHorizontal: spacing.md, marginBottom: 14, color: colors.muted, fontSize: 16 },
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
