const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BACKGROUNDS = {
  1: "https://i.ibb.co/ynV5tmPk/626153505-4335042950071820-8831198127462937229-n-jpg.jpg",
  2: "https://i.ibb.co/WrCTr98/632073114-1656473055725971-5675458730305671506-n-jpg.jpg",
  3: "https://i.ibb.co/DHLpPjgH/629885343-938348805215131-2427952345380443549-n-jpg.jpg"
};

module.exports = {
  config: {
    name: "love",
    version: "5.0",
    author: "AHMED TARIF",
    countDown: 5,
    role: 0,
    shortDescription: "Love Couple Image (3 Style)",
    category: "love",
    guide: "{pn} [1-3] @tag or reply"
  },

  onStart: async ({ api, event, message, usersData, args }) => {
    try {
      const senderID = event.senderID;

      const targetID =
        event.messageReply?.senderID ||
        Object.keys(event.mentions || {})[0];

      if (!targetID)
        return message.reply("❌ Reply or mention someone");

      const style = parseInt(args[0]);
      if (!style || style < 1 || style > 3)
        return message.reply("❌ Use: love 1 / love 2 / love 3");

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const width = 1000;
      const height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // 🔥 Load Selected Background
      const bgData = await axios.get(BACKGROUNDS[style], {
        responseType: "arraybuffer"
      });
      const bg = await loadImage(bgData.data);
      ctx.drawImage(bg, 0, 0, width, height);

      // 🔹 Avatar Loader
      const loadAvatar = async (uid) => {
        try {
          const url = await usersData.getAvatarUrl(uid);
          return await loadImage(url);
        } catch {
          return await loadImage(
            `https://graph.facebook.com/${uid}/picture?width=512&height=512`
          );
        }
      };

      const avatar1 = await loadAvatar(senderID);
      const avatar2 = await loadAvatar(targetID);

      let size, pos1X, pos2X, posY;

      // 🔥 STYLE SYSTEM
      if (style === 1) {
        size = 160;
        posY = height / 2 - 20;
        pos1X = width / 2 - 276;
        pos2X = width / 2 + 291;
      }

      if (style === 2) {
        size = 114;
        posY = height / 2;
        pos1X = width / 2 - 210;
        pos2X = width / 2 + 200;
      }

      if (style === 3) {
        size = 143;
        posY = height / 2 - 30;
        pos1X = width / 2 - 235;
        pos2X = width / 2 + 257;
      }

      const drawCircle = (img, x, y) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x - size, y - size, size * 2, size * 2);
        ctx.restore();
      };

      drawCircle(avatar1, pos1X, posY);
      drawCircle(avatar2, pos2X, posY);

      // 🔹 Save
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir))
        fs.mkdirSync(cacheDir, { recursive: true });

      const filePath = path.join(cacheDir, `love_${Date.now()}.png`);
      fs.writeFileSync(filePath, canvas.toBuffer());

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to create image.");
      console.error(err);
    }
  }
};
