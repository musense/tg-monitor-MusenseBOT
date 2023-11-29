const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const exec = require("child_process").exec;
require("dotenv").config();

// 在ENV內替換各數值
const token = process.env.TELEGRAM_TOKEN;
const filePath = process.env.FILE_PATH;
const chatId = process.env.CHAT_ID;

console.log("bot is monitoring...");
// 使用polling模式讓BOT可以持續接收與更新訊息
const bot = new TelegramBot(token, { polling: true });

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  // 在log中留存確認BOT通知的對象ID
  console.log("Chat ID:", chatId);
  if (msg.text === "/sysinfo") {
    exec("ps aux --sort=-%cpu,-%mem | head -n 11", (error, stdout, stderr) => {
      if (error) {
        bot.sendMessage(chatId, `error: ${error.message}`);
        return;
      }
      if (stderr) {
        bot.sendMessage(chatId, `stderr: ${stderr}`);
        return;
      }
      bot.sendMessage(chatId, `<pre>${stdout}</pre>`, { parse_mode: "HTML" });
    });
  }
  if (msg.text === "/restartDB") {
    exec("sudo systemctl restart mongod", (error, stdout, stderr) => {
      if (error) {
        bot.sendMessage(chatId, `Error restarting DB: ${error.message}`);
        return;
      }
      if (stderr) {
        bot.sendMessage(chatId, `DB restarted with warnings: ${stderr}`);
        return;
      }
      bot.sendMessage(chatId, "DB restart successfully");
    });
  }
  if (msg.text === "/syslog") {
    exec("sudo tail -n 10 /var/log/syslog", (error, stdout, stderr) => {
      if (error) {
        bot.sendMessage(chatId, `Error reading syslog: ${error.message}`);
        return;
      }
      if (stderr) {
        bot.sendMessage(chatId, `Syslog read with warnings: ${stderr}`);
        return;
      }
      bot.sendMessage(chatId, "```\n" + stdout + "\n```", {
        parse_mode: "MarkdownV2",
      });
    });
  }
  if (msg.text === "/mongodlog") {
    exec(
      "sudo tail -n 10 /var/log/mongodb/mongod.log",
      (error, stdout, stderr) => {
        if (error) {
          bot.sendMessage(chatId, `Error reading mongod log: ${error.message}`);
          return;
        }
        if (stderr) {
          bot.sendMessage(chatId, `mongod log read with warnings: ${stderr}`);
          return;
        }
        bot.sendMessage(chatId, "```\n" + stdout + "\n```", {
          parse_mode: "MarkdownV2",
        });
      }
    );
  }
  // 使用 /checkProcStatus+執行緒名稱檢查狀況, 避免服務重啟時PID不固定的問題
  if (msg.text.startsWith("/checkProcStatus")) {
    const procName = msg.text.split(" ")[1];

    if (!procName) {
      bot.sendMessage(chatId, "Please specify a process name.");
      return;
    }

    const cmd = `cat /proc/$(pgrep -x ${procName})/status | grep -E 'VmSize|RssAnon'`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        bot.sendMessage(
          chatId,
          `Error reading process status: ${error.message}`
        );
        return;
      }
      if (stderr) {
        bot.sendMessage(chatId, `Process Status read with warnings: ${stderr}`);
        return;
      }
      bot.sendMessage(chatId, "```\n" + stdout + "\n```", {
        parse_mode: "MarkdownV2",
      });
    });
  }
});

let previousSize = 0;

fs.watchFile(filePath, (curr, prev) => {
  // 檢查文件是否被修改 (mtime=modification time)
  if (curr.mtime !== prev.mtime) {
    const newSize = curr.size;
    const sizeDiff = newSize - previousSize;
    // 檢查文件內容是否增加
    if (sizeDiff > 0) {
      // 使用 Buffer 分配新内容大小的空間
      const buffer = Buffer.alloc(sizeDiff);

      // 用唯讀的方式開啟檔案
      fs.open(filePath, "r", (err, fd) => {
        if (err) throw err;

        // 從先前文件大小的位置開始讀取，只讀取新增的部分
        fs.read(
          fd, //file descriptor
          buffer,
          0,
          sizeDiff,
          previousSize,
          (err, bytesRead, buffer) => {
            if (err) throw err;

            const newContent = buffer.toString("utf8");
            // 快速檢查新增的内容中是否包含特定字符串
            if (newContent.includes("Out of memory:")) {
              const lines = newContent.split(/\r?\n/);

              // 從最後面開始找出確切包含該字符串的行,確定是最新的內容
              const alertLine = lines
                .reverse()
                .find((line) => line.includes("Out of memory:"));
              if (alertLine) {
                bot.sendMessage(chatId, `Alert: ${alertLine}`);
              }
            }
            // 更新PreviousSize方便下次比較
            previousSize = newSize;

            fs.close(fd, (err) => {
              if (err) throw err;
            });
          }
        );
      });
    }
  }
});

// 監控錯誤
bot.on("polling_error", (error) => {
  console.log(error);
});
