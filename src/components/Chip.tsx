import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  /** Shows a small × so the chip reads as "remove this filter". */
  removable?: boolean;
  disabled?: boolean;
}

export function Chip({ label, selected, onPress, icon, removable, disabled }: Props) {
  const fg = selected ? colors.surface : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={removable ? `Remove filter ${label}` : label}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && { opacity: 0.8 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={15} color={fg} style={{ marginRight: 6 }} /> : null}
      <Text style={[styles.label, { color: fg }, disabled && styles.strike]}>{label}</Text>
      {removable ? <Ionicons name="close" size={14} color={fg} style={{ marginLeft: 6 }} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md + 2,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  disabled: { opacity: 0.45 },
  label: { fontSize: 14, fontWeight: '600' },
  strike: { textDecorationLine: 'line-through' },
});
