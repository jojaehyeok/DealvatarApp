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
        name="index"
        options={{
          title: '입찰한 물건',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔨" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="won"
        options={{
          title: '낙찰한 물건',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} />,
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
