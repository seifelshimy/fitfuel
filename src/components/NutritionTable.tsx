import { StyleSheet, Text, View } from 'react-native';
import { NutritionFacts } from '@/models/product';
import { colors, radius, spacing, typography } from '@/theme';

export function NutritionTable({ facts }: { facts: NutritionFacts }) {
  const rows: [string, string][] = [
    ['Calories', `${facts.calories} kcal`],
    ['Protein', `${facts.protein} g`],
    ['Carbohydrates', `${facts.carbs} g`],
    ['of which sugar', `${facts.sugar} g`],
    ['Fat', `${facts.fat} g`],
  ];

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.headTitle}>Nutrition facts</Text>
        <Text style={typography.caption}>Per {facts.servingSize}</Text>
      </View>
      {rows.map(([label, value], i) => (
        <View key={label} style={[styles.row, i === rows.length - 1 && styles.last]}>
          <Text style={[styles.label, label.startsWith('of') && styles.indent]}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  head: {
    paddingVertical: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.ink,
  },
  headTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  last: { borderBottomWidth: 0 },
  label: { fontSize: 15, color: colors.inkSoft, fontWeight: '600' },
  indent: { paddingLeft: spacing.lg, fontWeight: '400' },
  value: { fontSize: 15, color: colors.ink, fontWeight: '700' },
});
