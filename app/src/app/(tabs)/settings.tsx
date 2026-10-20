import { Pressable, Text, View } from 'react-native';
import { MULTI_STYLE_ENABLED, STYLES } from '@/lib/avatarStyles';
import { VERSIONS, type VersionId } from '@/lib/versions';
import { LANGS } from '@/lib/i18n';
import { useSettings, useT } from '@/components/Settings';
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

// 標記碼:S01–S03 版本(工作 / 學生 / 無)、S04–S06 人物設計風格、S07–S08 語言(中文 / English)
export default function SettingsScreen() {
  const { version, style, lang, setLang, setVersion, setStyle } = useSettings();
  const t = useT();

  return (
    <Screen>
      <Card>
        <Label>{t('0. 語言 / Language')}</Label>
        {LANGS.map((l, i) => (
          <Choice key={l.id} title={l.name} note="" selected={lang === l.id} onPress={() => setLang(l.id)} tag={`S${String(7 + i).padStart(2, '0')}`} />
        ))}
      </Card>

      <Card>
        <Label>{t('1. 你主要用在哪裡?(請先選一個,選完後面的設定才會出現)')}</Label>
        {VERSION_ORDER.map((id, i) => (
          <Choice
            key={id}
            title={t(VERSIONS[id].name)}
            note={t(VERSION_NOTE[id])}
            selected={version === id}
            onPress={() => setVersion(id)}
            tag={`S0${1 + i}`}
          />
        ))}
      </Card>

      {MULTI_STYLE_ENABLED && (<>
      <Card>
        <Label>{t('2. 人物的設計風格')}</Label>
        {STYLES.map((s, i) => (
          <Choice
            key={s.id}
            title={t(s.name)}
            note={t(s.note)}
            selected={style === s.id}
            onPress={() => setStyle(s.id)}
            tag={`S0${4 + i}`}
          />
        ))}
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          {t('目前有設計:美式 20–30 歲男女、韓漫 20–30 歲男生;其他組合顯示預設小人。')}
        </Text>
      </Card>
      <View style={{ height: 8 }} />
      </>)}
      {version === null ? (
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 8 }}>{t('先選上面的使用情境,才會顯示其他設定。')}</Text>
      ) : null}
    </Screen>
  );
}
