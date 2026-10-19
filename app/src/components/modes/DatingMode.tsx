import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { blankPerson, type PersonDraft } from '@/db';
import { DEFAULT_FACE, FaceAvatar, parseFace } from '@/components/Face';
import { PersonEditor } from '@/components/PersonEditor';
import { useSettings } from '@/components/Settings';
import { SpectrumSlider } from '@/components/SpectrumSlider';
import { HookBadges } from '@/components/HookBadges';
import { Tag } from '@/components/Tag';
import { Button, Card, Field, Label, Screen } from '@/components/ui';
import { LIKING_MAX, LIKING_MIN, likingColor, likingLabel, stampNote } from '@/lib/modes';
import { colors } from '@/theme';

// 約會版:版面從生活版複製過來。差別:好感度 -5 到 +99(取代星星)、多出個人資訊欄位、備註帶時間戳。
// 標記碼:Y01 記下來 / Y02 預覽 / Y03 好感度滑桿 / Y04–Y09 個人資訊 / Y10 約會備註輸入 / Y11 加入備註
// 目前只做畫面:新資料先不存(等「儲存新資料」的規則解除再接)。
const INFO_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: 'source', label: '認識管道', placeholder: '例如:Tinder、朋友介紹' },
  { key: 'job', label: '職業', placeholder: '' },
  { key: 'income', label: '收入', placeholder: '大約範圍就好' },
  { key: 'parents', label: '父母職業', placeholder: '' },
  { key: 'house', label: '房', placeholder: '自有 / 租 / 與家人住' },
  { key: 'car', label: '車', placeholder: '' },
];

export function DatingMode() {
  const { style } = useSettings();
  const [draft, setDraft] = useState<PersonDraft>(blankPerson);
  const [liking, setLiking] = useState(0);
  const [info, setInfo] = useState<Record<string, string>>({});
  const [log, setLog] = useState<string[]>([]);
  const [entry, setEntry] = useState('');
  const [busy, setBusy] = useState(false);
  const face = parseFace(draft.face) ?? DEFAULT_FACE;

  const addEntry = () => {
    const t = entry.trim();
    if (!t) return;
    setLog([stampNote(t), ...log]);
    setEntry('');
  };

  const save = () => {
    Alert.alert('還沒接上儲存', '約會版目前只有畫面,資料還不會存下來。');
  };

  return (
    <Screen scrollEnabled={!busy}>
      <PersonEditor
        value={draft}
        onChange={setDraft}
        onActiveChange={setBusy}
        scoreSlot={
          <View style={{ marginLeft: 8, marginBottom: 10, alignItems: 'center', minWidth: 56 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: likingColor(liking) }}>{liking}</Text>
            <Text style={{ fontSize: 10, color: likingColor(liking) }}>{likingLabel(liking)}</Text>
          </View>
        }
      />

      <Card style={{ marginTop: 4 }}>
        <Label>好感度 {LIKING_MIN} ~ +{LIKING_MAX}</Label>
        <SpectrumSlider
          steps={LIKING_MAX - LIKING_MIN + 1}
          value={liking - LIKING_MIN}
          onChange={(i) => setLiking(i + LIKING_MIN)}
          onActive={setBusy}
          code="Y03"
        />
      </Card>

      <Card style={{ marginTop: 8 }}>
        <Label>個人資訊</Label>
        {INFO_FIELDS.map((f, i) => (
          <Field
            key={f.key}
            code={`Y0${4 + i}`}
            placeholder={`${f.label}${f.placeholder ? `(${f.placeholder})` : ''}`}
            value={info[f.key] ?? ''}
            onChangeText={(t) => setInfo({ ...info, [f.key]: t })}
            style={{ paddingVertical: 7, fontSize: 14, marginBottom: 0 }}
          />
        ))}
      </Card>

      <Card style={{ marginTop: 8 }}>
        <Label>約會備註(自動加時間)</Label>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Field code="Y10" placeholder="今天聊了什麼、感覺如何" value={entry} onChangeText={setEntry} onSubmitEditing={addEntry} style={{ paddingVertical: 7, fontSize: 14 }} />
          </View>
          <Button title="加入" onPress={addEntry} kind="ghost" code="Y11" style={{ marginLeft: 8, marginBottom: 10 }} />
        </View>
        {log.map((l, i) => (
          <Text key={i} style={{ color: colors.ink, fontSize: 13, marginTop: 4 }}>
            {l}
          </Text>
        ))}
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 64, height: 64 }}>
            <FaceAvatar face={face} size={64} build={draft.build} height={draft.height} style={style} glasses={draft.hook.includes('眼鏡')} />
            <Tag code="Y02" />
          </View>
          <HookBadges hook={draft.hook} size={18} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={{ color: colors.ink, fontSize: 15 }} numberOfLines={1}>
              {draft.name || '(沒有名字)'}
            </Text>
            <Text style={{ color: likingColor(liking), fontSize: 12 }} numberOfLines={1}>
              好感 {liking} · {likingLabel(liking)}
            </Text>
          </View>
        </View>
        <Button title="記下來" onPress={save} code="Y01" style={{ marginLeft: 10 }} />
      </View>
    </Screen>
  );
}
