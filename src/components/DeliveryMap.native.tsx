// Interactive delivery map for iOS and Android: tap anywhere or drag the pin.
// Wrapped in an error boundary so a build without the native map module
// (or a map SDK failure) falls back to the coordinate selector instead of crashing.

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { colors, radius, spacing, typography } from '@/theme';
import type { DeliveryMapProps } from './DeliveryMap';

export type { DeliveryMapProps } from './DeliveryMap';

export const isNativeMapSupported = true;

const REGION_DELTA = { latitudeDelta: 0.04, longitudeDelta: 0.04 };

class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[DeliveryMap] Native map unavailable, using the coordinate selector.', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.unavailable}>
          <Text style={typography.caption}>
            The interactive map isn’t available in this build. Use the selector below to place your pin.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function InteractiveMap({ coordinate, fallbackCenter, onSelectCoordinate }: DeliveryMapProps) {
  const mapRef = useRef<MapView>(null);
  const center = coordinate ?? fallbackCenter;

  // Follow the pin when it moves from outside the map (preset, GPS or nudge).
  useEffect(() => {
    if (coordinate) {
      mapRef.current?.animateToRegion({ ...coordinate, ...REGION_DELTA }, 400);
    }
  }, [coordinate?.latitude, coordinate?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{ ...center, ...REGION_DELTA }}
        onPress={(event) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          onSelectCoordinate(latitude, longitude);
        }}
      >
        {coordinate ? (
          <Marker
            coordinate={coordinate}
            draggable
            pinColor={colors.ink}
            onDragEnd={(event) => {
              const { latitude, longitude } = event.nativeEvent.coordinate;
              onSelectCoordinate(latitude, longitude);
            }}
          />
        ) : null}
      </MapView>
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>{coordinate ? 'Drag the pin or tap to move it' : 'Tap the map to drop a pin'}</Text>
      </View>
    </View>
  );
}

export function DeliveryMap(props: DeliveryMapProps) {
  return (
    <MapErrorBoundary>
      <InteractiveMap {...props} />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 240,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  map: {
    flex: 1,
  },
  hint: {
    position: 'absolute',
    top: spacing.sm,
    alignSelf: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.surface,
  },
  unavailable: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.lg,
  },
});
