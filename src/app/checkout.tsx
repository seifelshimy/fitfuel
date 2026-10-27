// Screen 2 (Saif): Checkout. Delivery pin, recipient details, payment method
// and order confirmation. The native map only renders on iOS/Android; web and
// any build without the map module use the coordinate selector card.

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { DeliveryMap, isNativeMapSupported } from '@/components/DeliveryMap';
import { LocationPicker } from '@/components/LocationPicker';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState, LoadingState } from '@/components/StateViews';
import type { PaymentMethod } from '@/models/order';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';
import { useCheckoutViewModel } from '@/viewmodels/useCheckoutViewModel';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const PAYMENT_OPTIONS: { method: PaymentMethod; title: string; subtitle: string; icon: IconName }[] = [
  { method: 'cod', title: 'Cash on delivery', subtitle: 'Pay the courier when it arrives', icon: 'cash-outline' },
  { method: 'stripe_card', title: 'Card (Stripe test)', subtitle: 'Pay now with a test card', icon: 'card-outline' },
];

// Guarded by both checks so web never touches react-native-maps.
const showNativeMap = Platform.OS !== 'web' && isNativeMapSupported;

export default function CheckoutScreen() {
  const vm = useCheckoutViewModel();
  const errors = vm.validationErrors;

  if (vm.isCartLoading) {
    return <LoadingState message="Preparing checkout…" />;
  }

  if (vm.isCartEmpty) {
    return (
      <EmptyState
        icon="cart-outline"
        title="Nothing to check out"
        message="Your cart is empty. Add a product to your cart before checking out."
        actionLabel="Back to cart"
        onAction={() => router.back()}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title="Delivery location" icon="location-outline">
          {showNativeMap ? (
            <DeliveryMap
              coordinate={vm.location}
              fallbackCenter={vm.defaultCoordinates}
              onSelectCoordinate={vm.selectMapCoordinate}
            />
          ) : null}

          <LocationPicker
            coordinate={vm.location}
            fallbackCenter={vm.defaultCoordinates}
            presets={vm.areaPresets}
            isLocating={vm.isLocating}
            onSelectCoordinate={vm.selectMapCoordinate}
            onUseCurrentLocation={vm.detectCurrentLocation}
          />

          <View style={[styles.addressBanner, errors.location ? styles.addressBannerError : null]}>
            {vm.isLocating ? (
              <ActivityIndicator size="small" color={colors.ink} />
            ) : (
              <Ionicons
                name={vm.location ? 'checkmark-circle' : 'help-circle-outline'}
                size={20}
                color={vm.location ? colors.success : colors.muted}
              />
            )}
            <View style={styles.flex}>
              <Text style={typography.label}>Delivering to</Text>
              <Text style={[typography.body, styles.addressText]}>
                {vm.location ? vm.location.formattedAddress : 'No pin yet. Choose an area or use your GPS location.'}
              </Text>
            </View>
          </View>
          {vm.locationNotice ? <Text style={styles.notice}>{vm.locationNotice}</Text> : null}
          <FieldError message={errors.location} />
        </Section>

        <Section title="Recipient details" icon="person-outline">
          <Field
            label="Full name"
            value={vm.fullName}
            onChangeText={vm.setFullName}
            placeholder="e.g. Saif Nasr"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            error={errors.fullName}
          />
          <Field
            label="Mobile number"
            value={vm.phone}
            onChangeText={vm.setPhone}
            placeholder="01012345678"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            error={errors.phone}
          />
          <Field
            label="Building, floor & apartment (optional)"
            value={vm.buildingNotes}
            onChangeText={vm.setBuildingNotes}
            placeholder="Building 12, 3rd floor, apt 7. Ring twice."
            multiline
            maxLength={200}
          />
        </Section>

        <Section title="Payment method" icon="wallet-outline">
          {PAYMENT_OPTIONS.map((option) => {
            const selected = vm.paymentMethod === option.method;
            return (
              <Pressable
                key={option.method}
                onPress={() => vm.setPaymentMethod(option.method)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [styles.paymentOption, selected && styles.paymentOptionSelected, pressed && styles.pressed]}
              >
                <Ionicons name={option.icon} size={22} color={colors.ink} />
                <View style={styles.flex}>
                  <Text style={typography.subtitle}>{option.title}</Text>
                  <Text style={typography.caption}>{option.subtitle}</Text>
                </View>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={selected ? colors.ink : colors.muted}
                />
              </Pressable>
            );
          })}

          {vm.paymentMethod === 'stripe_card' ? (
            <View style={styles.cardBox}>
              <Field
                label="Card last 4 digits"
                value={vm.cardLast4}
                onChangeText={vm.setCardLast4}
                placeholder="4242"
                keyboardType="number-pad"
                maxLength={4}
                error={errors.cardLast4}
              />
              <Text style={typography.caption}>
                Test mode: no real charge. Any 4 digits succeed; 0002 simulates a declined card.
              </Text>
            </View>
          ) : null}
        </Section>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={typography.body}>
              {vm.items.length} {vm.items.length === 1 ? 'product' : 'products'}
            </Text>
            <Text style={typography.body}>{formatPrice(vm.totals.subtotal)}</Text>
          </View>
          {vm.totals.discountAmount > 0 ? (
            <View style={styles.summaryRow}>
              <Text style={typography.body}>Discount ({vm.totals.appliedPromoCode})</Text>
              <Text style={[typography.body, styles.success]}>- {formatPrice(vm.totals.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={typography.body}>Delivery</Text>
            <Text style={typography.body}>
              {vm.totals.deliveryFee === 0 ? 'Free' : formatPrice(vm.totals.deliveryFee)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={typography.title}>Total</Text>
            <Text style={styles.total}>{formatPrice(vm.totals.total)}</Text>
          </View>
        </View>

        <FieldError message={errors.cart} />
        {vm.error ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.errorBannerText}>{vm.error}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label={
            vm.isSubmitting
              ? vm.paymentMethod === 'stripe_card'
                ? 'Processing payment…'
                : 'Placing order…'
              : `Confirm Order · ${formatPrice(vm.totals.total)}`
          }
          icon="checkmark-circle-outline"
          variant="accent"
          onPress={vm.submitOrder}
          disabled={vm.isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, icon, children }: { title: string; icon: IconName; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.ink} />
        <Text style={typography.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <Text style={styles.fieldError} accessibilityRole="alert">
      {message}
    </Text>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
}

function Field({ label, error, style, ...inputProps }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={typography.label}>{label}</Text>
      <TextInput
        {...inputProps}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, inputProps.multiline && styles.inputMultiline, error ? styles.inputError : null, style]}
      />
      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addressBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  addressBannerError: {
    borderColor: colors.danger,
  },
  addressText: {
    color: colors.ink,
    marginTop: 2,
  },
  notice: {
    fontSize: 13,
    color: colors.inkSoft,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.ink,
  },
  inputMultiline: {
    minHeight: 84,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  paymentOptionSelected: {
    borderColor: colors.ink,
    borderWidth: 2,
  },
  cardBox: {
    gap: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  success: {
    color: colors.success,
  },
  total: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
