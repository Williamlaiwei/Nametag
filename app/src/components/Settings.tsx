import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getSetting, setSetting } from '@/db';
import { DEFAULT_STYLE, STYLES, type StyleId } from '@/lib/avatarStyles';
import { DEFAULT_MODE, isModeId, type ModeId } from '@/lib/modes';
import { type VersionId } from '@/lib/versions';

// 使用者設定:版本(工作 / 學生 / 無)與人物設計風格。存在手機本地的 settings 表。
// version 為 null 代表還沒選;選了之後,設定頁才會出現後面的選項。

type SettingsState = {
  loaded: boolean;
  version: VersionId | null;
  style: StyleId;
  mode: ModeId;
  setMode: (m: ModeId) => void;
  setVersion: (v: VersionId) => void;
  setStyle: (s: StyleId) => void;
};

const SettingsContext = createContext<SettingsState>({
  loaded: false,
  version: null,
  style: DEFAULT_STYLE,
  mode: DEFAULT_MODE,
  setMode: () => {},
  setVersion: () => {},
  setStyle: () => {},
});

const VERSION_IDS: VersionId[] = ['work', 'student', 'none'];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [loaded, setLoaded] = useState(false);
  const [version, setVersionState] = useState<VersionId | null>(null);
  const [style, setStyleState] = useState<StyleId>(DEFAULT_STYLE);
  const [mode, setModeState] = useState<ModeId>(DEFAULT_MODE);

  useEffect(() => {
    (async () => {
      const v = await getSetting(db, 'version');
      const s = await getSetting(db, 'avatar_style');
      if (v && (VERSION_IDS as string[]).includes(v)) setVersionState(v as VersionId);
      const m = await getSetting(db, 'home_mode');
      if (isModeId(m)) setModeState(m);
      if (s && STYLES.some((x) => x.id === s)) setStyleState(s as StyleId);
      setLoaded(true);
    })();
  }, [db]);

  const setVersion = useCallback(
    (v: VersionId) => {
      setVersionState(v);
      setSetting(db, 'version', v);
    },
    [db],
  );
  const setMode = useCallback(
    (m: ModeId) => {
      setModeState(m);
      setSetting(db, 'home_mode', m);
    },
    [db],
  );
  const setStyle = useCallback(
    (s: StyleId) => {
      setStyleState(s);
      setSetting(db, 'avatar_style', s);
    },
    [db],
  );

  const value = useMemo(
    () => ({ loaded, version, style, mode, setMode, setVersion, setStyle }),
    [loaded, version, style, mode, setMode, setVersion, setStyle],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
