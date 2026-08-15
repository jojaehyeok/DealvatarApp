import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Platform, View, ActivityIndicator } from 'react-native';
import { loadUser, updatePushToken, DealerUser } from '../lib/api';
import { useTheme } from '../lib/theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires
let Notifications: typeof import('expo-notifications') | null = null;
try {
  Notifications = require('expo-notifications') as typeof import('expo-notifications');
} catch (_) {}

Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NOTIFICATION_CHANNEL_ID = 'dealvatar-alerts';

if (Platform.OS === 'android') {
  Notifications?.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: '딜바타 알림',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

export default function RootLayout() {
  const theme = useTheme();
  const [user, setUser] = useState<DealerUser | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadUser().then(setUser);
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    const inTabs = segments[0] === '(tabs)';
    const needsApproval = !!user && user.role === 'dealer' && user.dealerStatus !== 'approved';
    const onPendingScreen = segments[0] === 'pending-approval';

    if (!user && inTabs) router.replace('/login');
    if (user && needsApproval && !onPendingScreen) router.replace('/pending-approval');
    if (user && !needsApproval && (!inTabs)) router.replace('/(tabs)');
  }, [user, segments]);

  // 앱 푸쉬 토큰 등록 — 낙찰/입찰경쟁 알림 수신용. 승인된 딜러만 등록(승인대기 중엔 의미 없음).
  useEffect(() => {
    if (!Notifications || !user || user.dealerStatus !== 'approved') return;

    const register = async () => {
      try {
        const { status: existing } = await Notifications!.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications!.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications!.getDevicePushTokenAsync();
        await updatePushToken(user.id, tokenData.data);
      } catch (e) {
        console.error('[Push] 토큰 등록 실패:', e);
      }
    };

    register();
  }, [user]);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }} />;
}
