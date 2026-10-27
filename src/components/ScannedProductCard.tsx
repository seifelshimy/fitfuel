import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { ScannedSupplement } from '@/models/fitness';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  product: ScannedSupplement;
}

export function ScannedProductCard({ product }: Props) {
  const verified = product.isAuthenticFitFuelPartner;

  const macros = [
    { label: 'Calories', value: `${product.caloriesPerServing}`, unit: 'kcal' },
    { label: 'Protein', value: `${product.proteinGrams}`, unit: 'g' },
    { label: 'Carbs', value: `${product.carbsGrams}`, unit: 'g' },
    { label: 'Fat', value: `${product.fatGrams}`, unit: 'g' },
  ];

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.badge,
          { backgroundColor: verified ? colors.accent : colors.surfaceMuted },
        ]}
      >
        <Ionicons
          name={verified ? 'shield-checkmark' : 'globe-outline'}
          size={14}
          color={verified ? colors.accentInk : colors.inkSoft}
        />
        <Text style={[styles.badgeText, { color: verified ? colors.accentInk : colors.inkSoft }]}>
          {verified ? 'Verified FitFuel Partner' : 'External OpenFoodFacts Entry'}
        </Text>
      </View>

      <View>
        <Text style={typography.label}>{product.brand}</Text>
        <Text style={typography.title}>{product.name}</Text>
        <Text style={[typography.caption, styles.barcode]}>Barcode {product.barcode}</Text>
      </View>

      <Text style={typography.label}>Per serving</Text>
      <View style={styles.macros}>
        {macros.map((macro) => (
          <View key={macro.label} style={styles.macro}>
            <Text style={styles.macroValue}>
              {macro.value}
              <Text style={styles.macroUnit}> {macro.unit}</Text>
            </Text>
            <Text style={typography.caption}>{macro.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  barcode: { marginTop: spacing.xs },
  macros: { flexDirection: 'row', gap: spacing.sm },
  macro: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  macroValue: { fontSize: 17, fontWeight: '700', color: colors.ink },
  macroUnit: { fontSize: 12, fontWeight: '500', color: colors.muted },
});
