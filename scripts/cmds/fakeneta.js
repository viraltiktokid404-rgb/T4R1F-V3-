const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BACKGROUND =
  "https://i.ibb.co/TBtNGzDR/627966333-1776143863057113-269067950905512530-n-jpg.jpg";

module.exports = {
  config: {
    name: "fakeneta",
    version: "1.3",
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

      // load background with original size
      const bgBuffer = (await axios.get(BACKGROUND, {
        responseType: "arraybuffer"
      })).data;

      const bg = await loadImage(bgBuffer);

      const width = bg.width;
      const height = bg.height;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, width, height);

      // avatar load
      let avatar;
      try {
        avatar = await loadImage(await usersData.getAvatarUrl(uid));
      } catch {
        avatar = await loadImage(
          `https://graph.facebook.com/${uid}/picture?width=512&height=512`
        );
      }

      // ✅ smaller avatar size
      const avatarSize = 64;

      // ✅ move more up
      const avatarX = width / 2;
      const avatarY = height - 215;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarSize / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(
        avatar,
        avatarX - avatarSize / 2,
        avatarY - avatarSize / 2,
        avatarSize,
        avatarSize
      );

      ctx.restore();

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
