import { getApps } from '@react-native-firebase/app';

// Firebase auto-reads GoogleService-Info.plist / google-services.json
// No manual config needed with @react-native-firebase
// This file is just a safe import guard

const apps = getApps();

if (apps.length === 0) {
  throw new Error('Firebase app is not initialized. Check native Firebase configuration files.');
}

export const firebaseApp = apps[0];