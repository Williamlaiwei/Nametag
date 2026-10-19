import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { getSetting, setSetting } from '@/db';

// 標記碼:畫面上每個功能區塊角落的 3 碼小標籤(例如 P12),方便用代碼溝通要改哪裡。
// 對照表見 docs/codes.md。新增畫面或區塊時,請一併加上標籤並更新對照表。

type TagsState = { show: boolean; setShow: (v: boolean) => void };
const TagsContext = createContext<TagsState>({ show: false, setShow: () => {} });

export function TagsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [show, setShowState] = useState(true); // 開發階段預設開啟

  useEffect(() => {
    getSetting(db, 'show_tags').then((v) => {
      if (v !== null) setShowState(v === '1');
    });
  }, [db]);

  const setShow = useCallback(
    (v: boolean) => {
      setShowState(v);
      setSetting(db, 'show_tags', v ? '1' : '0');
    },
    [db],
  );

  const value = useMemo(() => ({ show, setShow }), [show, setShow]);
  return <TagsContext.Provider value={value}>{children}</TagsContext.Provider>;
}

export function useTags() {
  return useContext(TagsContext);
}

/**
 * 浮動開關:每個畫面右上角都有,點一下顯示或隱藏所有標記碼。
 * 關閉時變成半透明的小圓點,不會擋到畫面。
 */
export function TagsToggle() {
  const { show, setShow } = useTags();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={() => setShow(!show)}
      accessibilityRole="switch"
      accessibilityLabel="顯示或隱藏標記碼"
      hitSlop={8}
      style={{
        position: 'absolute',
        top: insets.top + 4,
        right: 8,
        zIndex: 1000,
        elevation: 1000,
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: show ? '#7C3AED' : '#11111155',
        borderWidth: 2,
        borderColor: '#ffffffcc',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{show ? '碼' : '○'}</Text>
    </Pressable>
  );
}

/** 放在容器裡面當子元件即可:用絕對定位貼在容器右上角,不影響版面。 */
export function Tag({ code }: { code: string }) {
  const { show } = useTags();
  if (!show) return null;
  return (
    <View pointerEvents="none" style={styles.tag}>
      <Text style={styles.text}>{code}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    position: 'absolute',
    top: -7,
    right: 6,
    zIndex: 50,
    elevation: 50,
    backgroundColor: '#111111dd',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  text: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
});
