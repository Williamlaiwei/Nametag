import { Text, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { useTags } from '@/components/Tag';
import { colors } from '@/theme';

function icon(glyph: string) {
  return ({ color }: { color: ColorValue }) => <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

// 底部分頁的標記碼:T01 首頁、T02 認識的人、T03 聚會、T04 我、T05 設定(開啟標記碼時顯示在分頁名稱前)
export default function TabsLayout() {
  const { show } = useTags();
  const t = (code: string, name: string) => (show ? `${code} ${name}` : name);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.ink,
        tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('T01', '首頁'), tabBarIcon: icon('✎'), headerShown: false }} />
      <Tabs.Screen name="people" options={{ title: t('T02', '認識的人'), tabBarIcon: icon('☺') }} />
      <Tabs.Screen name="gatherings" options={{ title: t('T03', '聚會'), tabBarIcon: icon('◎') }} />
      <Tabs.Screen name="me" options={{ title: t('T04', '我'), tabBarIcon: icon('♥') }} />
      <Tabs.Screen name="settings" options={{ title: t('T05', '設定'), tabBarIcon: icon('⚙') }} />
    </Tabs>
  );
}
