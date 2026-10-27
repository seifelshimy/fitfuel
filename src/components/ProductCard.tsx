import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Product, startingPrice } from '@/models/product';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';
import { ProductThumb } from './ProductThumb';

interface Props {
  product: Product;
  onPress: () => void;
  /** "tile" for horizontal carousels, "row" for vertical lists. */
  layout?: 'tile' | 'row';
}

export function ProductCard({ product, onPress, layout = 'tile' }: Props) {
  const price = startingPrice(product);
  const fromLabel = product.sizes.length > 1 ? 'from ' : '';
  const a11y = `${product.name} by ${product.brand}, ${fromLabel}${formatPrice(price)}, rated ${product.rating}${
    product.inStock ? '' : ', sold out'
  }`;

  if (layout === 'row') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={a11y}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <ProductThumb product={product} size={84} />
        <View style={styles.rowBody}>
          <Text style={typography.label}>{product.brand}</Text>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Rating value={product.rating} count={product.reviewCount} />
          <Text style={styles.price}>
            <Text style={styles.from}>{fromLabel}</Text>
            {formatPrice(price)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <ProductThumb product={product} size={148} />
      <Text style={[typography.label, styles.tileBrand]}>{product.brand}</Text>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <View style={styles.tileFooter}>
        <Text style={styles.price}>
          <Text style={styles.from}>{fromLabel}</Text>
          {formatPrice(price)}
        </Text>
      </View>
      <Rating value={product.rating} />
    </Pressable>
  );
}

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <View style={styles.rating}>
      <Ionicons name="star" size={12} color={colors.star} />
      <Text style={styles.ratingText}>
        {value.toFixed(1)}
        {count !== undefined ? <Text style={styles.ratingCount}>{`  (${count})`}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { width: 148, marginRight: spacing.md },
  tileBrand: { marginTop: spacing.sm },
  tileFooter: { marginTop: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowBody: { flex: 1, marginHorizontal: spacing.md },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 2, lineHeight: 19 },
  price: { fontSize: 15, fontWeight: '800', color: colors.ink, marginTop: 4 },
  from: { fontSize: 12, fontWeight: '500', color: colors.muted },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, fontWeight: '700', color: colors.inkSoft, marginLeft: 4 },
  ratingCount: { fontWeight: '500', color: colors.muted },
  pressed: { opacity: 0.8 },
});
