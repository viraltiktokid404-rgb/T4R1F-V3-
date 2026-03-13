const fs = require("fs-extra");
const axios = require("axios");
const request = require("request");

module.exports = {
  config: {
    name: 'autodl',
    version: '5.0',
    author: 'AHMED TARIF',
    countDown: 5,
    role: 0,
    prefixRequired: true,
    premium: true,
    shortDescription: 'Auto video download for any URL',
    category: 'Everyone',
  },

  onStart: async ({ api, event }) => {
    api.sendMessage("✅ AutoLink active! Send any video link.", event.threadID);
  },

  onChat: async ({ api, event }) => {
    const url = (event.body.match(/https?:\/\/\S+/) || [])[0];
    if (!url) return;

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const { data } = await axios.get(`https://nayan-video-downloader.vercel.app/alldown?url=${encodeURIComponent(url)}`);
      const videoUrl = data.data.high || data.data.low;
      if (!videoUrl) return api.sendMessage("乄", event.threadID, event.messageID);

      request(videoUrl).pipe(fs.createWriteStream("video.mp4")).on("close", () => {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
        api.sendMessage({ body: "𝗔𝗨𝗧𝗢 𝗗𝗔𝗪𝗢𝗡𝗟𝗢𝗔𝗗", attachment: fs.createReadStream("video.mp4") }, event.threadID, () => fs.unlinkSync("video.mp4"));
      });

    } catch {
      api.setMessageReaction("🤦‍♂️", event.messageID, () => {}, true);
      api.sendMessage("", event.threadID, event.messageID);
    }
  }
};
