import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSettings, useT } from '@/components/Settings';
import { Tag } from '@/components/Tag';
import { code } from '@/components/ui';
import { DatingMode } from '@/components/modes/DatingMode';
import { HostMode } from '@/components/modes/HostMode';
import { LifeMode } from '@/components/modes/LifeMode';
import { MODES } from '@/lib/modes';
import { colors, radius } from '@/theme';

const ICONS = { life: '☺', dating: '♥', host: '★' } as const;

// 首頁 = 選模式(M01 生活 / M02 約會 / M03 主辦)。選了之後整個畫面給該模式用,上面不再留切換列;
// 要換模式:再按一次底部的「首頁」分頁。
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useSettings();
  const t = useT();

  if (mode === 'life') return <ModeFrame><LifeMode /></ModeFrame>;
  if (mode === 'dating') return <ModeFrame><DatingMode /></ModeFrame>;
  if (mode === 'host') return <ModeFrame><HostMode /></ModeFrame>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 24, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: colors.ink }}>{t('要記錄什麼?')}</Text>
      <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 20 }}>{t('選一個模式。要換的話,再按一次底下的「首頁」。')}</Text>
      {MODES.map((m, i) => (
        <Pressable
          key={m.id}
          accessibilityRole="button"
          onPress={() => {
            Haptics.selectionAsync();
            setMode(m.id);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: radius,
            borderWidth: 1,
            borderColor: colors.line,
            padding: 18,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 30, color: colors.primary, width: 48 }}>{ICONS[m.id]}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>{t(m.name)}</Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{t(m.note)}</Text>
          </View>
          <Text style={{ fontSize: 22, color: colors.muted }}>›</Text>
          <Tag code={code('M', i + 1)} />
        </Pressable>
      ))}
    </View>
  );
}

function ModeFrame({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>{children}</View>;
}
