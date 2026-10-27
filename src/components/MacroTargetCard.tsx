import { StyleSheet, Text, View } from 'react-native';
import { BmiCategory, DailyTargets } from '@/models/fitness';
import { colors, radius, spacing, typography } from '@/theme';

const BMI_BADGE_COLORS: Record<BmiCategory, { bg: string; fg: string }> = {
  Underweight: { bg: '#DCE8FF', fg: '#1F3D7A' },
  Normal: { bg: colors.accent, fg: colors.accentInk },
  Overweight: { bg: '#FFE3D3', fg: '#7A3B12' },
  Obese: { bg: colors.dangerSoft, fg: colors.danger },
};

interface Props {
  targets: DailyTargets;
}

export function MacroTargetCard({ targets }: Props) {
  const badge = BMI_BADGE_COLORS[targets.bmiCategory];

  const metrics = [
    { label: 'Calories', value: targets.dailyCalories.toLocaleString('en-US'), unit: 'kcal' },
    { label: 'Protein', value: String(targets.proteinGrams), unit: 'g' },
    { label: 'Creatine', value: String(targets.creatineGrams), unit: 'g' },
    { label: 'Water', value: String(targets.waterLiters), unit: 'L' },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>BMI</Text>
          <Text style={styles.bmi}>{targets.bmi.toFixed(1)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>{targets.bmiCategory}</Text>
        </View>
      </View>
      <Text style={styles.label}>Daily targets</Text>
      <View style={styles.grid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metric}>
            <Text style={styles.metricValue}>
              {metric.value}
              <Text style={styles.metricUnit}> {metric.unit}</Text>
            </Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: { ...typography.label, color: '#A9ADB5' },
  bmi: { fontSize: 36, fontWeight: '800', color: colors.surface, letterSpacing: -1 },
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metric: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#24272D',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  metricValue: { fontSize: 20, fontWeight: '700', color: colors.surface },
  metricUnit: { fontSize: 13, fontWeight: '500', color: '#A9ADB5' },
  metricLabel: { ...typography.caption, color: '#A9ADB5', marginTop: 2 },
});
