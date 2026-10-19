import { Pressable, Text, View } from 'react-native';
import { STYLES } from '@/lib/avatarStyles';
import { VERSIONS, type VersionId } from '@/lib/versions';
import { useSettings } from '@/components/Settings';
import { Tag } from '@/components/Tag';
import { Card, Label, Screen } from '@/components/ui';
import { colors } from '@/theme';

const VERSION_ORDER: VersionId[] = ['work', 'student', 'none'];
const VERSION_NOTE: Record<VersionId, string> = {
  work: '同事、客戶、主管、行業',
  student: '同學、學長姐、老師、社團',
  none: '不區分,用通用的選項',
};

function Choice({
  title,
  note,
  selected,
  onPress,
  tag,
}: {
  title: string;
  note: string;
  selected: boolean;
  onPress: () => void;
  tag: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? colors.primary : colors.line,
        backgroundColor: selected ? colors.primarySoft : '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>{title}</Text>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{note}</Text>
      <Tag code={tag} />
    </Pressable>
  );
}

// 標記碼:S01–S03 版本(工作 / 學生 / 無)、S04–S06 人物設計風格(韓國 / 日本 / 美式)
export default function SettingsScreen() {
  const { version, style, setVersion, setStyle } = useSettings();

  return (
    <Screen>
      <Card>
        <Label>1. 你主要用在哪裡?(請先選一個,選完後面的設定才會出現)</Label>
        {VERSION_ORDER.map((id, i) => (
          <Choice
            key={id}
            title={VERSIONS[id].name}
            note={VERSION_NOTE[id]}
            selected={version === id}
            onPress={() => setVersion(id)}
            tag={`S0${1 + i}`}
          />
        ))}
      </Card>

      {version === null ? (
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 8 }}>先選上面的使用情境,才會顯示其他設定。</Text>
      ) : (
        <>
          <Card>
            <Label>2. 人物的設計風格</Label>
            {STYLES.map((s, i) => (
              <Choice
                key={s.id}
                title={s.name}
                note={s.note}
                selected={style === s.id}
                onPress={() => setStyle(s.id)}
                tag={`S0${4 + i}`}
              />
            ))}
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              三種風格 × 6 個年紀階段的設計還沒有,目前都顯示同一個預設小人。選擇會先記住,拿到設計後就會生效。
            </Text>
          </Card>
          <View style={{ height: 8 }} />
        </>
      )}
    </Screen>
  );
}
