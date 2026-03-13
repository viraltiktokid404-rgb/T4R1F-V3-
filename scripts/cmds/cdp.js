const axios = require("axios");
 
const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "cdp",
    aliases: ["copuledp"],
    version: "1.7",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    noprefix: true,
    longDescription: "Fetch a random couple DP for nibba and nibbi",
    category: "Image",
    guide: "{pn}"
  },

  onStart: async function ({ message }) {
    try {
        const response = await axios.get(`${await baseApiUrl()}/api/cdp2`, {
        headers: { "author": module.exports.config.author }
      });

      if (response.data.error)
        return message.reply(response.data.error);

      const { male, female } = response.data;
      if (!male || !female)
        return message.reply("Couldn't fetch couple DP. Try again later.");

      const attachments = [
        await global.utils.getStreamFromURL(male),
        await global.utils.getStreamFromURL(female)
      ];

      await message.reply({
        body: "𝐇𝐞𝐫𝐞 𝐢𝐬 𝐲𝐨𝐮𝐫 𝐜𝐝𝐩 <😘",
        attachment: attachments
      });

    } catch (error) {
      console.error(error);
      message.reply("Error fetching couple DP. Please try again later.");
    }
  }
};
