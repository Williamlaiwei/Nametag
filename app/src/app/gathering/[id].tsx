import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import QRCode from 'react-native-qrcode-svg';
import {
  deleteGathering,
  getDeviceCode,
  getGathering,
  getMyIntro,
  listRoster,
  removeFromRoster,
  saveExchangedIntro,
  type Gathering,
} from '@/db';
import {
  isCloudConfigured,
  leaveGathering,
  removeMember,
  submitIntro,
  watchMembers,
  type CloudMember,
} from '@/cloud';
import {
  encodeGathering,
  encodeIntro,
  INTRO_LABELS,
  toPublicIntro,
  type IntroKey,
  type PublicIntro,
} from '@/lib/intro';
import { Tag } from '@/components/Tag';
import { Button, Card, Empty, Label, Row, Screen } from '@/components/ui';
import { colors } from '@/theme';

// 名單上的一列,不論來自雲端或主辦人手機。
type Entry = { key: string; intro: PublicIntro; mine: boolean; remove: () => Promise<void> };
type SubmitState = 'idle' | 'sending' | 'sent' | 'failed' | 'left';

export default function GatheringScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [g, setG] = useState<Gathering | null>(null);
  const [localRoster, setLocalRoster] = useState<Entry[]>([]);
  const [cloudRoster, setCloudRoster] = useState<CloudMember[]>([]);
  const [cloudError, setCloudError] = useState('');
  const [submit, setSubmit] = useState<SubmitState>('idle');
  const [myQr, setMyQr] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const useCloud = Boolean(g?.cloud) && isCloudConfigured();

  const load = useCallback(async () => {
    const gathering = await getGathering(db, id);
    setG(gathering);
    if (!gathering) return;
    if (gathering.role === 'creator') {
      const rows = await listRoster(db, id);
      setLocalRoster(
        rows.map((r) => ({
          key: `l${r.id}`,
          intro: r.intro,
          mine: false,
          remove: async () => {
            await removeFromRoster(db, r.id);
            await load();
          },
        })),
      );
    } else {
      const code = await getDeviceCode(db);
      setMyQr(encodeIntro(toPublicIntro(await getMyIntro(db), code)));
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // 雲端名單:即時更新
  useEffect(() => {
    if (!useCloud) return;
    return watchMembers(
      id,
      (m) => {
        setCloudError('');
        setCloudRoster(m);
      },
      () => setCloudError('連不上雲端,顯示的可能不是最新名單。'),
    );
  }, [useCloud, id]);

  const sendIntro = useCallback(async () => {
    if (!g) return;
    setSubmit('sending');
    try {
      const code = await getDeviceCode(db);
      await submitIntro(g.id, g.endsAt, toPublicIntro(await getMyIntro(db), code));
      setSubmit('sent');
    } catch {
      setSubmit('failed');
    }
  }, [db, g]);

  // 賓客加入雲端聚會後自動送出一次自我介紹。沒網路時顯示失敗,可以手動重送。
  useEffect(() => {
    if (g && g.role === 'guest' && useCloud && g.endsAt > Date.now() && submit === 'idle') sendIntro();
  }, [g, useCloud, submit, sendIntro]);

  if (!g) return <Screen>{<Empty text="找不到這場聚會(可能已過期並被刪除)" />}</Screen>;

  const ended = g.endsAt < Date.now();
  const isCreator = g.role === 'creator';

  const cloudEntries: Entry[] = cloudRoster.map((m) => ({
    key: `c${m.uid}`,
    intro: m.intro,
    mine: m.mine,
    remove: async () => {
      try {
        await (m.mine ? leaveGathering(g.id) : removeMember(g.id, m.uid));
        if (m.mine) setSubmit('left');
      } catch {
        Alert.alert('刪除失敗', '請確認網路後再試一次。');
      }
    },
  }));
  const roster = [...cloudEntries, ...localRoster];

  const removeGathering = () =>
    Alert.alert('刪除這場聚會?', '你手機上的名單會一併刪除。已經存進「認識的人」的資料不受影響。', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          await deleteGathering(db, g.id);
          router.back();
        },
      },
    ]);

  const rosterList = (
    <>
      <Label>聚會名單({roster.length} 人)</Label>
      {cloudError ? <Text style={{ color: colors.danger, marginBottom: 8 }}>{cloudError}</Text> : null}
      {roster.length === 0 && (
        <Empty text={useCloud ? '還沒有人加入。請賓客掃上面的聚會碼。' : '還沒有人。請賓客出示「我」分頁的 QR 碼,你來掃。'} />
      )}
      {roster.map((r) => {
        const f = r.intro.fields;
        const expanded = open === r.key;
        const canRemove = isCreator || r.mine;
        return (
          <Card key={r.key}>
            <Pressable onPress={() => setOpen(expanded ? null : r.key)}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.ink }}>
                {f.nickname ?? '(未填暱稱)'}
                {r.mine ? '(我)' : ''}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 2 }}>{f.tagline ?? ''}</Text>
              <Tag code="G02" />
            </Pressable>
            {expanded && (
              <View style={{ marginTop: 10 }}>
                {(Object.keys(f) as IntroKey[])
                  .filter((k) => k !== 'nickname' && k !== 'tagline')
                  .map((k) => (
                    <Text key={k} style={{ color: colors.ink, marginTop: 3 }}>
                      <Text style={{ color: colors.muted }}>{INTRO_LABELS[k]}:</Text>
                      {f[k]}
                    </Text>
                  ))}
                <Row style={{ marginTop: 12 }}>
                  {!r.mine && (
                    <Button
                      title="記成認識的人"
                      kind="ghost"
                      onPress={async () => {
                        const pid = await saveExchangedIntro(db, r.intro);
                        router.push(`/person/${pid}` as never);
                      }}
                      style={{ flex: 1, marginRight: canRemove ? 8 : 0 }}
                      code="G03"
                    />
                  )}
                  {canRemove && (
                    <Button title={r.mine ? '退出名單' : '移除'} kind="danger" onPress={r.remove} code="G04" />
                  )}
                </Row>
              </View>
            )}
          </Card>
        );
      })}
    </>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: g.title }} />
      {ended && <Text style={{ color: colors.danger, marginBottom: 12 }}>這場聚會已結束,名單即將自動刪除。</Text>}

      {isCreator ? (
        <>
          <Card>
            <Label>聚會碼:給賓客掃描{useCloud ? '(雲端名單)' : '(離線名單)'}</Label>
            <View style={{ alignItems: 'center', padding: 12 }}>
              <QRCode value={encodeGathering({ ...g, cloud: useCloud })} size={200} />
            </View>
          </Card>
          {!useCloud && (
            <Button
              title="掃描賓客,加進名單"
              onPress={() => router.push({ pathname: '/scan', params: { gatheringId: g.id } } as never)}
              style={{ marginBottom: 16 }}
              code="G01"
            />
          )}
        </>
      ) : useCloud ? (
        <Card>
          <Text style={{ color: colors.ink, marginBottom: 8 }}>
            {submit === 'sending' && '正在送出你的自我介紹…'}
            {submit === 'sent' && '你的自我介紹已加入名單。只有你開啟分享的欄位會被看到。'}
            {submit === 'failed' && '送出失敗,可能是沒有網路。'}
            {submit === 'left' && '你已退出名單,雲端上的介紹已刪除。'}
          </Text>
          {(submit === 'failed' || submit === 'sent' || submit === 'left') && (
            <Button
              title={submit === 'sent' ? '更新我的介紹' : submit === 'left' ? '重新加入' : '重新送出'}
              kind="ghost"
              onPress={sendIntro}
              disabled={ended}
              code="G05"
            />
          )}
        </Card>
      ) : (
        <Card>
          <Label>請出示給主辦人掃描,加入這場聚會的名單</Label>
          <View style={{ alignItems: 'center', padding: 12 }}>
            {myQr ? <QRCode value={myQr} size={200} ecl="L" /> : null}
          </View>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            這場聚會是離線模式,名單由主辦人保管。內容是你在「我」分頁填的自我介紹,只包含你開啟分享的欄位。
          </Text>
        </Card>
      )}

      {(isCreator || useCloud) && rosterList}

      <Button title="刪除這場聚會" kind="danger" onPress={removeGathering} style={{ marginTop: 16 }} code="G06" />
    </Screen>
  );
}
