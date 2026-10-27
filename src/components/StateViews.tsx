// Shared loading, empty and error states (UI requirement: clear feedback
// for loading, empty and error states). Every screen uses these.

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { PrimaryButton } from './PrimaryButton';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" color={colors.ink} />
      <Text style={[typography.caption, styles.gap]}>{message}</Text>
    </View>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'search-outline', title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={colors.inkSoft} />
      </View>
      <Text style={[typography.subtitle, styles.center, styles.gap]}>{title}</Text>
      {message ? <Text style={[typography.body, styles.center, styles.smallGap]}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} variant="secondary" />
        </View>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
      </View>
      <Text style={[typography.subtitle, styles.center, styles.gap]}>Couldn't load this</Text>
      <Text style={[typography.body, styles.center, styles.smallGap]}>{message}</Text>
      {onRetry ? (
        <View style={styles.action}>
          <PrimaryButton label="Try again" icon="refresh" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    minHeight: 280,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  gap: { marginTop: spacing.lg },
  smallGap: { marginTop: spacing.xs, maxWidth: 300 },
  action: { marginTop: spacing.xl, minWidth: 160 },
});
