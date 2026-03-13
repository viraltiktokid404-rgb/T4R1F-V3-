const axios = require("axios");
const FormData = require("form-data");

module.exports.config = {
  name: "imgbb",
  aliases: ["ibb","uploadimg","i"],
  version: "1.0.0",
  author: "Nazrul",
  role: 0,
  category: "Inform",
  noPrefix: true,
  requiredMoney: 500,
  description: "Upload attachment to ImgBB",
  countdown: 5,
  guide: { en: "Reply to attachment or provide URL" }
};

const IMGBB_API_KEY = "6526a402abe857c148c52df44c76d3cc";

module.exports.onStart = async ({ event, message, args }) => {
  try {
    const replyUrl = event.messageReply?.attachments?.[0]?.url;
    const urls = [...(replyUrl ? [replyUrl] : []), ...args];
    if (!urls.length) return message.reply("❌ Reply to an attachment or provide URLs!");

    const detectType = (url, filename) => {
      const ext = (filename || url.split("/").pop()).split(".").pop().toLowerCase();
      if (["jpg","jpeg","png","gif","webp","bmp"].includes(ext)) return "Image";
      if (["mp4","mov","mkv","webm"].includes(ext)) return "Video";
      if (["mp3","wav","ogg","m4a"].includes(ext)) return "Audio";
      return "File";
    };

    message.reaction("⏳", event.messageID, event.threadID); 

    const results = [];
    for (const url of urls) {
      const { data: fileData } = await axios.get(url, { responseType: "arraybuffer" });
      const form = new FormData();
      form.append("image", Buffer.from(fileData, "binary").toString("base64"));
      const filename = url.split("/").pop().split("?")[0] || "file";

      const res = await axios.post(
        "https://api.imgbb.com/1/upload",
        form,
        {
          params: { key: IMGBB_API_KEY, name: filename },
          headers: form.getHeaders()
        }
      );

      results.push(`${res.data.data.url}`);
    }

    message.reaction("✅", event.messageID, event.threadID); 
    message.reply(results.join("\n"));
  } catch (err) {
    console.error(err);
    message.reply("❌ Failed to upload.");
    message.reaction("❌", event.messageID, event.threadID);
  }
};
