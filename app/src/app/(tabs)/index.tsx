import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModeSwitch } from '@/components/ModeSwitch';
import { useSettings } from '@/components/Settings';
import { DatingMode } from '@/components/modes/DatingMode';
import { HostMode } from '@/components/modes/HostMode';
import { LifeMode } from '@/components/modes/LifeMode';
import { colors } from '@/theme';

// 首頁:上面切換三種模式(M01 生活 / M02 約會 / M03 主辦),下面顯示該模式的畫面。
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useSettings();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 6 }}>
        <ModeSwitch value={mode} onChange={setMode} />
      </View>
      {mode === 'life' ? <LifeMode /> : mode === 'dating' ? <DatingMode /> : <HostMode />}
    </View>
  );
}
