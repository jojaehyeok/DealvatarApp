import { Stack } from 'expo-router';
import { useTheme } from '../../../lib/theme';

// "경매장" 탭 안에서만 목록↔상세를 오가는 별도 스택 — (tabs) 세그먼트 밖으로 안 나가야
// 루트 _layout.tsx의 인증 리다이렉트(!inTabs -> /(tabs))에 튕기지 않는다.
export default function MarketLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: '매물 상세' }} />
    </Stack>
  );
}
