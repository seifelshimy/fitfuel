// Entry route: send "/" straight to the Cart tab.

import React from 'react';
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(tabs)/cart" />;
}
