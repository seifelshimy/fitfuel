// "Delivery Pin & Coordinates Selector": works on every platform without a
// native map. On web it is the main way to place the pin; on phones it sits
// under the interactive map as quick presets and fine adjustment.

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { PrimaryButton } from './PrimaryButton';

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Preset extends Coordinate {
  id: string;
  label: string;
}

interface Props {
  coordinate: Coordinate | null;
  fallbackCenter: Coordinate;
  presets: Preset[];
  isLocating: boolean;
  onSelectCoordinate: (latitude: number, longitude: number) => void;
  onUseCurrentLocation: () => void;
}

// About 110 m per tap: enough to move between streets.
const NUDGE_STEP = 0.001;

export function LocationPicker({
  coordinate,
  fallbackCenter,
  presets,
  isLocating,
  onSelectCoordinate,
  onUseCurrentLocation,
}: Props) {
  const current = coordinate ?? fallbackCenter;

  const nudge = (deltaLat: number, deltaLng: number) => {
    const latitude = Number((current.latitude + deltaLat).toFixed(4));
    const longitude = Number((current.longitude + deltaLng).toFixed(4));
    onSelectCoordinate(latitude, longitude);
  };

  const isPresetActive = (preset: Preset) =>
    coordinate !== null &&
    Math.abs(coordinate.latitude - preset.latitude) < 0.0001 &&
    Math.abs(coordinate.longitude - preset.longitude) < 0.0001;

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name="pin-outline" size={18} color={colors.ink} />
        <Text style={typography.subtitle}>Delivery Pin & Coordinates Selector</Text>
      </View>

      <PrimaryButton
        label={isLocating ? 'Locating…' : 'Use My Current GPS Location'}
        icon="navigate-outline"
        variant="accent"
        onPress={onUseCurrentLocation}
        disabled={isLocating}
      />

      <Text style={typography.label}>Quick Cairo areas</Text>
      <View style={styles.presets}>
        {presets.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <Pressable
              key={preset.id}
              onPress={() => onSelectCoordinate(preset.latitude, preset.longitude)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{preset.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={typography.label}>Fine-tune the pin</Text>
      <View style={styles.adjustRow}>
        <CoordinateAdjuster
          label="Latitude"
          value={coordinate ? coordinate.latitude.toFixed(4) : '—'}
          decreaseLabel="Move pin south"
          increaseLabel="Move pin north"
          onDecrease={() => nudge(-NUDGE_STEP, 0)}
          onIncrease={() => nudge(NUDGE_STEP, 0)}
        />
        <CoordinateAdjuster
          label="Longitude"
          value={coordinate ? coordinate.longitude.toFixed(4) : '—'}
          decreaseLabel="Move pin west"
          increaseLabel="Move pin east"
          onDecrease={() => nudge(0, -NUDGE_STEP)}
          onIncrease={() => nudge(0, NUDGE_STEP)}
        />
      </View>
      <Text style={typography.caption}>Each tap moves the pin about 110 m.</Text>
    </View>
  );
}

interface AdjusterProps {
  label: string;
  value: string;
  decreaseLabel: string;
  increaseLabel: string;
  onDecrease: () => void;
  onIncrease: () => void;
}

function CoordinateAdjuster({ label, value, decreaseLabel, increaseLabel, onDecrease, onIncrease }: AdjusterProps) {
  return (
    <View style={styles.adjuster}>
      <Text style={typography.caption}>{label}</Text>
      <View style={styles.adjusterRow}>
        <Pressable
          onPress={onDecrease}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={decreaseLabel}
          style={({ pressed }) => [styles.adjustButton, pressed && styles.pressed]}
        >
          <Ionicons name="remove" size={18} color={colors.ink} />
        </Pressable>
        <Text style={styles.adjustValue}>{value}</Text>
        <Pressable
          onPress={onIncrease}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={increaseLabel}
          style={({ pressed }) => [styles.adjustButton, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={18} color={colors.ink} />
        </Pressable>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.surface,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  adjuster: {
    flex: 1,
    gap: spacing.xs,
  },
  adjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  adjustButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.7,
  },
});
