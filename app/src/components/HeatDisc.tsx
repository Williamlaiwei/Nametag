import { useRef } from 'react';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';
import { Tag } from './Tag';

const CELLS = 10;

/**
 * 圓盤:按住後在圓內任意移動選點。x、y 都是 0–1(y 往上變大),離散成 10 格。
 * 位置用 pageX/pageY 加 measureInWindow 換算,子元件 pointerEvents="none",
 * 開始與結束時回報 onActive,讓外層鎖住頁面捲動。
 */
export function HeatDisc({
  size,
  x,
  y,
  onChange,
  onActive,
  xLabel,
  yLabel,
  code,
}: {
  size: number;
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
  onActive?: (active: boolean) => void;
  xLabel: string;
  yLabel: string;
  code?: string;
}) {
  const box = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });
  const last = useRef({ x, y });
  last.current = { x, y };

  const pick = (pageX: number, pageY: number) => {
    const r = size / 2;
    let dx = pageX - origin.current.x - r;
    let dy = pageY - origin.current.y - r;
    const d = Math.hypot(dx, dy);
    if (d > r) {
      dx = (dx / d) * r;
      dy = (dy / d) * r;
    }
    const nx = Math.round(((dx + r) / size) * CELLS) / CELLS;
    const ny = Math.round((1 - (dy + r) / size) * CELLS) / CELLS;
    if (nx !== last.current.x || ny !== last.current.y) {
      last.current = { x: nx, y: ny };
      Haptics.selectionAsync();
      onChange(nx, ny);
    }
  };

  const left = Math.min(1, Math.max(0, x)) * size;
  const top = (1 - Math.min(1, Math.max(0, y))) * size;

  return (
    <View style={{ alignItems: 'center' }}>
      <View
        ref={box}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
          borderWidth: 1,
          borderColor: colors.line,
        }}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          const { pageX, pageY } = e.nativeEvent;
          onActive?.(true);
          box.current?.measureInWindow((wx, wy) => {
            origin.current = { x: wx, y: wy };
            pick(pageX, pageY);
          });
        }}
        onResponderMove={(e) => pick(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onResponderRelease={() => onActive?.(false)}
      onResponderTerminate={() => onActive?.(false)}
      >
        <View pointerEvents="none" style={{ flex: 1 }}>
          <View style={{ position: 'absolute', left: size / 2 - 0.5, top: 8, bottom: 8, width: 1, backgroundColor: colors.line }} />
          <View style={{ position: 'absolute', top: size / 2 - 0.5, left: 8, right: 8, height: 1, backgroundColor: colors.line }} />
          <View
            style={{
              position: 'absolute',
              left: left - 11,
              top: top - 11,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: colors.primary,
              borderWidth: 3,
              borderColor: '#fff',
            }}
          />
        </View>
        {code ? <Tag code={code} /> : null}
      </View>
      <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
        ↔ {xLabel}　↕ {yLabel}
      </Text>
    </View>
  );
}
