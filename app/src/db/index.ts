import { type SQLiteDatabase } from 'expo-sqlite';
import { TAG_CATALOG } from '@/lib/tagCatalog';
import { emptyIntro, type MyIntro, type PublicIntro } from '@/lib/intro';

const DATABASE_VERSION = 4;

/** 雲端與本機名單的保存天數(從聚會結束時間起算)。 */
export const RETENTION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;

  if (current === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS people (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        hook TEXT NOT NULL DEFAULT '',
        height REAL NOT NULL DEFAULT 0.5,
        build REAL NOT NULL DEFAULT 0.5,
        stars INTEGER NOT NULL DEFAULT 0,
        familiarity REAL NOT NULL DEFAULT 0,
        face TEXT NOT NULL DEFAULT '',
        intro_json TEXT NOT NULL DEFAULT '',
        device_code TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS gatherings (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        ends_at INTEGER NOT NULL,
        role TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS roster (
        id INTEGER PRIMARY KEY NOT NULL,
        gathering_id TEXT NOT NULL,
        device_code TEXT NOT NULL,
        intro_json TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        UNIQUE (gathering_id, device_code)
      );
    `);
  }
  if (current < 2) {
    // v2:重要度改成半顆星為單位(0 到 10),舊資料的整顆星乘以 2
    await db.execAsync('UPDATE people SET stars = stars * 2');
  }
  if (current < 3) {
    // v3:聚會可以改用雲端暫存名單
    await db.execAsync('ALTER TABLE gatherings ADD COLUMN cloud INTEGER NOT NULL DEFAULT 0');
  }
  if (current < 4) {
    // v4:交友軟體常見欄位的清單,先存起來(enabled = 0),還沒放到畫面上
    await db.execAsync('CREATE TABLE IF NOT EXISTS tag_catalog (category TEXT NOT NULL, name TEXT NOT NULL, icon TEXT NOT NULL DEFAULT \x27\x27, enabled INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (category, name))');
    for (const [category, names] of Object.entries(TAG_CATALOG)) {
      for (const name of names) {
        await db.runAsync('INSERT OR IGNORE INTO tag_catalog (category, name) VALUES (?, ?)', category, name);
      }
    }
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

// ---------- 設定 ----------

export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const r = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key);
  return r?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}

function randomCode(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function newId(): string {
  return randomCode();
}

/** 手機上的隨機代號:不綁帳號,只用來辨識「同一個人重複填寫」。 */
export async function getDeviceCode(db: SQLiteDatabase): Promise<string> {
  const existing = await getSetting(db, 'device_code');
  if (existing) return existing;
  const code = randomCode();
  await setSetting(db, 'device_code', code);
  return code;
}

export async function getMyIntro(db: SQLiteDatabase): Promise<MyIntro> {
  const raw = await getSetting(db, 'my_intro');
  const base = emptyIntro();
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as Partial<MyIntro>;
    return {
      values: { ...base.values, ...parsed.values },
      shared: { ...base.shared, ...parsed.shared },
      selfieUri: parsed.selfieUri ?? null,
    };
  } catch {
    return base;
  }
}

export async function saveMyIntro(db: SQLiteDatabase, intro: MyIntro) {
  await setSetting(db, 'my_intro', JSON.stringify(intro));
}

// ---------- 認識的人 ----------

export type Person = {
  id: number;
  name: string;
  note: string; // 小記:目前只在畫面上,還沒有存進資料庫
  hook: string;
  height: number;
  build: number;
  stars: number;
  familiarity: number;
  face: string;
  introJson: string;
  deviceCode: string;
  createdAt: number;
  updatedAt: number;
};

type PersonRow = {
  id: number;
  name: string;
  hook: string;
  height: number;
  build: number;
  stars: number;
  familiarity: number;
  face: string;
  intro_json: string;
  device_code: string;
  created_at: number;
  updated_at: number;
};

function toPerson(r: PersonRow): Person {
  return {
    id: r.id,
    name: r.name,
    note: '',
    hook: r.hook,
    height: r.height,
    build: r.build,
    stars: r.stars,
    familiarity: r.familiarity,
    face: r.face,
    introJson: r.intro_json,
    deviceCode: r.device_code,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export type PersonDraft = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>;

export function blankPerson(): PersonDraft {
  return {
    name: '',
    note: '',
    hook: '',
    height: 0.5,
    build: 0.5,
    stars: 0,
    familiarity: 0,
    face: '',
    introJson: '',
    deviceCode: '',
  };
}

/** minScore:0 = 全部;-1 = 只看還沒打分的;其餘為分數下限(半顆星為單位)。 */
export async function listPeople(db: SQLiteDatabase, search: string, minScore = 0): Promise<Person[]> {
  const q = `%${search.trim()}%`;
  const scoreFilter = minScore < 0 ? 'stars = 0' : 'stars >= ?';
  const params: (string | number)[] = [q, q, q, q];
  if (minScore >= 0) params.push(minScore);
  const rows = await db.getAllAsync<PersonRow>(
    `SELECT * FROM people
     WHERE (? = '%%' OR name LIKE ? OR hook LIKE ? OR intro_json LIKE ?) AND ${scoreFilter}
     ORDER BY stars DESC, updated_at DESC`,
    ...params,
  );
  return rows.map(toPerson);
}

export async function getPerson(db: SQLiteDatabase, id: number): Promise<Person | null> {
  const r = await db.getFirstAsync<PersonRow>('SELECT * FROM people WHERE id = ?', id);
  return r ? toPerson(r) : null;
}

export async function insertPerson(db: SQLiteDatabase, p: PersonDraft): Promise<number> {
  const now = Date.now();
  const r = await db.runAsync(
    `INSERT INTO people (name, hook, height, build, stars, familiarity, face, intro_json, device_code, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    p.name,
    p.hook,
    p.height,
    p.build,
    p.stars,
    p.familiarity,
    p.face,
    p.introJson,
    p.deviceCode,
    now,
    now,
  );
  return r.lastInsertRowId;
}

export async function updatePerson(db: SQLiteDatabase, id: number, p: PersonDraft) {
  await db.runAsync(
    `UPDATE people SET name = ?, hook = ?, height = ?, build = ?, stars = ?, familiarity = ?,
       face = ?, intro_json = ?, device_code = ?, updated_at = ? WHERE id = ?`,
    p.name,
    p.hook,
    p.height,
    p.build,
    p.stars,
    p.familiarity,
    p.face,
    p.introJson,
    p.deviceCode,
    Date.now(),
    id,
  );
}

export async function setPersonScore(db: SQLiteDatabase, id: number, score: number) {
  await db.runAsync('UPDATE people SET stars = ?, updated_at = ? WHERE id = ?', score, Date.now(), id);
}

export async function deletePerson(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM people WHERE id = ?', id);
}

/** 互掃交換:把對方的自我介紹存成認識的人。同一個人再掃一次只更新介紹,不動你的私人筆記。 */
export async function saveExchangedIntro(db: SQLiteDatabase, intro: PublicIntro): Promise<number> {
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM people WHERE device_code = ?',
    intro.deviceCode,
  );
  const json = JSON.stringify(intro);
  if (existing) {
    await db.runAsync('UPDATE people SET intro_json = ?, updated_at = ? WHERE id = ?', json, Date.now(), existing.id);
    return existing.id;
  }
  return insertPerson(db, {
    ...blankPerson(),
    name: intro.fields.nickname ?? '',
    hook: intro.fields.job ?? intro.fields.tagline ?? '',
    introJson: json,
    deviceCode: intro.deviceCode,
  });
}

export function parseStoredIntro(json: string): PublicIntro | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as PublicIntro;
  } catch {
    return null;
  }
}

