const axios = require("axios");

const status = require("../utils/status");
const diskinfo = require("../utils/diskinfo");
const humanTime = require("../utils/humanTime");
const { uploadFileStream } = require("../utils/gdrive");

const api = process.env.SEARCH_SITE || "https://torrent-aio-bot.herokuapp.com/";
console.log("Using api: ", api);

const searchRegex = /\/search (piratebay|limetorrent|1337x) (.+)/;
const detailsRegex = /\/details (piratebay|limetorrent|1337x) (.+)/;
const downloadRegex = /\/download (.+)/;
const statusRegex = /\/status (.+)/;
const currentstatusRegex = /\/currentstatus/;
const removeRegex = /\/remove (.+)/;
const authorizedChats = [process.env.AUTHORIZED_CHAT1, process.env.AUTHORIZED_CHAT2];
console.log(authorizedChats);
var lastUrl = '';

const startMessage = `
Glory to Heaven - Official Helper Bot. ⛑

if You are a Glory to Heaven User - /downloadhelp for help relating to Bot Commands

Author of this Bot- Shan.tk - https://github.com/tks18
`;

const unauthorizedMessage = `
This is a Private Bot Which works only for Authorized Groups and will Not work in Personal Chat.

This Bot is Made Specifically for Glory to Heaven Users.

Oh No!!!

I think You are not a Member of this Heaven, You don't deserve this Glory.🤞😛🥱 

Ask https://github.com/tks18 for Membership.
`;

const helpMessage = `
Commands Available in this Bot - 
Current Supported Sites = 1337x, Limetorrent.

Commands Relating to Torrenting and Downloading:
1. /search {site} {query} - to Search for Torrents.

2. /details {site} {magnet link} - Get Details of Torrent.

3. /download {magnet link} - To start a download.

4. /status {magnet link} - To check status of a downloading torrent.

5. /remove {magnet link} - To remove an already added torrent.

6. /currentstatus - To Check anything is Downloading.

Commands Relating to Server and Bot Status:
1. /serverstatus - Get Current Storage, Status of Disk

2. /serveruptime - Get Uptime of the Bot Server
`;

