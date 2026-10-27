// View: Product details screen (Ahmed Mohamed).

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import { NutritionTable } from '@/components/NutritionTable';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Rating } from '@/components/ProductCard';
import { ProductThumb } from '@/components/ProductThumb';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { GOALS } from '@/models/product';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice, formatReviewCount } from '@/utils/format';
import { useProductDetailsViewModel } from '@/viewmodels/useProductDetailsViewModel';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const vm = useProductDetailsViewModel(id);
  const { width } = useWindowDimensions();
  const imageSize = Math.min(width - spacing.lg * 2, 420);

  if (vm.status === 'loading') return <LoadingState message="Loading product…" />;
  if (vm.status === 'error' || !vm.product) {
    return <ErrorState message={vm.error ?? 'This product could not be loaded.'} onRetry={vm.retry} />;
  }

  const p = vm.product;
  const goalLabels = GOALS.filter((g) => p.goals.includes(g.id)).map((g) => g.label);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: p.name,
          headerRight: () => (
            <Pressable
              onPress={vm.toggleSaved}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={vm.isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              <Ionicons name={vm.isSaved ? 'heart' : 'heart-outline'} size={24} color={vm.isSaved ? colors.danger : colors.ink} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          <ProductThumb product={p} size={imageSize} />
        </View>

        <Text style={[typography.label, styles.brand]}>{p.brand}</Text>
        <Text style={typography.display}>{p.name}</Text>

        <View style={styles.metaRow}>
          <Rating value={p.rating} />
          <Text style={[typography.caption, styles.metaText]}>{formatReviewCount(p.reviewCount)}</Text>
          <View style={styles.dot} />
          <View style={[styles.stock, { backgroundColor: p.inStock ? '#E3F3E8' : colors.dangerSoft }]}>
            <Text style={[styles.stockText, { color: p.inStock ? colors.success : colors.danger }]}>
              {p.inStock ? 'In stock' : 'Out of stock'}
            </Text>
          </View>
        </View>

        <Text style={styles.unitPrice}>{formatPrice(p.sizes[vm.sizeIndex].price)}</Text>

        {p.flavors.length > 0 ? (
          <View style={styles.block}>
            <Text style={typography.label}>Flavor</Text>
            <View style={styles.chips}>
              {p.flavors.map((f) => (
                <Chip key={f} label={f} selected={vm.flavor === f} onPress={() => vm.setFlavor(f)} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.block}>
          <Text style={typography.label}>Size</Text>
          <View style={styles.chips}>
            {p.sizes.map((s, i) => (
              <Chip
                key={s.label}
                label={`${s.label} · ${formatPrice(s.price)}`}
                selected={vm.sizeIndex === i}
                onPress={() => vm.setSizeIndex(i)}
              />
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={typography.label}>About this product</Text>
          <Text style={[typography.body, styles.paragraph]}>{p.description}</Text>
          <View style={styles.goalRow}>
            {goalLabels.map((g) => (
              <View key={g} style={styles.goalTag}>
                <Ionicons name="checkmark-circle" size={14} color={colors.accentInk} />
                <Text style={styles.goalText}>{g}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <NutritionTable facts={p.nutrition} />
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {vm.feedback ? (
          <View
            style={[styles.feedback, vm.feedback.type === 'error' ? styles.feedbackError : styles.feedbackOk]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Ionicons
              name={vm.feedback.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
              size={16}
              color={vm.feedback.type === 'error' ? colors.danger : colors.success}
            />
            <Text style={styles.feedbackText}>{vm.feedback.text}</Text>
          </View>
        ) : null}
        <View style={styles.footerRow}>
          <View style={styles.stepper}>
            <StepButton icon="remove" onPress={vm.decrease} disabled={!vm.canDecrease} label="Decrease quantity" />
            <Text style={styles.qty} accessibilityLabel={`Quantity ${vm.quantity}`}>
              {vm.quantity}
            </Text>
            <StepButton icon="add" onPress={vm.increase} disabled={!vm.canIncrease} label="Increase quantity" />
          </View>
          <View style={styles.addWrap}>
            <PrimaryButton
              label={p.inStock ? `Add · ${formatPrice(vm.total)}` : 'Out of stock'}
              onPress={vm.addToCart}
              variant="accent"
              disabled={!p.inStock}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function StepButton(props: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      hitSlop={6}
      style={[styles.stepBtn, props.disabled && { opacity: 0.3 }]}
    >
      <Ionicons name={props.icon} size={18} color={colors.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  imageWrap: { alignItems: 'center' },
  brand: { marginTop: spacing.xl, marginBottom: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, flexWrap: 'wrap' },
  metaText: { marginLeft: spacing.sm, marginTop: 4 },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.muted, marginHorizontal: spacing.sm, marginTop: 4 },
  stock: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm, marginTop: 4 },
  stockText: { fontSize: 12, fontWeight: '700' },
  unitPrice: { fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: spacing.md, letterSpacing: -0.4 },
  block: { marginTop: spacing.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  paragraph: { marginTop: spacing.sm },
  goalRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  goalText: { fontSize: 12, fontWeight: '700', color: colors.accentInk },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.md },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 50,
    marginRight: spacing.md,
  },
  stepBtn: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.ink },
  addWrap: { flex: 1 },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  feedbackError: { backgroundColor: colors.dangerSoft },
  feedbackOk: { backgroundColor: '#E3F3E8' },
  feedbackText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },
});
