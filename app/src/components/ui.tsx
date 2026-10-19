import { type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/theme';
import { Tag } from './Tag';

export function Screen({
  children,
  scroll = true,
  scrollEnabled = true,
  safeTop = false,
}: {
  children: ReactNode;
  scroll?: boolean;
  scrollEnabled?: boolean; // 拖動滑桿或圓盤時鎖住頁面捲動
  safeTop?: boolean; // 沒有標題列時,內容避開狀態列
}) {
  const insets = useSafeAreaInsets();
  if (!scroll) return <View style={styles.screen}>{children}</View>;
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.screenContent, safeTop && { paddingTop: insets.top + 8 }]}
      keyboardShouldPersistTaps="handled"
      scrollEnabled={scrollEnabled}
    >
      {children}
    </ScrollView>
  );
}

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  style,
  code,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  code?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        kind === 'primary' && { backgroundColor: colors.primary },
        kind === 'ghost' && { backgroundColor: colors.primarySoft },
        kind === 'danger' && { backgroundColor: '#FDE8E8' },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          kind === 'primary' && { color: '#fff' },
          kind === 'ghost' && { color: colors.primary },
          kind === 'danger' && { color: colors.danger },
        ]}
      >
        {title}
      </Text>
      {code ? <Tag code={code} /> : null}
    </Pressable>
  );
}

export function Card({ children, style, code }: { children: ReactNode; style?: StyleProp<ViewStyle>; code?: string }) {
  return (
    <View style={[styles.card, style]}>
      {children}
      {code ? <Tag code={code} /> : null}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Field(props: TextInputProps & { label?: string; code?: string }) {
  const { label, style, code, ...rest } = props;
  return (
    <View style={{ marginBottom: 10 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, style]} {...rest} />
      {code ? <Tag code={code} /> : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  code,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  code?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={{ color: selected ? '#fff' : colors.ink, fontSize: 14 }}>{label}</Text>
      {code ? <Tag code={code} /> : null}
    </Pressable>
  );
}

/** 開關:右上角顯示標記碼。 */
export function Toggle({
  value,
  onValueChange,
  code,
  style,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  code?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: colors.primary, false: colors.line }} />
      {code ? <Tag code={code} /> : null}
    </View>
  );
}

/** 標記碼:前綴字母加兩位數字,例如 code('P', 5) -> "P05"。 */
export function code(prefix: string, n: number): string {
  return `${prefix}${String(n).padStart(2, '0')}`;
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}

export function Empty({ text }: { text: string }) {
  return <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40, lineHeight: 22 }}>{text}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { padding: 16, paddingBottom: 48 },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: { color: colors.muted, fontSize: 13, marginBottom: 4 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
});
