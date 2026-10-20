import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { blankPerson, insertPerson, type PersonDraft } from '@/db';
import { DEFAULT_FACE, FaceAvatar, parseFace } from '@/components/Face';
import { PersonEditor } from '@/components/PersonEditor';
import { useSettings, useT } from '@/components/Settings';
import { HookBadges } from '@/components/HookBadges';
import { Tag } from '@/components/Tag';
import { Button, Screen } from '@/components/ui';
import { scoreLabel } from '@/lib/score';
import { colors } from '@/theme';

// 生活版(原本的快速記錄)。標記碼:A01 記下來按鈕、A02 預覽;編輯器內的互動元件是 P01–P43(見 docs/codes.md)。
export function LifeMode() {
  const t = useT();
  const db = useSQLiteContext();
  const { style } = useSettings();
  const [draft, setDraft] = useState<PersonDraft>(blankPerson);
  const [busy, setBusy] = useState(false);
  const face = parseFace(draft.face) ?? DEFAULT_FACE;

  const save = async () => {
    const isBlank = !draft.name && !draft.hook && draft.stars === 0 && !draft.face;
    if (isBlank) {
      Alert.alert(t('還沒記任何東西'), t('至少打個分、選個特徵,或點個記憶鉤子。'));
      return;
    }
    await insertPerson(db, draft);
    setDraft(blankPerson());
  };

  return (
    <Screen scrollEnabled={!busy}>
      <PersonEditor value={draft} onChange={setDraft} onActiveChange={setBusy} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 64, height: 64 }}>
            <FaceAvatar face={face} size={64} build={draft.build} height={draft.height} style={style} glasses={draft.hook.includes('眼鏡')} />
            <Tag code="A02" />
          </View>
          <HookBadges hook={draft.hook} size={18} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ color: colors.ink, fontSize: 15 }} numberOfLines={1}>
              {draft.name || t('(沒有名字)')}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>
              {[t(scoreLabel(draft.stars)), draft.hook.split('、').map((w) => t(w)).join('、'), draft.note].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </View>
        <Button title={t('記下來')} onPress={save} code="A01" style={{ marginLeft: 10 }} />
      </View>
    </Screen>
  );
}
