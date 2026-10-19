# 接上 Firebase(雲端暫存)

雲端只放「聚會」和「賓客填的自我介紹」,到期自動刪除。私人筆記(星星、滑桿、記憶鉤子)完全不上傳。
沒設定時 App 仍可使用,名單退回由主辦人手機保管。

## 步驟

1. 到 [Firebase Console](https://console.firebase.google.com/) 建立專案。
2. **Authentication** → Sign-in method → 啟用 **Anonymous(匿名)**。
3. **Firestore Database** → 建立資料庫(選離使用者近的區域,正式模式)。
4. **Rules** 分頁 → 貼上 `app/firestore.rules` 的內容 → 發布。
5. **到期自動刪除(TTL)**:Firestore → TTL → 新增兩條原則,欄位都是 `expiresAt`:
   - 集合群組 `gatherings`
   - 集合群組 `members`
   到期時間 = 聚會結束時間 + 7 天(App 寫入時已算好)。TTL 刪除不一定準時,通常會延遲數小時到一天內。
6. **Project settings** → Your apps → 新增 **Web** 應用程式 → 複製設定值。
7. 在 `app/` 複製 `.env.example` 為 `.env.local`,填入設定值。
8. `npx expo start --clear`,重新啟動。

## 資料結構

```
gatherings/{聚會ID}                 title, endsAt, ownerUid, expiresAt
gatherings/{聚會ID}/members/{uid}   fields(賓客開啟分享的欄位), updatedAt, expiresAt
```

- 賓客用匿名登入,uid 保存在手機上,重開 App 後仍可更新或退出自己的介紹。換手機或清除資料後 uid 會變,舊的介紹只能等到期刪除。
- 聚會 ID 是隨機字串;規則不允許列出所有聚會,知道 ID(掃到聚會碼)才讀得到。
- 結束後的聚會,規則不允許再送出介紹。
- 建立者與本人可以刪除某位賓客的介紹。

## 目前沒做、之後可能要補

- 防濫用:任何人拿到聚會碼都能填介紹;目前只有建立者能事後移除。
- 自拍照不上雲端(QR 與 Firestore 都只放文字欄位)。
