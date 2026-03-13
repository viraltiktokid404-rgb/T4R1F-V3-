const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const BACKGROUND_URL = "https://i.ibb.co/DH3pXwC9/627968644-1530813104653431-8834735240829746614-n-png.png";

module.exports = {
  config: {
    name: "pair",
    version: "4.2",
    author: "AHMED TARIF",
    countDown: 5,
    role: 0,
    shortDescription: "Love Couple Image",
    category: "love",
    guide: "{pn} @tag"
  },

  onStart: async ({ api, event, message, usersData }) => {
    try {

      const senderID = event.senderID;
      let targetID =
        event.messageReply?.senderID ||
        Object.keys(event.mentions || {})[0];

      // AUTO RANDOM USER FROM GROUP
      if (!targetID) {
        const threadInfo = await api.getThreadInfo(event.threadID);
        const members = threadInfo.participantIDs.filter(id => id != senderID);
        targetID = members[Math.floor(Math.random() * members.length)];
      }

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const bg = await loadImage(BACKGROUND_URL);
      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0);

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

      const size = 88;

      const avatar1X = bg.width - 330;
      const avatar1Y = 125;

      const avatar2X = bg.width - 129;
      const avatar2Y = 274;

      const drawCircle = (img, x, y) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x - size, y - size, size * 2, size * 2);
        ctx.restore();
      };

      drawCircle(avatar1, avatar1X, avatar1Y);
      drawCircle(avatar2, avatar2X, avatar2Y);

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir))
        fs.mkdirSync(cacheDir, { recursive: true });

      const filePath = path.join(cacheDir, `pair_${Date.now()}.png`);
      fs.writeFileSync(filePath, canvas.toBuffer());

      const name1 = await usersData.getName(senderID);
      const name2 = await usersData.getName(targetID);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        body: `• 𝐂𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐢𝐨𝐧! 👨🏿‍🌾\n━━━━━━━━━━\n° ${name1}\n• ${name2}`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to create image.");
    }
  }
};
