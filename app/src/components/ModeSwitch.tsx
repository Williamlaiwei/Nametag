import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MODES, type ModeId } from '@/lib/modes';
import { colors } from '@/theme';
import { Tag } from './Tag';
import { code } from './ui';

// 標記碼:M01 生活 / M02 約會 / M03 主辦
export function ModeSwitch({ value, onChange }: { value: ModeId; onChange: (m: ModeId) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.primarySoft, borderRadius: 12, padding: 3 }}>
      {MODES.map((m, i) => {
        const on = m.id === value;
        return (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            onPress={() => {
              if (!on) Haptics.selectionAsync();
              onChange(m.id);
            }}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: on ? colors.primary : 'transparent',
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 15, color: on ? '#fff' : colors.primary }}>{m.name}</Text>
            <Tag code={code('M', i + 1)} />
          </Pressable>
        );
      })}
    </View>
  );
}
