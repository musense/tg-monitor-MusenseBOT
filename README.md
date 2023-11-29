# 萬事起頭難, 但欲 Bot 不難!

用途：監測 Linux 系統檔案狀況, 與透過 telegram 訊息操控簡易系統指令

### **首先必須先申請一個 Telegram 的 BOT!**

1.在 telegram 裡面找到 @BotFather  
2.使用/newbot 申請一個新的 Bot  
3.依照指示完成後續動作後會提供你一個 Bot token  
4.將 Bot token 放入 env 設定裡面

#### 該在本專案放入哪些`.env` 變數呢?

- [x] **TELEGRAM_TOKEN**: 放入剛剛取得的 Bot token
- [x] **CHAT_ID**: 通知對象或群組的 CHAT_ID
- [x] **FILE_PATH**: 需要監控的檔案絕對路徑

#### 預先取得 CHAT_ID 的方式:

1.使用網頁版的 telegram 登入帳號  
2.點擊想要讓 Bot 通知的對象或群組對話視窗  
3.網址上方#後面的數字就是該對象的 CHAT_ID

#### 如何啟動?

建議使用`PM2`,提高應用程式的可靠性以及後續管理效率  
(有關 PM2 的詳細操作, 可以參考https://pm2.keymetrics.io/docs/usage/quick-start/)  
專案內安裝:

```
npm i pm2
```

or  
環境全局安裝:

```
npm install pm2 -g
```

安裝完成之後可以使用下列命令開啟應用程式:

```
pm2 start monitor.js --name [自定義程序名稱]
```

#### 可輸入指令:

`/sysinfo`：顯示系統中使用 CPU 與記憶體最多的前 10 個 Process  
`/syslog`：顯示 syslog 最後 10 行 log  
`/mongodlog`：顯示 mongod 最後 10 行 log  
`/checkProcStatus + [Process Name]`：使用/checkProcStatus 加上 Process 名稱, 例如/checkProcStatus mongod 就會顯示目前該執行緒的 VM size 與 rss 值  
`/restartDB`：重新啟動 MongoDB <span style="color: red;">**(慎用!)**</span>

#### 調整監控檔案與監控訊息

- 修改監控目標檔案：FILE_PATH
- 修改監控目標訊息（如果在檔案內偵測到目標訊息時即時通知）

```js
//調整includes字串
if (newContent.includes("Out of memory:")) {
 ...
 ...
//調整includes字串
 const alertLine = lines.reverse().find((line) => line.includes("Out of memory:"));
 ...
 ...
}
```

> [!NOTE]
> 初次啟動時如果目標文件內有包含警示文字也會先通知一次

如果有偵測到目標訊息會顯示下列通知:  
![BOT通知圖片](http://uat-apidb.musense.tw/home/saved_image/content/imagefile-1701168095714.png "telegram alert範例.")
