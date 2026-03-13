const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "love4",
    version: "2.0",
    author: "AHMED TARIF",
    role: 0,
    description: "",
    category: "love",
    guide: ""
  },

  onStart: async ({ api, event, message, usersData }) => {

    if (!event.messageReply?.senderID)
      return message.reply("❌ Reply to someone to kiss 😘");

    const uid1 = event.senderID;
    const uid2 = event.messageReply.senderID;

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const size = 500;
      const canvas = createCanvas(size * 2 + 100, size + 150);
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const avatar1 = await loadImage(
        await usersData.getAvatarUrl(uid1).catch(() =>
          `https://graph.facebook.com/${uid1}/picture?width=512&height=512`
        )
      );

      const avatar2 = await loadImage(
        await usersData.getAvatarUrl(uid2).catch(() =>
          `https://graph.facebook.com/${uid2}/picture?width=512&height=512`
        )
      );

      // Draw circles
      const drawCircle = (img, x) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, size / 2 + 50, 200, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x - 200, size / 2 - 150, 400, 400);
        ctx.restore();
      };

      drawCircle(avatar1, 250);
      drawCircle(avatar2, 750);

      // Text
      ctx.fillStyle = "#ff4d6d";
      ctx.font = "bold 50px Sans";
      ctx.textAlign = "center";
      ctx.fillText("LOVE ❤️", canvas.width / 2, 60);

      ctx.font = "30px Sans";
      ctx.fillText(
        `${await usersData.getName(uid1)} 💋 ${await usersData.getName(uid2)}`,
        canvas.width / 2,
        canvas.height - 40
      );

      const filePath = path.join(__dirname, "cache", `kiss_${Date.now()}.png`);
      if (!fs.existsSync(path.dirname(filePath)))
        fs.mkdirSync(path.dirname(filePath));

      fs.writeFileSync(filePath, canvas.toBuffer());

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to create kiss image.");
    }
  }
};
