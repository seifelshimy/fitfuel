// Mohamed Salim: Screen 1 — Fitness Profile.

import { KeyboardTypeOptions, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MacroTargetCard } from '@/components/MacroTargetCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SelectChip } from '@/components/SelectChip';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import {
  ACTIVITY_LABELS,
  ActivityLevel,
  DietaryRestriction,
  FitnessGoal,
  GOAL_LABELS,
  ProfileFormField,
  RESTRICTION_LABELS,
} from '@/models/fitness';
import { colors, radius, spacing, typography } from '@/theme';
import { useProfileViewModel } from '@/viewmodels/useProfileViewModel';

const GOALS = Object.keys(GOAL_LABELS) as FitnessGoal[];
const ACTIVITY_LEVELS = Object.keys(ACTIVITY_LABELS) as ActivityLevel[];
const RESTRICTIONS = Object.keys(RESTRICTION_LABELS) as DietaryRestriction[];

const FIELDS: Array<{
  key: ProfileFormField;
  label: string;
  placeholder: string;
  keyboardType: KeyboardTypeOptions;
}> = [
  { key: 'fullName', label: 'Full name', placeholder: 'Mohamed Salim', keyboardType: 'default' },
  { key: 'age', label: 'Age', placeholder: '21', keyboardType: 'number-pad' },
  { key: 'weightKg', label: 'Weight (kg)', placeholder: '78', keyboardType: 'decimal-pad' },
  { key: 'heightCm', label: 'Height (cm)', placeholder: '178', keyboardType: 'decimal-pad' },
];

export default function ProfileScreen() {
  const vm = useProfileViewModel();

  if (vm.isLoading) {
    return <LoadingState message="Loading your fitness profile…" />;
  }
  if (vm.error) {
    return <ErrorState message={vm.error} onRetry={() => void vm.reload()} />;
  }
  if (vm.isEmpty || !vm.form) {
    return (
      <EmptyState
        icon="body-outline"
        title="No fitness profile yet"
        message="Load your profile to calculate your daily targets."
        actionLabel="Load profile"
        onAction={() => void vm.reload()}
      />
    );
  }

  const { form } = vm;
  const hasRestrictions = form.dietaryRestrictions.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.display}>Fitness Profile</Text>
        <Text style={typography.body}>
          Your biometrics drive daily targets and supplement dosages.
        </Text>

        {vm.targets ? <MacroTargetCard targets={vm.targets} /> : null}

        <View style={styles.section}>
          <Text style={typography.subtitle}>Biometrics</Text>
          {FIELDS.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text style={typography.label}>{field.label}</Text>
              <TextInput
                value={form[field.key]}
                onChangeText={(value) => vm.updateField(field.key, value)}
                placeholder={field.placeholder}
                placeholderTextColor={colors.muted}
                keyboardType={field.keyboardType}
                autoCapitalize={field.key === 'fullName' ? 'words' : 'none'}
                style={[styles.input, vm.errors[field.key] && styles.inputError]}
              />
              {vm.errors[field.key] ? (
                <Text style={styles.error}>{vm.errors[field.key]}</Text>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={typography.subtitle}>Fitness goal</Text>
          <View style={styles.chips}>
            {GOALS.map((goal) => (
              <SelectChip
                key={goal}
                label={GOAL_LABELS[goal]}
                selected={form.goal === goal}
                onPress={() => vm.setGoal(goal)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={typography.subtitle}>Activity level</Text>
          <View style={styles.chips}>
            {ACTIVITY_LEVELS.map((level) => (
              <SelectChip
                key={level}
                label={ACTIVITY_LABELS[level]}
                selected={form.activityLevel === level}
                onPress={() => vm.setActivityLevel(level)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={typography.subtitle}>Dietary restrictions</Text>
          <View style={styles.chips}>
            {RESTRICTIONS.map((restriction) => (
              <SelectChip
                key={restriction}
                label={RESTRICTION_LABELS[restriction]}
                selected={
                  restriction === 'none'
                    ? !hasRestrictions
                    : form.dietaryRestrictions.includes(restriction)
                }
                onPress={() => vm.toggleRestriction(restriction)}
              />
            ))}
          </View>
        </View>

        {vm.confirmation ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{vm.confirmation}</Text>
          </View>
        ) : null}
        {vm.saveError ? <Text style={styles.error}>{vm.saveError}</Text> : null}

        <PrimaryButton
          label={vm.isSaving ? 'Saving…' : 'Save profile'}
          icon="checkmark-circle-outline"
          variant="accent"
          disabled={vm.isSaving}
          onPress={() => void vm.save()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  field: { gap: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  banner: {
    backgroundColor: '#E3F4E8',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  bannerText: { color: colors.success, fontWeight: '700' },
});
