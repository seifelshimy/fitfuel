// Placeholder product image: a coloured tile with the category icon.
// Phase 2 can swap this for real product photos from Firebase Storage.

import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, Product } from '@/models/product';
import { categoryColors, colors, radius } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function ProductThumb({ product, size }: { product: Product; size: number }) {
  const icon = (CATEGORIES.find((c) => c.id === product.category)?.icon ?? 'cube-outline') as IconName;
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: categoryColors[product.category] ?? colors.surfaceMuted },
      ]}
      accessible={false}
    >
      <Ionicons name={icon} size={size * 0.38} color={colors.ink} style={{ opacity: 0.75 }} />
      {size >= 120 ? <Text style={styles.brand}>{product.brand.toUpperCase()}</Text> : null}
      {!product.inStock ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Sold out</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brand: { position: 'absolute', bottom: 10, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, color: colors.inkSoft },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.ink,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  badgeText: { color: colors.surface, fontSize: 10, fontWeight: '700' },
});
