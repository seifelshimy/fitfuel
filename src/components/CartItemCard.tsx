import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CartItem } from '@/models/order';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';

interface Props {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

export function CartItemCard({ item, onIncrease, onDecrease, onRemove }: Props) {
  const canDecrease = item.quantity > 1;
  const canIncrease = item.quantity < item.stock;

  return (
    <View style={styles.card}>
      <View style={styles.thumb}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} accessibilityIgnoresInvertColors />
        ) : (
          <Ionicons name="barbell-outline" size={28} color={colors.inkSoft} />
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.headerRow}>
          <View style={styles.titles}>
            <Text style={typography.label}>{item.brand}</Text>
            <Text style={[typography.subtitle, styles.name]} numberOfLines={2}>
              {item.name}
            </Text>
          </View>
          <Pressable
            onPress={onRemove}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.name} from cart`}
            style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
          </Pressable>
        </View>

        <Text style={typography.caption}>
          {item.flavor} · {item.weight}
        </Text>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.price}>{formatPrice(item.price * item.quantity)}</Text>
            {item.quantity > 1 ? (
              <Text style={typography.caption}>{formatPrice(item.price)} each</Text>
            ) : null}
          </View>

          <View style={styles.stepper}>
            <Pressable
              onPress={onDecrease}
              disabled={!canDecrease}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Decrease quantity of ${item.name}`}
              style={({ pressed }) => [styles.stepButton, !canDecrease && styles.disabled, pressed && styles.pressed]}
            >
              <Ionicons name="remove" size={18} color={colors.ink} />
            </Pressable>
            <Text style={styles.quantity} accessibilityLabel={`Quantity ${item.quantity}`}>
              {item.quantity}
            </Text>
            <Pressable
              onPress={onIncrease}
              disabled={!canIncrease}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Increase quantity of ${item.name}`}
              style={({ pressed }) => [styles.stepButton, !canIncrease && styles.disabled, pressed && styles.pressed]}
            >
              <Ionicons name="add" size={18} color={colors.ink} />
            </Pressable>
          </View>
        </View>

        {!canIncrease ? <Text style={styles.stockNote}>Only {item.stock} in stock</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titles: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
  },
  removeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 3,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  stockNote: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.7,
  },
});
