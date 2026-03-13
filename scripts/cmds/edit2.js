const axios = require("axios");
const fs = require("fs");
const path = require("path");

const noobcore =
  "https://raw.githubusercontent.com/noobcore404/NC-STORE/main/NCApiUrl.json";

async function getRenzApi() {
  const { data } = await axios.get(noobcore, { timeout: 10000 });
  if (!data?.renz) throw new Error("Renz API not found");
  return data.renz;
}

module.exports = {
  config: {
    name: "edit2",
    aliases: ["nanobanana"],
    version: "1.2",
    author: "AHMED TARIF",
    countDown: 5,
    role: 0,
    noprefix: true,
    shortDescription: "Generate/Edit2 image with prompt",
    category: "Image",
    guide: "{pn} <prompt> | reply image + {pn} <prompt>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const prompt = args.join(" ").trim();

    if (!prompt)
      return api.sendMessage(
        "❌ Prompt dao.\nExample:\n!edit a cyberpunk city\n(replied photo) !edit make it anime",
        threadID,
        messageID
      );

    const react = async (emoji) => {
      try {
        await api.setMessageReaction(emoji, messageID, () => {}, true);
      } catch (_) {}
    };

    let tempFile = "";

    try {
      await react("⏳");

      const base = await getRenzApi();

      const att = messageReply?.attachments?.[0];
      const isPhoto = att?.type === "photo";

      const width = att?.width || 512;
      const height = att?.height || 512;

      const apiURL =
        `${base}/api/gptimage?prompt=${encodeURIComponent(prompt)}` +
        `&width=${width}&height=${height}` +
        (isPhoto && att?.url ? `&ref=${encodeURIComponent(att.url)}` : "");

      const { data } = await axios.get(apiURL, {
        responseType: "arraybuffer",
        timeout: 180000
      });

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      tempFile = path.join(cacheDir, `${Date.now()}_edit.png`);
      fs.writeFileSync(tempFile, data);

      await react("✅");

      return api.sendMessage(
        {
          body: `${
            isPhoto ? "🖼️• Nano Banana" : "🖼 Generated"
          } successfully.\n📐• Prompt: ${prompt}`,
          attachment: fs.createReadStream(tempFile)
        },
        threadID,
        () => {
          try {
            fs.unlinkSync(tempFile);
          } catch (_) {}
        }
      );
    } catch (e) {
      await react("❌");
      try {
        if (tempFile) fs.unlinkSync(tempFile);
      } catch (_) {}
      return api.sendMessage(
        "❌ Image process failed. Try again later.",
        threadID,
        messageID
      );
    }
  }
};
