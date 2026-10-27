// Screen 1 (Saif): Cart. Items, quantity stepper, promo codes and order summary.

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartItemCard } from '@/components/CartItemCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';
import { useCartViewModel } from '@/viewmodels/useCartViewModel';

export default function CartScreen() {
  const vm = useCartViewModel();

  if (vm.isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <LoadingState message="Loading your cart…" />
      </SafeAreaView>
    );
  }

  if (vm.error && vm.items.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <ErrorState message={vm.error} onRetry={vm.reloadCart} />
      </SafeAreaView>
    );
  }

  if (vm.isEmpty) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          message="Add supplements from the store, or restore the sample items to try checkout."
          actionLabel="Restore sample items"
          onAction={vm.restoreSampleItems}
        />
      </SafeAreaView>
    );
  }

  const { totals } = vm;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={vm.items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.display}>Your cart</Text>
            <Text style={typography.caption}>
              {vm.itemCount} {vm.itemCount === 1 ? 'item' : 'items'}
            </Text>
            {vm.error ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>{vm.error}</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <CartItemCard
            item={item}
            onIncrease={() => vm.updateQuantity(item.id, item.quantity + 1)}
            onDecrease={() => vm.updateQuantity(item.id, item.quantity - 1)}
            onRemove={() => vm.removeItem(item.id)}
          />
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.card}>
              <Text style={typography.subtitle}>Promo code</Text>
              {vm.appliedPromo ? (
                <View style={styles.appliedPromo}>
                  <Ionicons name="pricetag" size={18} color={colors.success} />
                  <View style={styles.appliedPromoText}>
                    <Text style={styles.appliedPromoCode}>{vm.appliedPromo.code}</Text>
                    <Text style={typography.caption}>{vm.appliedPromo.description}</Text>
                  </View>
                  <Pressable
                    onPress={vm.clearPromo}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Remove promo code"
                  >
                    <Text style={styles.linkText}>Clear</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.promoRow}>
                  <TextInput
                    value={vm.promoInput}
                    onChangeText={vm.setPromoInput}
                    onSubmitEditing={vm.submitPromo}
                    placeholder="FITFUEL10 or GAINZ20"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    returnKeyType="done"
                    accessibilityLabel="Promo code"
                    style={[styles.input, vm.promoError ? styles.inputError : null]}
                  />
                  <View style={styles.promoButton}>
                    <PrimaryButton
                      label="Apply"
                      onPress={vm.submitPromo}
                      disabled={vm.promoInput.length === 0}
                    />
                  </View>
                </View>
              )}
              {vm.promoError ? (
                <View style={styles.promoErrorRow}>
                  <Text style={styles.fieldError}>{vm.promoError}</Text>
                  {!vm.appliedPromo ? (
                    <Pressable onPress={vm.clearPromo} hitSlop={8} accessibilityRole="button">
                      <Text style={styles.linkText}>Clear</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={typography.subtitle}>Order summary</Text>
              <SummaryRow label="Subtotal" value={formatPrice(totals.subtotal)} />
              <SummaryRow
                label={totals.appliedPromoCode ? `Discount (${totals.appliedPromoCode})` : 'Discount'}
                value={totals.discountAmount > 0 ? `- ${formatPrice(totals.discountAmount)}` : formatPrice(0)}
                highlight={totals.discountAmount > 0}
              />
              <SummaryRow
                label="Delivery"
                value={totals.deliveryFee === 0 ? 'Free' : formatPrice(totals.deliveryFee)}
                highlight={totals.deliveryFee === 0}
              />
              {vm.amountToFreeDelivery > 0 ? (
                <Text style={typography.caption}>
                  Add {formatPrice(vm.amountToFreeDelivery)} more for free delivery.
                </Text>
              ) : null}
              <View style={styles.divider} />
              <View style={styles.totalRow}>
                <Text style={typography.title}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(totals.total)}</Text>
              </View>
            </View>

            <PrimaryButton
              label="Continue to checkout"
              icon="arrow-forward"
              variant="accent"
              onPress={() => router.push('/checkout')}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={typography.body}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && styles.summaryValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  promoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  inputError: {
    borderColor: colors.danger,
  },
  promoButton: {
    minWidth: 96,
  },
  promoErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fieldError: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  appliedPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#E2F6D5',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  appliedPromoText: {
    flex: 1,
    gap: 2,
  },
  appliedPromoCode: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  summaryValueHighlight: {
    color: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
});