// ---------- 聚會 ----------

export type Gathering = {
  id: string;
  title: string;
  endsAt: number;
  role: 'creator' | 'guest';
  cloud: boolean;
  createdAt: number;
};

type GatheringRow = {
  id: string;
  title: string;
  ends_at: number;
  role: 'creator' | 'guest';
  cloud: number;
  created_at: number;
};

function toGathering(r: GatheringRow): Gathering {
  return { id: r.id, title: r.title, endsAt: r.ends_at, role: r.role, cloud: r.cloud === 1, createdAt: r.created_at };
}

export async function listGatherings(db: SQLiteDatabase): Promise<Gathering[]> {
  const rows = await db.getAllAsync<GatheringRow>('SELECT * FROM gatherings ORDER BY ends_at DESC');
  return rows.map(toGathering);
}

export async function getGathering(db: SQLiteDatabase, id: string): Promise<Gathering | null> {
  const r = await db.getFirstAsync<GatheringRow>('SELECT * FROM gatherings WHERE id = ?', id);
  return r ? toGathering(r) : null;
}

export async function createGathering(
  db: SQLiteDatabase,
  g: { id: string; title: string; endsAt: number; cloud: boolean },
): Promise<Gathering> {
  const created: Gathering = { ...g, role: 'creator', createdAt: Date.now() };
  await db.runAsync(
    'INSERT INTO gatherings (id, title, ends_at, role, cloud, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    created.id,
    created.title,
    created.endsAt,
    created.role,
    created.cloud ? 1 : 0,
    created.createdAt,
  );
  return created;
}

