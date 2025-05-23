點餐遊戲 v9.2_MbyF

歡迎使用這個輕量又可愛的點餐系統！適合家庭、教學、小型餐廳模擬點餐使用。

支援桌機版、手機版、自訂菜單分類與餐點，還能同步到廚房模式接單！
並且支援 PWA，一鍵加到主畫面，隨時開啟！

=== 功能特色 ===
- 桌機版點餐（index.html）
- 手機版點餐（mobile.html）
- 廚房即時接單畫面（kitchen.html）
- 自訂分類、餐點與菜單，並能儲存管理
- 菜單保護密碼（防止誤刪）
- 今日訂單紀錄
- 完成訂單 / 取消訂單
- Firebase 即時同步資料
- 支援 PWA，離線也能使用

=== 如何使用 ===
1. 將所有檔案放到自己的伺服器空間（或直接本機打開）
2. 修改 script.js 裡的 firebaseConfig（如果要用自己的 Firebase）
3. 開啟 index.html 開始點餐！
4. 廚房端可以用 kitchen.html 查看即時訂單。

手機開啟 index.html 會自動跳轉到 mobile.html！

=== 檔案說明 ===
- index.html：桌機版點餐畫面
- mobile.html：手機版點餐畫面
- kitchen.html：廚房即時訂單接單畫面
- script.js：核心邏輯
- style.css：主要樣式設定
- service-worker.js：PWA 離線支援
- manifest.json：PWA 設定檔
- icon-192.png、icon-512.png：PWA 使用的圖示

=== 小提醒 ===
- 儲存菜單時需要設定密碼，以後修改或刪除會用到。
- 支援 PWA，點選瀏覽器的「加到主畫面」即可安裝。
- 廚房端只會顯示「待處理」的訂單，完成與取消的訂單會自動隱藏。

=== 關於作者 ===
這是為了親子互動、餐廳模擬學習而設計的小專案，
希望你也可以用得開心，有建議也歡迎交流！🌟
