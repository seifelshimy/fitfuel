// Shared UI (Seif Elshimy): a labelled text input with an error message underneath.
// Accepts every normal TextInput prop (placeholder, maxLength, multiline...).

import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

type Props = TextInputProps & { label: string; error?: string };

export function FormField({ label, error, style, ...inputProps }: Props) {
  return (
    <View>
      <Text style={[typography.label, styles.label]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        accessibilityLabel={label}
        {...inputProps}
        style={[styles.input, inputProps.multiline && styles.multiline, error ? styles.inputError : null, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
});