export async function joinGathering(db: SQLiteDatabase, id: string, title: string, endsAt: number, cloud: boolean) {
  await db.runAsync(
    'INSERT OR IGNORE INTO gatherings (id, title, ends_at, role, cloud, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    title,
    endsAt,
    'guest',
    cloud ? 1 : 0,
    Date.now(),
  );
}

export async function deleteGathering(db: SQLiteDatabase, id: string) {
  await db.runAsync('DELETE FROM roster WHERE gathering_id = ?', id);
  await db.runAsync('DELETE FROM gatherings WHERE id = ?', id);
}

/** 聚會結束超過保存天數後,自動刪除聚會與名單(私人筆記不受影響)。 */
export async function purgeExpired(db: SQLiteDatabase) {
  const cutoff = Date.now() - RETENTION_DAYS * DAY_MS;
  await db.runAsync('DELETE FROM roster WHERE gathering_id IN (SELECT id FROM gatherings WHERE ends_at < ?)', cutoff);
  await db.runAsync('DELETE FROM gatherings WHERE ends_at < ?', cutoff);
}

// ---------- 聚會名單 ----------

export type RosterEntry = { id: number; gatheringId: string; intro: PublicIntro; addedAt: number };

export async function listRoster(db: SQLiteDatabase, gatheringId: string): Promise<RosterEntry[]> {
  const rows = await db.getAllAsync<{ id: number; gathering_id: string; intro_json: string; added_at: number }>(
    'SELECT * FROM roster WHERE gathering_id = ? ORDER BY added_at DESC',
    gatheringId,
  );
  const out: RosterEntry[] = [];
  for (const r of rows) {
    const intro = parseStoredIntro(r.intro_json);
    if (intro) out.push({ id: r.id, gatheringId: r.gathering_id, intro, addedAt: r.added_at });
  }
  return out;
}

/** 回傳 true 表示新增;false 表示這位賓客已經在名單裡(更新其介紹)。 */
export async function addToRoster(db: SQLiteDatabase, gatheringId: string, intro: PublicIntro): Promise<boolean> {
  const json = JSON.stringify(intro);
  const existing = await db.getFirstAsync<{ id: number }>(
    'SELECT id FROM roster WHERE gathering_id = ? AND device_code = ?',
    gatheringId,
    intro.deviceCode,
  );
  if (existing) {
    await db.runAsync('UPDATE roster SET intro_json = ? WHERE id = ?', json, existing.id);
    return false;
  }
  await db.runAsync(
    'INSERT INTO roster (gathering_id, device_code, intro_json, added_at) VALUES (?, ?, ?, ?)',
    gatheringId,
    intro.deviceCode,
    json,
    Date.now(),
  );
  return true;
}

export async function removeFromRoster(db: SQLiteDatabase, id: number) {
  await db.runAsync('DELETE FROM roster WHERE id = ?', id);
}
