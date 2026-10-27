// Web (and any non-native platform) version of the delivery map.
// react-native-maps has no web support, so this file never imports it;
// Metro picks DeliveryMap.native.tsx on iOS and Android instead.

import React from 'react';

export interface DeliveryMapProps {
  coordinate: { latitude: number; longitude: number } | null;
  fallbackCenter: { latitude: number; longitude: number };
  onSelectCoordinate: (latitude: number, longitude: number) => void;
}

export const isNativeMapSupported = false;

export function DeliveryMap(_props: DeliveryMapProps): React.ReactElement | null {
  return null;
}
