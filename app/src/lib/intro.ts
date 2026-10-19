// 自我介紹:賓客自己填的表單,每個欄位都可以留空,只有本人勾選的欄位才會被分享。

export type IntroKey =
  | 'nickname'
  | 'tagline'
  | 'job'
  | 'org'
  | 'doing'
  | 'interests'
  | 'obsession'
  | 'wantToMeet'
  | 'zodiac'
  | 'blood'
  | 'food'
  | 'instagram'
  | 'line'
  | 'facebook'
  | 'threads'
  | 'x';

export type IntroValues = Record<IntroKey, string>;
export type IntroShared = Record<IntroKey, boolean>;

export type MyIntro = {
  values: IntroValues;
  shared: IntroShared;
  selfieUri: string | null;
};

export type IntroGroup = { title: string; keys: IntroKey[] };

export const INTRO_LABELS: Record<IntroKey, string> = {
  nickname: '暱稱',
  tagline: '一句話介紹',
  job: '職業',
  org: '公司或學校',
  doing: '正在做的事',
  interests: '興趣',
  obsession: '最近迷什麼',
  wantToMeet: '想認識什麼樣的人',
  zodiac: '星座',
  blood: '血型',
  food: '最愛的食物',
  instagram: 'Instagram',
  line: 'LINE',
  facebook: 'Facebook',
  threads: 'Threads',
  x: 'X',
};

export const INTRO_GROUPS: IntroGroup[] = [
  { title: '基本', keys: ['nickname', 'tagline'] },
  { title: '做什麼', keys: ['job', 'org', 'doing'] },
  { title: '話題', keys: ['interests', 'obsession', 'wantToMeet'] },
  { title: '輕鬆', keys: ['zodiac', 'blood', 'food'] },
  { title: '社交帳號(預設關閉)', keys: ['instagram', 'line', 'facebook', 'threads', 'x'] },
];

const SOCIAL_KEYS: IntroKey[] = ['instagram', 'line', 'facebook', 'threads', 'x'];
export const ALL_KEYS = Object.keys(INTRO_LABELS) as IntroKey[];

export function emptyIntro(): MyIntro {
  const values = {} as IntroValues;
  const shared = {} as IntroShared;
  for (const k of ALL_KEYS) {
    values[k] = '';
    // 社交帳號預設關閉,其他欄位預設可分享(內容仍可留空)
    shared[k] = !SOCIAL_KEYS.includes(k);
  }
  return { values, shared, selfieUri: null };
}

/** 被分享出去的自我介紹內容(已過濾)。 */
export type PublicIntro = {
  deviceCode: string;
  fields: Partial<Record<IntroKey, string>>;
};

const INTRO_PREFIX = 'pk1:';
const GATHERING_PREFIX = 'pkg1:';

export function toPublicIntro(intro: MyIntro, deviceCode: string): PublicIntro {
  const fields: Partial<Record<IntroKey, string>> = {};
  for (const k of ALL_KEYS) {
    const v = intro.values[k].trim();
    if (intro.shared[k] && v) fields[k] = v;
  }
  return { deviceCode, fields };
}

export function encodeIntro(p: PublicIntro): string {
  return INTRO_PREFIX + JSON.stringify({ d: p.deviceCode, f: p.fields });
}

export function encodeGathering(g: { id: string; title: string; endsAt: number; cloud?: boolean }): string {
  return GATHERING_PREFIX + JSON.stringify({ i: g.id, t: g.title, e: g.endsAt, ...(g.cloud ? { c: 1 } : {}) });
}

export type Scanned =
  | { kind: 'intro'; intro: PublicIntro }
  | { kind: 'gathering'; id: string; title: string; endsAt: number; cloud: boolean }
  | { kind: 'unknown' };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseScanned(data: string): Scanned {
  try {
    if (data.startsWith(INTRO_PREFIX)) {
      const raw: unknown = JSON.parse(data.slice(INTRO_PREFIX.length));
      if (!isRecord(raw) || typeof raw.d !== 'string' || !isRecord(raw.f)) return { kind: 'unknown' };
      const fields: Partial<Record<IntroKey, string>> = {};
      for (const k of ALL_KEYS) {
        const v = raw.f[k];
        if (typeof v === 'string' && v) fields[k] = v.slice(0, 200);
      }
      return { kind: 'intro', intro: { deviceCode: raw.d, fields } };
    }
    if (data.startsWith(GATHERING_PREFIX)) {
      const raw: unknown = JSON.parse(data.slice(GATHERING_PREFIX.length));
      if (
        !isRecord(raw) ||
        typeof raw.i !== 'string' ||
        typeof raw.t !== 'string' ||
        typeof raw.e !== 'number'
      )
        return { kind: 'unknown' };
      return { kind: 'gathering', id: raw.i, title: raw.t.slice(0, 80), endsAt: raw.e, cloud: raw.c === 1 };
    }
  } catch {
    // 不是合法的 JSON,視為不認得的 QR 碼
  }
  return { kind: 'unknown' };
}

/** 給列表用的一行摘要。 */
export function introSummary(p: PublicIntro): string {
  const f = p.fields;
  return f.tagline ?? [f.job, f.org].filter(Boolean).join(' · ') ?? '';
}
