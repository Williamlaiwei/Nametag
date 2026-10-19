import { Text, View } from 'react-native';
import { HOOK_ICONS } from '@/lib/versions';

/** 已選標籤的小圖標,排在人物旁邊(眼鏡直接畫在人物上,不在這裡)。 */
export function HookBadges({ hook, size }: { hook: string; size: number }) {
  const icons = hook
    .split(/[,,、]/)
    .map((s) => s.trim())
    .filter((w) => w && w !== '眼鏡' && HOOK_ICONS[w])
    .map((w) => HOOK_ICONS[w]);
  if (icons.length === 0) return null;
  return (
    <View style={{ marginLeft: 6, maxHeight: size * 6, flexWrap: 'wrap' }}>
      {icons.map((ic, i) => (
        <Text key={i} style={{ fontSize: size, marginBottom: 2 }}>{ic}</Text>
      ))}
    </View>
  );
}