function bot(torrent, bot) {
  bot.onText(/\/start/, async msg => {
      if(authorizedChats.includes(`${msg.chat.id}`)){
        bot.sendMessage(msg.chat.id, startMessage);
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.on("message", async msg => {
      if(authorizedChats.includes(`${msg.chat.id}`)){
        if (!msg.document) return;
        const chatId = msg.chat.id;
        const mimeType = msg.document.mimeType;
        const fileName = msg.document.file_name;
        const fileId = msg.document.file_id;
  
        bot.sendMessage(chatId, "Trasmitting directly to Heaven.....Wait Here...Patience is Virtue");
        try {
          const uploadedFile = await uploadFileStream(fileName, bot.getFileStream(fileId));
          const driveId = uploadedFile.data.id;
          const driveLink = `https://drive.google.com/file/d/${driveId}/view?usp=sharing`;
          const publicLink = `${process.env.SITE}api/v1/drive/file/${fileName}?id=${driveId}`;
          bot.sendMessage(chatId, `${fileName} Transmitted to Heaven successfully\nDrive link: ${driveLink}\nPublic link: ${publicLink}`);
        } catch (e) {
          bot.sendMessage(chatId, "A Demon Crossed while Transmitting, Try Again now and Hope that demon Never Comes Again. 😋");
        }
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(/\/downloadhelp/, async msg => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        bot.sendMessage(msg.chat.id, helpMessage);
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(/\/serverdiskinfo (.+)/, async (msg, match) => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        const from = msg.chat.id;
        const path = match[1];
        const info = await diskinfo(path);
        bot.sendMessage(from, info);
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(/\/serveruptime/, async msg => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        const from = msg.chat.id;
        bot.sendMessage(from, humanTime(process.uptime() * 1000));
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(/\/serverstatus/, async msg => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        const from = msg.chat.id;
        const currStatus = await status();
        bot.sendMessage(from, currStatus);
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(searchRegex, async (msg, match) => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        var from = msg.chat.id;
        var site = match[1];
        var query = match[2];
  
        bot.sendMessage(from, "☁Searching in Heaven.....☁");
  
        const data = await axios(`${api}api/v1/search/${site}?query=${query}`).then(({ data }) => data);
  
        if (!data || data.error) {
          bot.sendMessage(from, "Heaven is Closed, Requesting to Open, Please Try Again Now");
        } else if (!data.results || data.results.length === 0) {
          bot.sendMessage(from, "There is no Such thing in the Heaven..Wanna try Again.");
        } else if (data.results.length > 0) {
          let results1 = "";
 
          data.results.forEach((result, i) => {
            if (i <= 8) {
              results1 += `Name: ${result.name} \nSeeds: ${result.seeds} \nDetails: ${result.details} \nLink: ${result.link} \n\n`;
            }
          });
  
          bot.sendMessage(from, `${results1} \n This Message will be Auto Deleted in 10 Secs`).then(m => {
            setTimeout(() => {
              bot.deleteMessage(msg.chat.id , m.message_id);
            }, 10000);
          });
        }
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(detailsRegex, async (msg, match) => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        var from = msg.chat.id;
        var site = match[1];
        var query = match[2];
  
        bot.sendMessage(from, "Trying to Contact Heaven...⛅.in Progress..");
  
        const data = await axios(`${api}/details/${site}?query=${query}`).then(({ data }) => data);
        if (!data || data.error) {
          bot.sendMessage(from, `Heaven is Closed 🚪 \n Requesting to Open 🚪 \n Please Try Again Now`);
        } else if (data.torrent) {
          const torrent = data.torrent;
          let result1 = "";
          let result2 = "";
  
          result1 += `Title: ${torrent.title} \n\nInfo: ${torrent.info}`;
          torrent.details.forEach(item => {
            result2 += `${item.infoTitle} ${item.infoText} \n\n`;
          });
          result2 += "Magnet Link:";
  
          await bot.sendMessage(from, result1);
          await bot.sendMessage(from, result2);
          await bot.sendMessage(from, torrent.downloadLink);
        }
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(downloadRegex, (msg, match) => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        var from = msg.chat.id;
        var link = match[1];
        let messageObj = null;
        let torrInterv = null;
  
        const reply = async torr => {
          let mess1 = "";
          mess1 += `Name: ${torr.name}\n\n`;
          mess1 += `Status: ${torr.status}\n\n`;
          mess1 += `Size: ${torr.total}\n\n`;
          if (!torr.done) {
            mess1 += `Downloaded: ${torr.downloaded}\n\n`;
            mess1 += `Speed: ${torr.speed}\n\n`;
            mess1 += `Progress: ${torr.progress}%\n\n`;
            mess1 += `Time Remaining: ${torr.redableTimeRemaining}\n\n`;
          } else {
            mess1 += `Link: ${torr.downloadLink}\n\n`;
            clearInterval(torrInterv);
          }
          mess1 += `Magnet URI: ${torr.magnetURI}`;
          messageObj = await bot.sendMessage(from, mess1);
        };
  
        if (link.indexOf("magnet:") !== 0) {
          bot.sendMessage(from, `Heaven will Never Accept this type of Links. \n This is a Godly Place. \n Try a Proper Request`);
        } else {
          bot.sendMessage(from, "☁ Uploading to Heaven.... ☁");
          bot.deleteMessage(from, msg.message_id);
          lastUrl = link;
          try {
            const torren = torrent.download(
              link,
              torr => reply(torr),
              torr => reply(torr)
            );
            torrInterv = setInterval(() => {
              const torre = torrent.statusLoader(torren);
              let mess1 = "";
              mess1 += `Name: ${torre.name}\n\n`;
              mess1 += `Status: ${torre.status}\n\n`;
              mess1 += `Size: ${torre.total}\n\n`;
              if (!torre.done) {
                mess1 += `Downloaded: ${torre.downloaded}\n\n`;
                mess1 += `Speed: ${torre.speed}\n\n`;
                mess1 += `Progress: ${torre.progress}%\n\n`;
                mess1 += `Time Remaining: ${torre.redableTimeRemaining}\n\n`;
              } else {
                mess1 += `Link: ${torre.downloadLink}\n\n`;
              }
              mess1 += `Magnet URI: ${torre.magnetURI}`;
              bot.editMessageText(mess1, { chat_id: messageObj.chat.id, message_id: messageObj.message_id });
            }, 5000);
          } catch (e) {
            bot.sendMessage(from, `A Demon Crossed while Transmitting. \n Try Again now \n\n Hope that demon Never Comes Again. 😋`);
          }
        }
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(statusRegex, (msg, match) => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        var from = msg.chat.id;
        var link = match[1];
  
        const torr = torrent.get(link);
        if (link.indexOf("magnet:") !== 0) {
          bot.sendMessage(from, `Heaven will Never Accept this type of Links. \n This is a Godly Place. \n Try a Proper Request`);
        } else if (!torr) {
          bot.sendMessage(from, "Heaven is free to Take Requests");
        } else {
          let mess1 = "";
          bot.deleteMessage(from, msg.message_id);
          mess1 += `Name: ${torr.name}\n\n`;
          mess1 += `Status: ${torr.status}\n\n`;
          mess1 += `Size: ${torr.total}\n\n`;
          if (!torr.done) {
            mess1 += `Downloaded: ${torr.downloaded}\n\n`;
            mess1 += `Speed: ${torr.speed}\n\n`;
            mess1 += `Progress: ${torr.progress}\n\n`;
            mess1 += `Time Remaining: ${torr.redableTimeRemaining}\n\n`;
          } else {
            mess1 += `Link: ${torr.downloadLink}\n\n`;
          }
          mess1 += `Magnet URI: ${torr.magnetURI}`;
          bot.sendMessage(from, mess1);
        }
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(currentstatusRegex, (msg) => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        var from = msg.chat.id;
        var link = lastUrl;
  
        const torr = torrent.get(link);
        if (link.indexOf("magnet:") !== 0) {
          bot.sendMessage(from,  `Heaven is free to Take Requests`);
        } else if (!torr) {
          bot.sendMessage(from,  "Heaven is free to Take Requests");
        } else {
          let mess1 = "";
          mess1 += `Name: ${torr.name}\n\n`;
          mess1 += `Status: ${torr.status}\n\n`;
          mess1 += `Size: ${torr.total}\n\n`;
          if (!torr.done) {
            mess1 += `Downloaded: ${torr.downloaded}\n\n`;
            mess1 += `Speed: ${torr.speed}\n\n`;
            mess1 += `Progress: ${torr.progress}\n\n`;
            mess1 += `Time Remaining: ${torr.redableTimeRemaining}\n\n`;
          } else {
            mess1 += `Link: ${torr.downloadLink}\n\n`;
          }
          mess1 += `Magnet URI: ${torr.magnetURI}`;
          bot.sendMessage(from, mess1);
        }
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });

  bot.onText(removeRegex, (msg, match) => {
    if(authorizedChats.includes(`${msg.chat.id}`)){
        var from = msg.chat.id;
        var link = match[1];
  
        try {
          torrent.remove(link);
          bot.sendMessage(from, `!Ahhh No! \n Nothing is allowed to be Removed from Heaven \n\n Since this is your request, I Deleted the Link. \n\n Feeling Saaaad `);
        } catch (e) {
          bot.sendMessage(from, `${e.message}`);
        }
      } else {
        bot.sendMessage(msg.chat.id, unauthorizedMessage);
      }
  });
}

module.exports = bot;
