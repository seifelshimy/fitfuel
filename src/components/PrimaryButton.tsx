import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  icon?: IconName;
  disabled?: boolean;
}

export function PrimaryButton({ label, onPress, variant = 'primary', icon, disabled }: Props) {
  const palette = {
    primary: { bg: colors.ink, fg: colors.surface, border: colors.ink },
    secondary: { bg: colors.surface, fg: colors.ink, border: colors.border },
    accent: { bg: colors.accent, fg: colors.accentInk, border: colors.accent },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={18} color={palette.fg} style={styles.icon} /> : null}
        <Text style={[styles.label, { color: palette.fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  label: { fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.4 },
});
