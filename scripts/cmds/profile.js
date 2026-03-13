const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "profile",
    aliases: ["pp", "pfp"],
    author: "AHMED TARIF",
    version: "3.6",
    cooldowns: 5,
    role: 0,
    noPrefix: true,
    prefixRequired:true,
    premium:true,
    shortDescription: { en: "Show profile picture from link or ID." },
    longDescription: { en: "Get profile picture using user ID, mention, reply, or Facebook profile link." },
    category: "Image",
    guide: { en: "Send a message with link, mention someone, or reply to view profile picture." }
  },

  onStart: async ({ api, event }) => {
    try {
      let id = event.senderID;

      // Check for reply
      if (event.type === "message_reply") id = event.messageReply.senderID;

      // Check for mentions
      else if (Object.keys(event.mentions).length) id = Object.keys(event.mentions)[0];

      // Check if message contains a Facebook link
      else if (event.body && event.body.includes("facebook.com/")) {
        const match = event.body.match(/facebook\.com\/(?:profile\.php\?id=)?([0-9a-zA-Z\.]+)/);
        if (match) id = match[1].includes(".") ? match[1] : match[1];
      }

      const cache = path.join(__dirname, "cache");
      if (!fs.existsSync(cache)) fs.mkdirSync(cache);
      const file = path.join(cache, `${id}.jpg`);
      const url = `https://graph.facebook.com/${id}/picture?height=720&width=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const response = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(file, Buffer.from(response.data, "binary"));

      await api.sendMessage(
        { body: "", attachment: fs.createReadStream(file) },
        event.threadID,
        () => fs.unlinkSync(file),
        event.messageID
      );

    } catch (e) {
      console.error(e);
      api.sendMessage("⚠️ Could not fetch profile picture.", event.threadID, event.messageID);
    }
  }
};
