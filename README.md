# Partyking(暫名)

一個**離線優先**的手機 App,幫人快速記住「這個人是誰、怎麼認識的、感覺如何」。
不用打字:用滑桿、星星、標籤和一個可以捏的小人,幾秒鐘就能記下一個人。

> 名稱還沒定案(候選:Nametag)。GitHub 倉庫是 `Nametag`。

## 在做什麼

聚會、約會、拜訪客戶時,遇到很多人,過幾天就忘了誰是誰。Partyking 讓你當下快速記下來,之後一眼想起來。

**首頁有三種模式**(選一個進去,再按一次底部「首頁」回來):

| 模式 | 用途 | 特色 |
|---|---|---|
| 生活 | 工作、學生、業務、交朋友 | 小人、記憶鉤子標籤、重要度(0.5–5 星)、小記 |
| 約會 | 記錄約會對象 | 好感度 -5 ~ +99、個人資訊(職業、收入、家庭、房車)、帶時間戳的備註 |
| 主辦 | 婚禮、大型聚會,公開給賓客看 | 賓客名牌:暱稱、特色、社交帳號;**沒有任何私人評價** |

**核心原則**

- **私人筆記永遠只留在手機**,不上傳。
- 公開的只有本人自己填的「自我介紹」,可以用 QR 碼互掃交換。
- 同一場聚會用「聚會碼」讓賓客互相看到彼此願意公開的介紹(後端最後才接,有離線備援)。
- 同一個人只有一筆紀錄,備註可以一直加,每則自動帶時間戳。

目前**約會與主辦只有畫面,資料還不會儲存**(畫面先做完,後端最後一次補上)。

## 人物系統

- 預設是手繪的「經典」小人(SVG,參數化:性別、體型、身材、身高、髮型、服裝、膚色、衣色、年紀)。
- 另有**美式 Emoji 風**的向量分層素材(男、女,20–30 歲):9 個圖層、5 種髮型、6 種服裝、瘦 / 普通 / 壯、身材(男肌肉 / 女曲線)、真正改變比例的身高。素材是照參考圖描成 SVG,由腳本產生。
- 韓國漫畫風、日本清透風、其他年紀(20–30 歲以外)還沒有素材,沒有的組合自動退回經典小人。
- 規格與素材需求:`docs/avatar-spec.md`;目前完成度與還缺什麼:`docs/avatar-status.md`;參考圖:`Image/`、`docs/reference/`。

## 語言

設定頁最上面可切換**中文 / English**(S07、S08,會記住)。程式裡的文字維持中文,畫面用 `t('中文')` 查 `app/src/lib/i18n.ts` 的英文對照;查不到就顯示中文。資料庫存的值(例如記憶鉤子「眼鏡」)一律存中文,只在畫面翻譯。新增畫面文字時,請同步加英文對照。

## 用到什麼

| 類別 | 技術 |
|---|---|
| 框架 | Expo SDK 57、React Native 0.86、React 19、TypeScript |
| 路由 | expo-router(檔案式路由,`app/src/app/`) |
| 本機資料庫 | expo-sqlite(用 `PRAGMA user_version` 做遷移) |
| 畫圖 | react-native-svg(小人與所有向量圖層) |
| 手感 | expo-haptics(滑桿、圓盤換格時震動) |
| 版面 | react-native-safe-area-context |
| 雲端(之後) | Firebase(Firestore,含離線備援與到期清除) |
| 素材工具 | Node 腳本 + `@resvg/resvg-js`(把 SVG 轉 PNG 做渲染測試) |

互動元件(滑桿、圓盤、星星)都是自己用 responder 手勢寫的,為了能按住拖動、鎖住頁面捲動、換格震動。

## 專案結構

```
partyking/
├─ app/                    Expo 專案
│  ├─ src/app/             畫面(expo-router)
│  ├─ src/components/      元件(編輯器、滑桿、圓盤、人物、三種模式)
│  ├─ src/lib/             邏輯(capture、modes、score、avatar/…)
│  ├─ src/db/              SQLite 與遷移
│  ├─ scripts/avatar/      人物素材的原始描摹、產生器、渲染測試
│  └─ assets/avatar/       產生出來的分層 SVG、manifest.json、預覽圖
├─ docs/                   文件
│  ├─ scenarios.md         五個使用者情境與已決定事項
│  ├─ mvp.md               MVP 範圍與進度紀錄
│  ├─ codes.md             畫面標記碼(每個互動元件一個碼)
│  ├─ avatar-spec.md       人物圖片規格
│  ├─ cloud-setup.md       雲端設定
│  └─ reference/           人物參考圖
├─ GLOSSARY.md             名詞表(聚會、賓客、重要度、記憶鉤子…)
└─ .gitmessage             commit 訊息範本
```

## 怎麼跑

```bash
cd app
npm install --legacy-peer-deps
npx expo start            # 用手機的 Expo Go 掃 QR 碼
```

常用檢查:

```bash
npx tsc --noEmit          # 型別檢查
npx expo-doctor           # 相依套件檢查
npm run avatar:test       # 重新產生人物素材並跑渲染測試,預覽圖在 app/assets/avatar/previews/
```

要新增 Expo 套件,請用 `npx expo install <套件> -- --legacy-peer-deps`,不要直接 `npm add`。

## 約定

- **畫面優先,後端最後一次接**;新的紀錄資料先不存,設定除外。
- 每個互動元件有**標記碼**(例如 P10、M01、Y03),寫在 `docs/codes.md`;改畫面時同步更新。
- commit 訊息用 `類型(範圍): 說明`,範本在 `.gitmessage`(`feat`、`fix`、`docs`、`refactor`、`chore`)。

## 目前進度與還沒做

- 做了:快速記錄、三種模式畫面、經典小人、美式男性素材、本機資料庫、QR 自我介紹、聚會碼與名單(含離線備援)。
- 還沒做:其他年紀的素材、韓 / 日風格、約會與主辦的儲存、篩選、穿搭照片上傳、備註時間戳(生活版)、開頭引導、雲端的到期清除。
