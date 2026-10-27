// Mohamed Salim: Screen 2 — Goal Recommendations.

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RecommendationCard } from '@/components/RecommendationCard';
import { SelectChip } from '@/components/SelectChip';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { GOAL_LABELS, RESTRICTION_LABELS } from '@/models/fitness';
import { colors, radius, spacing, typography } from '@/theme';
import { GOAL_FILTERS, useRecommendationsViewModel } from '@/viewmodels/useRecommendationsViewModel';

export default function RecommendationsScreen() {
  const vm = useRecommendationsViewModel();

  if (vm.isLoading) {
    return <LoadingState message="Matching supplements to your goal…" />;
  }
  if (vm.error) {
    return <ErrorState message={vm.error} onRetry={() => void vm.reload()} />;
  }

  const restrictions = vm.profile?.dietaryRestrictions.length
    ? vm.profile.dietaryRestrictions.map((item) => RESTRICTION_LABELS[item]).join(', ')
    : 'None';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.display}>Goals & Recs</Text>

        {vm.profile ? (
          <View style={styles.banner}>
            <Text style={styles.bannerLabel}>Active profile</Text>
            <Text style={styles.bannerTitle}>{vm.profile.fullName}</Text>
            <View style={styles.bannerRow}>
              <Text style={styles.bannerText}>{vm.profile.weightKg} kg</Text>
              <Text style={styles.bannerText}>· {GOAL_LABELS[vm.profile.goal]}</Text>
            </View>
            <Text style={styles.bannerText}>Restrictions: {restrictions}</Text>
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chips}>
            {GOAL_FILTERS.map((filter) => (
              <SelectChip
                key={filter}
                label={filter === 'profile' ? 'My goal' : GOAL_LABELS[filter]}
                selected={vm.goalFilter === filter}
                onPress={() => vm.setGoalFilter(filter)}
              />
            ))}
          </View>
        </ScrollView>

        {vm.isEmpty ? (
          <EmptyState
            icon="flame-outline"
            title="No matching supplements"
            message="Nothing in the catalog fits this goal and your dietary restrictions."
            actionLabel="Reset to my goal"
            onAction={vm.resetFilter}
          />
        ) : (
          <>
            <Text style={typography.caption}>
              {vm.recommendations.length} picks for{' '}
              {vm.activeGoal ? GOAL_LABELS[vm.activeGoal] : 'your goal'}
            </Text>
            {vm.recommendations.map((item) => (
              <RecommendationCard key={item.id} recommendation={item} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  banner: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  bannerLabel: { ...typography.label, color: colors.accent },
  bannerTitle: { ...typography.title, color: colors.surface },
  bannerRow: { flexDirection: 'row', gap: spacing.xs },
  bannerText: { fontSize: 14, color: '#C9CCD2' },
  chips: { flexDirection: 'row', gap: spacing.sm },
});
