const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const spinner = ['⠇','⠦','⠏','⠧','⠹','⠋','⠇','⠦','⠏','⠧','⠹','⠋'];
const ytID = url => (url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/) || [])[1];

let apiUrl;
(async () => {
  try { 
    apiUrl = (await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json")).data.api; 
  } catch(e){ console.error("API URL load failed", e); }
})();

const getAudioStream = async (url) => {
  const { data } = await axios.get(url, { responseType: "stream" });
  return data;
};

module.exports = {
  config: {
    name: "sing2",
    version: "1.0.0",
    author: "AHMED TARIF",
    role: 0,
    noPrefix: true,
    prefixRequired: true,
    premium: true,
    description: "Searches and downloads YouTube audio!",
    category: "Music",
    guide: { en: "${prefix}sing2 name" }
  },

  onStart: async ({ api, args, event }) => {
    try {
      const query = args.join(" ");
      if (!query) return api.sendMessage("❌ Provide sing name or URL.", event.threadID, event.messageID);

      let id = query.includes("youtu") ? ytID(query) : null;

      // Spinner
      let frame = 0;
      const waitMsg = await api.sendMessage(`${spinner[frame]} 𝚜𝚎𝚊𝚛𝚌𝚑...`, event.threadID);
      const interval = setInterval(() => {
        frame = (frame + 1) % spinner.length;
        api.editMessage(`${spinner[frame]} 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐...`, waitMsg.messageID).catch(() => {});
      }, 200);

      if (!id) {
        const search = await yts(query);
        if (!search.videos.length) {
          clearInterval(interval);
          await api.unsendMessage(waitMsg.messageID);
          return api.sendMessage("❌ No results found.", event.threadID, event.messageID);
        }
        id = search.videos[0].videoId;
      }

      // Fetch audio link from your API
      const { data } = await axios.get(`${apiUrl}/ytDl3?link=${id}&format=mp3`);

      clearInterval(interval);
      await api.unsendMessage(waitMsg.messageID);

      const audioStream = await getAudioStream(data.downloadLink);

      await api.sendMessage({
        body: `🎵 Playing: ${data.title}`,
        attachment: audioStream
      }, event.threadID, event.messageID);

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ Failed to download audio.", event.threadID, event.messageID);
    }
  },

  run: async (ctx) => module.exports.onStart(ctx),
};
