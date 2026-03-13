const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "edit",
    version: "1.2",
    author: "AHMED TARIF",
    countDown: 5,
    role: 0,
    noprefix: true,
    shortDescription: "Edit image by prompt",
    category: "Image",
    guide: "{p}edit <prompt> (reply to image)"
  },

  onStart: async ({ api, event, args, message }) => {

    const img = event.messageReply?.attachments?.[0];
    const prompt = args.join(" ").trim();

    if (!img || img.type !== "photo")
      return message.reply("❌ Reply to an image.");

    if (!prompt)
      return message.reply("❌ Give an edit prompt.");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const filePath = path.join(__dirname, "cache", `${Date.now()}.jpg`);

    try {
      const { data: { apiv3 } } = await axios.get(
        "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json"
      );

      const base64 = Buffer.from(
        (await axios.get(img.url, { responseType: "arraybuffer" })).data
      ).toString("base64");

      const res = await axios.post(apiv3, {
        prompt: prompt,
        images: [base64],
        format: "jpg"
      }, { responseType: "arraybuffer", timeout: 180000 });

      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, res.data);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        body: `✅ Image general successfully\n📐Promptn: ${prompt}`,
        attachment: fs.createReadStream(filePath)
      });

    } catch (e) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Edit failed.");
    } finally {
      if (fs.existsSync(filePath)) await fs.remove(filePath);
    }
  }
};
