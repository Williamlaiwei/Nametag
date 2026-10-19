import { useRef, useState } from 'react';
import { View, type GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';
import { Tag } from './Tag';

const THUMB = 22;

/**
 * 吸附格點的滑桿:按住後左右移動,每跨過一格就選到那一格。
 * 帶 colors 時軌道是分段色塊(光譜);沒帶就是單色填充。
 * 所有子元件都 pointerEvents="none",觸控一律由最外層接手,位置才不會跳。
 */
export function SpectrumSlider({
  steps,
  value,
  onChange,
  colors: track,
  code,
  height = 30,
  onActive,
  onVertical,
}: {
  steps: number;
  value: number;
  onChange: (index: number) => void;
  colors?: string[];
  code?: string;
  height?: number;
  onActive?: (active: boolean) => void; // 按下 / 放開,外層用來鎖捲動與顯示人物
  onVertical?: (dir: 0 | 1) => void; // 按住後往上拖 = 1、往下拖 = 0(用來選亮度)
}) {
  const [width, setWidth] = useState(0);
  const startY = useRef(0);
  const lastDir = useRef<0 | 1 | null>(null);
  const last = useRef(value);
  last.current = value;
  const max = Math.max(1, steps - 1);

  const pick = (e: GestureResponderEvent) => {
    if (width <= THUMB) return;
    const ratio = Math.min(1, Math.max(0, (e.nativeEvent.locationX - THUMB / 2) / (width - THUMB)));
    const next = Math.round(ratio * max);
    if (next !== last.current) {
      last.current = next;
      Haptics.selectionAsync();
      onChange(next);
    }
  };

  const vertical = (e: GestureResponderEvent) => {
    if (!onVertical) return;
    const dy = e.nativeEvent.pageY - startY.current;
    const dir = dy < -14 ? 1 : dy > 14 ? 0 : null;
    if (dir !== null && dir !== lastDir.current) {
      lastDir.current = dir;
      Haptics.selectionAsync();
      onVertical(dir);
    }
  };

  const left = width > THUMB ? (Math.min(value, max) / max) * (width - THUMB) : 0;

  return (
    <View
      style={{ height, justifyContent: 'center' }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        startY.current = e.nativeEvent.pageY;
        lastDir.current = null;
        onActive?.(true);
        pick(e);
      }}
      onResponderMove={(e) => {
        pick(e);
        vertical(e);
      }}
      onResponderRelease={() => onActive?.(false)}
      onResponderTerminate={() => onActive?.(false)}
    >
      <View pointerEvents="none" style={{ height }}>
        <View
          style={{
            position: 'absolute',
            left: THUMB / 2,
            right: THUMB / 2,
            top: (height - 12) / 2,
            height: 12,
            borderRadius: 6,
            overflow: 'hidden',
            flexDirection: 'row',
            backgroundColor: colors.line,
          }}
        >
          {track
            ? track.map((c, i) => <View key={i} style={{ flex: 1, backgroundColor: c }} />)
            : null}
          {!track ? (
            <View style={{ width: `${(Math.min(value, max) / max) * 100}%`, backgroundColor: colors.primary }} />
          ) : null}
        </View>
        <View
          style={{
            position: 'absolute',
            left,
            top: (height - THUMB) / 2,
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: '#fff',
            borderWidth: 3,
            borderColor: colors.primary,
          }}
        />
      </View>
      {code ? <Tag code={code} /> : null}
    </View>
  );
}
