const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const BACKGROUND =
  "https://i.ibb.co/MyfrVcN2/643769659-1614639136354048-6913948350650064273-n-jpg.jpg";

module.exports = {
  config: {
    name: "fakechate",
    version: "1.4",
    author: "AHMED TARIF",
    countDown: 5,
    role: 0,
    noprefix: true,
    shortDescription: "Fake chat reply user avatar",
    category: "Fun",
    guide: "fake <text> or reply → fake <text>"
  },

  onStart: async ({ api, event, message, usersData, args }) => {
    try {

      const uid = event.messageReply ? event.messageReply.senderID : event.senderID;

      const text = args.join(" ");
      if (!text)
        return message.reply("❌ Enter text\nExample: fake hello baby");

      let name = "Facebook User";
      try {
        const info = await api.getUserInfo(uid);
        if (info && info[uid] && info[uid].name)
          name = info[uid].name;
        else
          name = await usersData.getName(uid);
      } catch {
        name = await usersData.getName(uid);
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      // ✅ Smaller Image Size
      const width = 650;
      const height = 240;

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const bg = await loadImage(
        (await axios.get(BACKGROUND, { responseType: "arraybuffer" })).data
      );

      ctx.drawImage(bg, 0, 0, width, height);

      let avatar;
      try {
        avatar = await loadImage(await usersData.getAvatarUrl(uid));
      } catch {
        avatar = await loadImage(
          `https://graph.facebook.com/${uid}/picture?width=512&height=512`
        );
      }

      const avatarSize = 55;
      const avatarX = 50;
      const avatarY = height - 70;

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

      const bubbleX = avatarX + 45;
      const bubbleY = avatarY - 45;
      const bubbleWidth = 380;
      const bubbleHeight = 60;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 20);
      ctx.fill();

      ctx.fillStyle = "#555";
      ctx.font = "17px Arial";
      ctx.fillText(name, bubbleX + 15, bubbleY + 20);

      ctx.fillStyle = "#000";
      ctx.font = "21px Arial";
      ctx.fillText(text, bubbleX + 15, bubbleY + 45);

      const cacheDir = path.join(__dirname, "cache");

      if (!fs.existsSync(cacheDir))
        fs.mkdirSync(cacheDir, { recursive: true });

      const filePath = path.join(cacheDir, `fake_${Date.now()}.png`);

      fs.writeFileSync(filePath, canvas.toBuffer());

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to create fake chat");
      console.error(err);
    }
  }
};
