import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { createGathering, listGatherings, newId, type Gathering } from '@/db';
import { createCloudGathering, isCloudConfigured } from '@/cloud';
import { Button, Card, Chip, code, Empty, Field, Label, Row, Screen } from '@/components/ui';
import { colors } from '@/theme';
import { useT } from '@/components/Settings';

const DURATIONS = [3, 6, 12, 24];
const HOUR_MS = 60 * 60 * 1000;

function formatEnd(ms: number): string {
  const d = new Date(ms);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${two(d.getHours())}:${two(d.getMinutes())}`;
}

export default function GatheringsScreen() {
  const t = useT();
  const db = useSQLiteContext();
  const [list, setList] = useState<Gathering[]>([]);
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(6);

  const load = useCallback(() => listGatherings(db).then(setList), [db]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const create = async () => {
    const base = { id: newId(), title: title.trim() || t('未命名聚會'), endsAt: Date.now() + hours * HOUR_MS };
    let cloud = false;
    if (isCloudConfigured()) {
      try {
        await createCloudGathering(base);
        cloud = true;
      } catch {
        Alert.alert(t('沒有連上雲端'), t('這場聚會先用離線模式建立:名單由你的手機保管。'));
      }
    }
    const g = await createGathering(db, { ...base, cloud });
    setTitle('');
    await load();
    router.push(`/gathering/${g.id}` as never);
  };

  return (
    <Screen>
      <Card>
        <Label>{t('建立聚會碼')}</Label>
        <Field code="C01" value={title} onChangeText={setTitle} placeholder={t('聚會名稱,例如:週五飯局')} />
        <Label>{t('多久後結束')}</Label>
        <Row style={{ flexWrap: 'wrap' }}>
          {DURATIONS.map((h, i) => (
            <Chip
              key={h}
              label={t('{0} 小時', h)}
              selected={hours === h}
              onPress={() => setHours(h)}
              code={code('C', 2 + i)}
            />
          ))}
        </Row>
        <Button title={t('建立')} onPress={create} code="C06" />
      </Card>

      <Button
        title={t('掃描聚會碼加入')}
        kind="ghost"
        onPress={() => router.push('/scan' as never)}
        style={{ marginBottom: 16 }}
        code="C07"
      />

      {list.length === 0 && <Empty text={t('還沒有聚會')} />}
      {list.map((g) => {
        const ended = g.endsAt < Date.now();
        return (
          <Pressable key={g.id} onPress={() => router.push(`/gathering/${g.id}` as never)}>
            <Card code="C08">
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>{g.title}</Text>
                  <Text style={{ color: colors.muted, marginTop: 2 }}>
                    {g.role === 'creator' ? t('我建立的') : t('我加入的')} · {ended ? t('已結束') : t('{0} 結束', formatEnd(g.endsAt))}
                  </Text>
                </View>
              </Row>
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}
