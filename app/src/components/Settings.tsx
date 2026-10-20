import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getSetting, setSetting } from '@/db';
import { DEFAULT_STYLE, STYLES, type StyleId } from '@/lib/avatarStyles';
import { LANGS, translate, type Lang } from '@/lib/i18n';
import { type ModeId } from '@/lib/modes';
import { type VersionId } from '@/lib/versions';

// 使用者設定:版本(工作 / 學生 / 無)與人物設計風格。存在手機本地的 settings 表。
// version 為 null 代表還沒選;選了之後,設定頁才會出現後面的選項。

type SettingsState = {
  loaded: boolean;
  version: VersionId | null;
  style: StyleId;
  lang: Lang;
  setLang: (l: Lang) => void;
  mode: ModeId | null; // 首頁選的模式;null = 還在選(不存,每次開 app 都從首頁開始)
  setMode: (m: ModeId | null) => void;
  setVersion: (v: VersionId) => void;
  setStyle: (s: StyleId) => void;
};

const SettingsContext = createContext<SettingsState>({
  loaded: false,
  version: null,
  style: DEFAULT_STYLE,
  lang: 'zh',
  setLang: () => {},
  mode: null,
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
  const [mode, setMode] = useState<ModeId | null>(null);
  const [lang, setLangState] = useState<Lang>('zh');

  useEffect(() => {
    (async () => {
      const v = await getSetting(db, 'version');
      const s = await getSetting(db, 'avatar_style');
      const l = await getSetting(db, 'lang');
      if (l && LANGS.some((x) => x.id === l)) setLangState(l as Lang);
      if (v && (VERSION_IDS as string[]).includes(v)) setVersionState(v as VersionId);
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
  const setStyle = useCallback(
    (s: StyleId) => {
      setStyleState(s);
      setSetting(db, 'avatar_style', s);
    },
    [db],
  );

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      setSetting(db, 'lang', l);
    },
    [db],
  );

  const value = useMemo(
    () => ({ loaded, version, style, lang, setLang, mode, setMode, setVersion, setStyle }),
    [loaded, version, style, lang, setLang, mode, setMode, setVersion, setStyle],
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}

/** 翻譯函式:t('中文') 在英文模式回傳英文;有變數時 t('共 {0} 人', n)。 */
export function useT() {
  const { lang } = useSettings();
  return useCallback((zh: string, ...args: (string | number)[]) => translate(lang, zh, ...args), [lang]);
}
