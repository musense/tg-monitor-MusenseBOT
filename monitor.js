const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const exec = require("child_process").exec;
require("dotenv").config();

// replace the value below with the Telegram token you received from @BotFather
const token = process.env.TELEGRAM_TOKEN;
const filePath = process.env.FILE_PATH;
const chatId = process.env.CHAT_ID;

console.log("bot is monitoring...");
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  console.log("Chat ID:", chatId);
  if (msg.text === "/sysStatus") {
    exec("ps aux --sort=-%cpu,-%mem | head -n 11", (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      bot.sendMessage(chatId, `<pre>${stdout}</pre>`, { parse_mode: "HTML" });
    });
  }
});

let previousSize = 0;

// fs.watchFile(filePath, (curr, prev) => {
//   if (curr.mtime !== prev.mtime) {
//     // File has been modified
//     const newSize = curr.size;
//     const sizeDiff = newSize - previousSize;

//     if (sizeDiff > 0) {
//       const buffer = Buffer.alloc(sizeDiff);

//       // Open the file
//       fs.open(filePath, "r", (err, fd) => {
//         if (err) throw err;

//         // Read the new content
//         fs.read(
//           fd,
//           buffer,
//           0,
//           sizeDiff,
//           previousSize,
//           (err, bytesRead, buffer) => {
//             if (err) throw err;

//             const newContent = buffer.toString("utf8");

//             // Split the new content into lines
//             const lines = newContent.split("/\r?\n/");

//             // Find the line that contains the specified string
//             const alertLine = lines.find((line) =>
//               line.includes("Out of memory:")
//             );

//             if (alertLine) {
//               bot.sendMessage(chatId, `Alert: ${alertLine}`);
//               // Update the previous size
//               previousSize = newSize;
//             }

//             fs.close(fd, (err) => {
//               if (err) throw err;
//             });
//           }
//         );
//       });
//     }
//   }
// });
fs.watchFile(filePath, (curr, prev) => {
  if (curr.mtime !== prev.mtime) {
    // File has been modified
    const newSize = curr.size;
    const sizeDiff = newSize - previousSize;

    if (sizeDiff > 0) {
      const buffer = Buffer.alloc(sizeDiff);

      // Open the file
      fs.open(filePath, "r", (err, fd) => {
        if (err) throw err;

        // Read the new content
        fs.read(
          fd,
          buffer,
          0,
          sizeDiff,
          previousSize,
          (err, bytesRead, buffer) => {
            if (err) throw err;

            const newContent = buffer.toString("utf8");

            // Check if the new content contains the specified string
            if (newContent.includes("Out of memory:")) {
              // Split the new content into lines
              const lines = newContent.split(/\r?\n/);

              // Find the line that contains the specified string
              const alertLine = lines
                .reverse()
                .find((line) => line.includes("Out of memory:"));
              if (alertLine) {
                bot.sendMessage(chatId, `Alert: ${alertLine}`);
                // Update the previous size
                previousSize = newSize;
              }
            }

            fs.close(fd, (err) => {
              if (err) throw err;
            });
          }
        );
      });
    }
  }
});
bot.on("polling_error", (error) => {
  console.log(error); // => 'EFATAL'
});
