// Shared ViewModel helper (Seif Elshimy).
// Tab screens stay mounted when you switch tabs, so their data can go stale
// (for example after the Admin panel deletes a product). This reloads the
// data every time the screen comes back into focus.

import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

export function useRefreshOnFocus(refresh: () => void) {
  // Keep the latest refresh function without re-running the effect on every render.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // The first focus is the first load, which useAsyncData already does.
  const firstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      refreshRef.current();
    }, []),
  );
}