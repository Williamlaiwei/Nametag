import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import * as LocalAuthentication from 'expo-local-authentication';
import { getSetting, migrateDbIfNeeded, purgeExpired } from '@/db';
import { Button } from '@/components/ui';
import { SettingsProvider } from '@/components/Settings';
import { TagsProvider, TagsToggle } from '@/components/Tag';
import { colors } from '@/theme';

/** 開啟 App 密碼 / 生物辨識:保護私人筆記(例如你給誰打了幾顆星)。 */
function LockGate({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [state, setState] = useState<'checking' | 'locked' | 'open'>('checking');

  const unlock = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: '解鎖 Partyking' });
    setState(result.success ? 'open' : 'locked');
  }, []);

  useEffect(() => {
    (async () => {
      await purgeExpired(db);
      const enabled = (await getSetting(db, 'app_lock')) === '1';
      if (!enabled) return setState('open');
      const canAuth = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
      if (!canAuth) return setState('open');
      setState('locked');
      await unlock();
    })();
  }, [db, unlock]);

  if (state === 'open') return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 16 }}>Partyking</Text>
      {state === 'locked' && <Button title="解鎖" onPress={unlock} code="H01" />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="partyking.db" onInit={migrateDbIfNeeded}>
      <StatusBar style="dark" />
      <TagsProvider>
      <SettingsProvider>
      <View style={{ flex: 1 }}>
      <LockGate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.ink,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="person/[id]" options={{ title: '認識的人' }} />
          <Stack.Screen name="gathering/[id]" options={{ title: '聚會' }} />
          <Stack.Screen name="scan" options={{ title: '掃描 QR 碼', presentation: 'modal' }} />
        </Stack>
      </LockGate>
      <TagsToggle />
      </View>
      </SettingsProvider>
      </TagsProvider>
    </SQLiteProvider>
  );
}
