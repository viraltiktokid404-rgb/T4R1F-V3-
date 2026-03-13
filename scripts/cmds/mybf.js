const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BACKGROUND_URL = "https://i.ibb.co/gZ2QxsF0/626810706-882427917941160-3689579520415738872-n-jpg.jpg";

module.exports = {
  config: {
    name: "mybf",
    version: "4.0",
    author: "AHMED TARIF",
    countDown: 5,
    role: 0,
    shortDescription: "Love Couple Image",
    category: "love",
    guide: "{pn} @tag [number]"
  },

  onStart: async ({ api, event, message, usersData, args }) => {
    try {
      const senderID = event.senderID;

      // 🔹 Target Check
      const targetID =
        event.messageReply?.senderID ||
        Object.keys(event.mentions || {})[0];

      if (!targetID)
        return message.reply("❌ Reply or mention someone");

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // 🔹 Canvas Setup
      const width = 1070;
      const height = 600;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // 🔹 Load Background
      const bgData = await axios.get(BACKGROUND_URL, {
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

      const avatarSender = await loadAvatar(senderID);
      const avatarTarget = await loadAvatar(targetID);

      // 🔹 Position System
      const size = 147;
      const centerX = width / 2 - 99;
      const centerY = height / 1 - 285;

      const drawCircle = (img, x, y) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x - size, y - size, size * 2, size * 2);
        ctx.restore();
      };

      // ✅ FIXED POSITION
      // Mention / Reply user → LEFT
      drawCircle(avatarTarget, centerX - 177, centerY);

      // Command user → RIGHT
      drawCircle(avatarSender, centerX + 372, centerY);

      // 🔹 Save File
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
