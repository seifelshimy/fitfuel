// Mohamed Salim: Screen 3 — Barcode Scanner.
// No native camera module is imported here, so the screen renders the same
// on web, Expo Go and native builds without a blank white screen.

import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScannedProductCard } from '@/components/ScannedProductCard';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { colors, radius, spacing, typography } from '@/theme';
import { useScannerViewModel } from '@/viewmodels/useScannerViewModel';

const VIEWFINDER_HEIGHT = 180;

function Viewfinder({ isScanning }: { isScanning: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [spacing.lg, VIEWFINDER_HEIGHT - spacing.lg],
  });

  return (
    <View style={styles.viewfinder} accessibilityLabel="Barcode viewfinder">
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
      <View style={styles.viewfinderCenter}>
        {isScanning ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Ionicons name="barcode-outline" size={48} color="#5A5E66" />
        )}
        <Text style={styles.viewfinderText}>
          {isScanning ? 'Verifying barcode…' : 'Tap a sample or enter a barcode below'}
        </Text>
      </View>
    </View>
  );
}

export default function ScannerScreen() {
  const vm = useScannerViewModel();

  if (vm.isLoading) {
    return <LoadingState message="Loading scan history…" />;
  }
  if (vm.error) {
    return <ErrorState message={vm.error} onRetry={() => void vm.reload()} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={typography.display}>Barcode Scan</Text>
        <Text style={typography.body}>
          Check a supplement's authenticity and macros before you buy.
        </Text>

        <Viewfinder isScanning={vm.isScanning} />

        <View style={styles.section}>
          <Text style={typography.label}>Quick scan verified sample</Text>
          {vm.samples.map((sample) => (
            <Pressable
              key={sample.barcode}
              onPress={() => void vm.quickScan(sample.barcode)}
              disabled={vm.isScanning}
              accessibilityRole="button"
              style={({ pressed }) => [styles.sample, pressed && styles.pressed]}
            >
              <Ionicons name="scan-outline" size={18} color={colors.ink} />
              <View style={styles.sampleText}>
                <Text style={typography.subtitle}>{sample.label}</Text>
                <Text style={typography.caption}>{sample.barcode}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={typography.label}>Manual EAN/UPC entry</Text>
          <TextInput
            value={vm.barcodeInput}
            onChangeText={vm.setBarcodeInput}
            placeholder="e.g. 0748927028669"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={14}
            style={styles.input}
            onSubmitEditing={() => void vm.verifyInput()}
          />
          <PrimaryButton
            label={vm.isScanning ? 'Verifying…' : 'Verify Barcode'}
            icon="shield-checkmark-outline"
            disabled={vm.isScanning || !vm.barcodeInput}
            onPress={() => void vm.verifyInput()}
          />
          {vm.scanError ? <Text style={styles.error}>{vm.scanError}</Text> : null}
        </View>

        {vm.activeScan ? <ScannedProductCard product={vm.activeScan} /> : null}

        <View style={styles.historyHeader}>
          <Text style={typography.subtitle}>Recent scan history</Text>
          {vm.history.length ? (
            <Text style={styles.clear} onPress={() => void vm.clearHistory()}>
              Clear History
            </Text>
          ) : null}
        </View>

        {vm.isEmpty ? (
          <EmptyState
            icon="barcode-outline"
            title="No scans yet"
            message="Scanned supplements will appear here so you can compare them later."
          />
        ) : (
          vm.history.map((item) => (
            <Pressable
              key={item.barcode}
              onPress={() => vm.selectScan(item)}
              style={({ pressed }) => [styles.historyRow, pressed && styles.pressed]}
            >
              <Ionicons
                name={item.isAuthenticFitFuelPartner ? 'shield-checkmark' : 'globe-outline'}
                size={18}
                color={item.isAuthenticFitFuelPartner ? colors.success : colors.muted}
              />
              <View style={styles.sampleText}>
                <Text style={typography.subtitle}>{item.name}</Text>
                <Text style={typography.caption}>
                  {item.brand} · {item.barcode}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CORNER = 26;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  viewfinder: {
    height: VIEWFINDER_HEIGHT,
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderCenter: { alignItems: 'center', gap: spacing.sm },
  viewfinderText: { color: '#A9ADB5', fontSize: 13 },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: spacing.xl,
    right: spacing.xl,
    height: 2,
    backgroundColor: colors.accent,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: colors.accent,
  },
  topLeft: { top: spacing.md, left: spacing.md, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: spacing.md, right: spacing.md, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: spacing.md, left: spacing.md, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: {
    bottom: spacing.md,
    right: spacing.md,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sample: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sampleText: { flex: 1 },
  pressed: { opacity: 0.8 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 18,
    letterSpacing: 1,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  error: { color: colors.danger, fontSize: 13, fontWeight: '500' },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  clear: { color: colors.danger, fontWeight: '700' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
