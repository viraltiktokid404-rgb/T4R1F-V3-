const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BACKGROUND =
  "https://i.ibb.co/JR1j7ZMp/626803187-1572829527271290-2872430833280263086-n-jpg.jpg";

module.exports = {
  config: {
    name: "fakenews",
    version: "1.0",
    author: "AHMED TARIF",
    countDown: 5,
    role: 0,
    shortDescription: "Fake news reply user avatar",
    category: "Fun",
    guide: "Reply user → fakenews"
  },

  onStart: async ({ api, event, message, usersData }) => {
    try {

      if (!event.messageReply)
        return message.reply("❌ Reply someone's message");

      const uid = event.messageReply.senderID;

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const width = 1000;
      const height = 900;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // background
      const bg = await loadImage(
        (await axios.get(BACKGROUND, { responseType: "arraybuffer" })).data
      );

      ctx.drawImage(bg, 0, 0, width, height);

      // avatar load
      let avatar;
      try {
        avatar = await loadImage(await usersData.getAvatarUrl(uid));
      } catch {
        avatar = await loadImage(
          `https://graph.facebook.com/${uid}/picture?width=1024&height=1024`
        );
      }

      // ✅ 3:4 portrait size (NOT circle)
      const avatarWidth = 575;
      const avatarHeight = 547;

      // ✅ RIGHT SIDE POSITION
      const avatarX = width - avatarWidth - 1;
      const avatarY = height / 4 - avatarHeight / 2;

      // draw square portrait (no circle)
      ctx.drawImage(
        avatar,
        avatarX,
        avatarY,
        avatarWidth,
        avatarHeight
      );

      // save
      const cacheDir = path.join(__dirname, "cache");

      if (!fs.existsSync(cacheDir))
        fs.mkdirSync(cacheDir, { recursive: true });

      const filePath = path.join(cacheDir, `fakenews_${Date.now()}.png`);

      fs.writeFileSync(filePath, canvas.toBuffer());

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to create fake news image");
      console.error(err);
    }
  }
};
