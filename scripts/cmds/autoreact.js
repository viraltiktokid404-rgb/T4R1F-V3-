const axios = require("axios");

module.exports = {
  config: {
    name: "autoreact",
    version: "1.0",
    author: "AHMED TARIF",
    role: 0,
    noprefix: true,
    shortDescription: "Auto react",
    category: "Group"
  },

  // Toggle ON / OFF
  onStart: async ({ message, event, threadsData }) => {
    const threadID = event.threadID;

    const data = await threadsData.get(threadID, "data") || {};

    data.autoreact = !data.autoreact;

    await threadsData.set(threadID, data, "data");

    message.reply(
      `Autoreact ${data.autoreact ? "ON 🟢" : "OFF 🔴"}`
    );
  },

  // Auto react system
  onChat: async ({ api, event, threadsData }) => {
    try {

      if (!event.messageID) return;

      const threadID = event.threadID;

      const data = await threadsData.get(threadID, "data") || {};

      if (data.autoreact === false) return;

      const res = await axios.get(
        "https://raw.githubusercontent.com/MR-TARIF-BOT-X404/T4R1F/main/autoreact-api.json"
      );

      const emojis = res.data.emojis;

      if (!emojis || emojis.length === 0) return;

      const randomEmoji =
        emojis[Math.floor(Math.random() * emojis.length)];

      api.setMessageReaction(
        randomEmoji,
        event.messageID,
        () => {},
        true
      );

    } catch (error) {
      console.log("Autoreact error:", error.message);
    }
  }
};
