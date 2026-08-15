import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTheme } from '../../lib/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: { backgroundColor: theme.bg, borderTopColor: theme.divider },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSub,
      }}
    >
      <Tabs.Screen
        name="market"
        options={{
          title: '경매장',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏛️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // (tabs) 그룹 기본 경로 유지용 — 실제 내용은 market으로 리다이렉트, 탭바엔 안 보임
        }}
      />
      <Tabs.Screen
        name="partner-inspection"
        options={{
          title: '제휴검차',
          href: null, // 하단 탭에는 안 띄우고 마이 탭 메뉴에서 진입 — 화면 자체는 유지
        }}
      />
      <Tabs.Screen
        name="my-listings"
        options={{
          title: '내 매물 관리',
          href: null, // 하단 탭에는 안 띄우고 마이 탭 메뉴에서 진입
        }}
      />
      <Tabs.Screen
        name="toss-checkout"
        options={{
          title: '결제',
          href: null, // 제휴검차 신청 폼에서만 진입
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '마이',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
