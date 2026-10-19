// 雲端暫存層(Firebase):只放「聚會」與「賓客填的自我介紹」,到期自動刪除。
// 私人筆記(星星、滑桿、記憶鉤子)永遠不會經過這裡。
//
// 沒有設定 Firebase 時,isCloudConfigured() 為 false,App 退回到「主辦人手機保管名單」的離線做法。

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, signInAnonymously, type Auth } from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  collection,
  serverTimestamp,
  setDoc,
  Timestamp,
  type Firestore,
} from 'firebase/firestore';
import { ALL_KEYS, type IntroKey, type PublicIntro } from '@/lib/intro';

/** 雲端自我介紹保存天數(從聚會結束時間起算),要和 Firestore 的 TTL 設定一致。 */
export const CLOUD_RETENTION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function isCloudConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

type Cloud = { app: FirebaseApp; auth: Auth; db: Firestore };
let cloud: Cloud | null = null;

function init(): Cloud {
  if (cloud) return cloud;
  if (!isCloudConfigured()) throw new Error('尚未設定 Firebase');
  const app = getApps().length ? getApp() : initializeApp(config);
  let auth: Auth;
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // 熱重載時 Auth 已經初始化過
    auth = getAuth(app);
  }
  cloud = { app, auth, db: getFirestore(app) };
  return cloud;
}

/** 匿名登入:賓客不需要帳號。uid 會被保存在手機上,所以同一支手機重開 App 後仍可修改或刪除自己的介紹。 */
export async function ensureSignedIn(): Promise<string> {
  const { auth } = init();
  if (auth.currentUser) return auth.currentUser.uid;
  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}

function expiryFor(endsAt: number): Timestamp {
  return Timestamp.fromMillis(endsAt + CLOUD_RETENTION_DAYS * DAY_MS);
}

export async function createCloudGathering(g: { id: string; title: string; endsAt: number }) {
  const uid = await ensureSignedIn();
  await setDoc(doc(init().db, 'gatherings', g.id), {
    title: g.title,
    endsAt: Timestamp.fromMillis(g.endsAt),
    ownerUid: uid,
    expiresAt: expiryFor(g.endsAt),
  });
}

export async function cloudGatheringExists(id: string): Promise<boolean> {
  await ensureSignedIn();
  const snap = await getDoc(doc(init().db, 'gatherings', id));
  return snap.exists();
}

/** 賓客送出(或更新)自己的自我介紹。 */
export async function submitIntro(gatheringId: string, endsAt: number, intro: PublicIntro) {
  const uid = await ensureSignedIn();
  await setDoc(doc(init().db, 'gatherings', gatheringId, 'members', uid), {
    fields: intro.fields,
    updatedAt: serverTimestamp(),
    expiresAt: expiryFor(endsAt),
  });
}

/** 賓客退出名單,雲端上的介紹立刻刪除。 */
export async function leaveGathering(gatheringId: string) {
  const uid = await ensureSignedIn();
  await deleteDoc(doc(init().db, 'gatherings', gatheringId, 'members', uid));
}

/** 建立者移除某位賓客(規則只允許建立者或本人刪除)。 */
export async function removeMember(gatheringId: string, memberUid: string) {
  await ensureSignedIn();
  await deleteDoc(doc(init().db, 'gatherings', gatheringId, 'members', memberUid));
}

export type CloudMember = { uid: string; mine: boolean; intro: PublicIntro };

/** 即時監聽聚會名單。回傳取消監聽的函式。 */
export function watchMembers(
  gatheringId: string,
  onData: (members: CloudMember[]) => void,
  onError: (e: Error) => void,
): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;
  ensureSignedIn()
    .then((myUid) => {
      if (cancelled) return;
      unsub = onSnapshot(
        collection(init().db, 'gatherings', gatheringId, 'members'),
        (snap) => {
          const members: CloudMember[] = [];
          snap.forEach((d) => {
            const raw = d.data().fields as Record<string, unknown> | undefined;
            const fields: Partial<Record<IntroKey, string>> = {};
            for (const k of ALL_KEYS) {
              const v = raw?.[k];
              if (typeof v === 'string' && v) fields[k] = v.slice(0, 200);
            }
            members.push({ uid: d.id, mine: d.id === myUid, intro: { deviceCode: d.id, fields } });
          });
          onData(members);
        },
        (e) => onError(e),
      );
    })
    .catch((e: Error) => onError(e));
  return () => {
    cancelled = true;
    unsub?.();
  };
}
