import { useRef } from 'react';
import { Text, View, type GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { clampScore, MAX_SCORE, scoreColor } from '@/lib/score';
import { colors } from '@/theme';
import { Tag } from './Tag';

/**
 * 以半顆星為單位的重要度(0 到 10)。
 * 點一下或在星星上左右拖就能打分;往左拖到最左邊清除;再點一次同樣的分數也會清除。
 */
export function Stars({
  value,
  onChange,
  size = 34,
  code,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  code?: string;
}) {
  const width = size * 5;
  const startValue = useRef(0);
  const moved = useRef(false);
  const last = useRef(value);
  last.current = value;
  const color = scoreColor(value);

  const scoreAt = (e: GestureResponderEvent) => clampScore((e.nativeEvent.locationX / width) * MAX_SCORE + 0.4);

  const apply = (next: number) => {
    if (next === last.current) return;
    last.current = next;
    Haptics.selectionAsync();
    onChange?.(next);
  };

  const responder = onChange
    ? {
        onStartShouldSetResponder: () => true,
        // 一旦開始,不讓外層(列表捲動、整列點擊)搶走
        onResponderTerminationRequest: () => false,
        onResponderGrant: (e: GestureResponderEvent) => {
          startValue.current = last.current;
          moved.current = false;
          apply(scoreAt(e));
        },
        onResponderMove: (e: GestureResponderEvent) => {
          moved.current = true;
          apply(scoreAt(e));
        },
        onResponderRelease: () => {
          // 沒有拖動、而且點的是原本的分數 -> 清除
          if (!moved.current && last.current === startValue.current) apply(0);
        },
      }
    : {};

  return (
    <View style={{ flexDirection: 'row', width, height: size * 1.15 }} {...responder}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.min(1, Math.max(0, (value - i * 2) / 2)); // 0、0.5、1
        return (
          <View key={i} style={{ width: size, height: size * 1.15 }} pointerEvents="none">
            <Text style={{ position: 'absolute', width: size, textAlign: 'center', fontSize: size, color: colors.line }}>
              ★
            </Text>
            {fill > 0 && (
              <View style={{ position: 'absolute', width: size * fill, height: size * 1.15, overflow: 'hidden' }}>
                <Text style={{ width: size, textAlign: 'center', fontSize: size, color }}>★</Text>
              </View>
            )}
          </View>
        );
      })}
      {code && onChange ? <Tag code={code} /> : null}
    </View>
  );
}
