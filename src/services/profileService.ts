// Mohamed Salim: fitness profile persistence (AsyncStorage + Cloud Firestore REST sync).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FitnessProfile } from '@/models/fitness';

const PROFILE_KEY = '@fitfuel_fitness_profile_v1';

export const DEFAULT_FITNESS_PROFILE: FitnessProfile = {
  userId: 'mohamed-salim',
  fullName: 'Mohamed Salim',
  age: 21,
  weightKg: 78,
  heightCm: 178,
  goal: 'muscle_gain',
  activityLevel: 'active',
  dietaryRestrictions: ['lactose_free'],
  updatedAt: new Date(0).toISOString(),
};

function firestoreProfileUrl(userId: string): string | null {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return null;
  }
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/fitnessProfiles/${encodeURIComponent(userId)}`;
}

async function readLocalProfile(): Promise<FitnessProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as FitnessProfile) : null;
  } catch {
    throw new Error('Unable to read your fitness profile from this device.');
  }
}

async function writeLocalProfile(profile: FitnessProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    throw new Error('Unable to save your fitness profile on this device.');
  }
}

async function fetchCloudProfile(userId: string): Promise<FitnessProfile | null> {
  const url = firestoreProfileUrl(userId);
  if (!url) {
    return null;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as {
      fields?: { profileJson?: { stringValue?: string } };
    };
    const json = data.fields?.profileJson?.stringValue;
    return json ? (JSON.parse(json) as FitnessProfile) : null;
  } catch {
    // Offline or Firestore unavailable: the local copy remains the source of truth.
    return null;
  }
}

async function syncProfileToFirestore(profile: FitnessProfile): Promise<void> {
  const url = firestoreProfileUrl(profile.userId);
  if (!url) {
    return;
  }

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { profileJson: { stringValue: JSON.stringify(profile) } },
      }),
    });
  } catch {
    // Offline fallback: AsyncStorage already holds the latest profile.
  }
}

export async function getFitnessProfile(): Promise<FitnessProfile> {
  try {
    const local = await readLocalProfile();
    if (local) {
      return local;
    }

    const cloud = await fetchCloudProfile(DEFAULT_FITNESS_PROFILE.userId);
    const seeded = cloud ?? DEFAULT_FITNESS_PROFILE;
    await writeLocalProfile(seeded);
    return seeded;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to load your fitness profile.');
  }
}

export async function saveFitnessProfile(profile: FitnessProfile): Promise<FitnessProfile> {
  try {
    const saved: FitnessProfile = { ...profile, updatedAt: new Date().toISOString() };
    await writeLocalProfile(saved);
    await syncProfileToFirestore(saved);
    return saved;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to save your fitness profile.');
  }
}
