import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { loadUser, DealerUser } from '../lib/api';

export default function RootLayout() {
  const [user, setUser] = useState<DealerUser | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUser().then(setUser);
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    const inTabs = segments[0] === '(tabs)';
    if (!user && inTabs) router.replace('/login');
    if (user && !inTabs) router.replace('/(tabs)');
  }, [user, segments]);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f0f' }}>
        <ActivityIndicator color="#8b5cf6" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
