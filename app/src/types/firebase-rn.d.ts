// firebase/auth 的 React Native 版本(Metro 打包時使用)有 getReactNativePersistence,
// 但 TypeScript 預設解析到瀏覽器版型別,這裡補上宣告。
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
