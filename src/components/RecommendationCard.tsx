import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SupplementRecommendation } from '@/models/fitness';
import { categoryColors, colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';

interface Props {
  recommendation: SupplementRecommendation;
}

export function RecommendationCard({ recommendation }: Props) {
  const tile = categoryColors[recommendation.category] ?? colors.surfaceMuted;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.tile, { backgroundColor: tile }]}>
          <Ionicons name="flask-outline" size={22} color={colors.ink} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={typography.label}>{recommendation.brand}</Text>
          <Text style={typography.subtitle}>{recommendation.name}</Text>
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreText}>{recommendation.matchScore}%</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.price}>{formatPrice(recommendation.price)}</Text>
        <Text style={typography.caption}>{recommendation.category}</Text>
      </View>

      <View style={styles.dosage}>
        <Ionicons name="scale-outline" size={16} color={colors.inkSoft} />
        <View style={styles.dosageText}>
          <Text style={styles.dosageValue}>{recommendation.recommendedDosage}</Text>
          <Text style={typography.caption}>{recommendation.baseServingNote}</Text>
        </View>
      </View>

      <View style={styles.tags}>
        {recommendation.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <Text style={typography.body}>{recommendation.reason}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1 },
  score: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  scoreText: { fontSize: 13, fontWeight: '800', color: colors.accentInk },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 18, fontWeight: '700', color: colors.ink },
  dosage: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  dosageText: { flex: 1 },
  dosageValue: { fontSize: 15, fontWeight: '700', color: colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: colors.inkSoft },
});
