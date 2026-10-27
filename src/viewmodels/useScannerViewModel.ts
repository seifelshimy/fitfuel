// Mohamed Salim: Barcode Scanner screen state and scan history.

import { useCallback, useEffect, useState } from 'react';
import { ScannedSupplement } from '@/models/fitness';
import {
  clearScanHistory,
  getScanHistory,
  lookupSupplementBarcode,
} from '@/services/scannerService';

export interface SampleBarcode {
  label: string;
  barcode: string;
}

export const SAMPLE_BARCODES: SampleBarcode[] = [
  { label: 'ON Gold Standard Whey', barcode: '0748927028669' },
  { label: 'Dymatize ISO100', barcode: '0705016353103' },
  { label: 'MuscleAdd Creatine', barcode: '6224001234567' },
];

export function useScannerViewModel() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeScan, setActiveScan] = useState<ScannedSupplement | null>(null);
  const [history, setHistory] = useState<ScannedSupplement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setHistory(await getScanHistory());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your scan history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const scan = useCallback(async (barcode: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const result = await lookupSupplementBarcode(barcode);
      setActiveScan(result);
      setHistory((current) =>
        [result, ...current.filter((item) => item.barcode !== result.barcode)].slice(0, 20),
      );
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unable to look up this barcode.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  const verifyInput = useCallback(() => scan(barcodeInput), [scan, barcodeInput]);

  const quickScan = useCallback(
    (barcode: string) => {
      setBarcodeInput(barcode);
      return scan(barcode);
    },
    [scan],
  );

  const clearHistory = useCallback(async () => {
    setScanError(null);
    try {
      await clearScanHistory();
      setHistory([]);
      setActiveScan(null);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Unable to clear your scan history.');
    }
  }, []);

  return {
    barcodeInput,
    setBarcodeInput: (value: string) => setBarcodeInput(value.replace(/\D/g, '')),
    activeScan,
    selectScan: setActiveScan,
    history,
    samples: SAMPLE_BARCODES,
    isLoading,
    isScanning,
    error,
    scanError,
    isEmpty: !isLoading && !error && history.length === 0 && !activeScan,
    verifyInput,
    quickScan,
    clearHistory,
    reload: loadHistory,
  };
}
