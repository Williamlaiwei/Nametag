import { useRef } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { addToRoster, getGathering, joinGathering, saveExchangedIntro } from '@/db';
import { parseScanned } from '@/lib/intro';
import { Button } from '@/components/ui';
import { colors } from '@/theme';
import { useT } from '@/components/Settings';

/**
 * 掃碼入口:
 * - 帶 gatheringId:主辦人掃賓客,加進這場聚會的名單
 * - 沒帶:互掃交換(存成認識的人),或掃聚會碼加入聚會
 */
export default function ScanScreen() {
  const t = useT();
  const db = useSQLiteContext();
  const { gatheringId } = useLocalSearchParams<{ gatheringId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const busy = useRef(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.ink, textAlign: 'center', marginBottom: 16 }}>{t('掃描 QR 碼需要使用相機。')}</Text>
        <Button title={t('允許使用相機')} onPress={requestPermission} code="F01" />
      </View>
    );
  }

  const handle = async (data: string) => {
    if (busy.current) return;
    busy.current = true;
    const release = () => {
      busy.current = false;
    };
    const scanned = parseScanned(data);

    if (scanned.kind === 'unknown') {
      Alert.alert(t('不認得這個 QR 碼'), t('請掃描 Partyking 的 QR 碼。'), [{ text: t('好'), onPress: release }]);
      return;
    }

    if (scanned.kind === 'gathering') {
      if (scanned.endsAt < Date.now()) {
        Alert.alert(t('這場聚會已經結束'), undefined, [{ text: t('好'), onPress: release }]);
        return;
      }
      await joinGathering(db, scanned.id, scanned.title, scanned.endsAt, scanned.cloud);
      router.replace(`/gathering/${scanned.id}` as never);
      return;
    }

    // 自我介紹
    if (gatheringId) {
      const g = await getGathering(db, gatheringId);
      if (!g || g.role !== 'creator') {
        Alert.alert(t('只有聚會建立者可以加入名單'), undefined, [{ text: t('好'), onPress: release }]);
        return;
      }
      const added = await addToRoster(db, gatheringId, scanned.intro);
      const who = scanned.intro.fields.nickname ?? t('這位賓客');
      Alert.alert(added ? t('已加入:{0}', who) : t('已更新:{0}', who), t('可以繼續掃下一位。'), [
        { text: t('繼續'), onPress: release },
        { text: t('完成'), onPress: () => router.back() },
      ]);
      return;
    }

    const id = await saveExchangedIntro(db, scanned.intro);
    router.replace(`/person/${id}` as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          handle(data);
        }}
      />
      <View style={styles.hint}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>
          {gatheringId ? t('掃描賓客的 QR 碼,加進名單') : t('對準對方的 QR 碼或聚會碼')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  hint: { position: 'absolute', bottom: 48, left: 24, right: 24, backgroundColor: '#0008', padding: 12, borderRadius: 12 },
});
