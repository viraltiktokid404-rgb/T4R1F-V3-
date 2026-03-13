const axios = require("axios");

const FONT_JSON_URL =
"https://raw.githubusercontent.com/MR-TARIF-BOT-X404/T4R1F/refs/heads/main/font-api.json";

// Load font JSON
async function loadFonts() {
  try {
    const res = await axios.get(FONT_JSON_URL, { timeout: 10000 });
    return res.data.fonts || res.data;
  } catch (e) {
    return null;
  }
}

module.exports = {
  config: {
    name: "font",
    aliases: ["style"],
    version: "6.0",
    author: "TARIF AHMED",
    countDown: 0,
    role: 0,
    category: "Everyone",
    guide: {
      en:
`font list
font <style> <text>

Example:
font 1 TARIF

Reply system:
Reply: font 1`
    }
  },

  onStart: async function ({ api, event, args }) {

    const fonts = await loadFonts();

    if (!fonts)
      return api.sendMessage(
        "❌ Font API load failed.",
        event.threadID,
        event.messageID
      );


    // LIST
    if (!args[0] || args[0].toLowerCase() === "list") {

      let msg = "📒 FONT STYLE LIST\n━━━━━━━━━━━━━━\n";

      fonts.forEach(f => {

        const preview = "TARIF"
          .split("")
          .map(c => f.map[c] || c)
          .join("");

        msg += `Style ${f.name} ➜ ${preview}\n`;

      });

      return api.sendMessage(msg, event.threadID, event.messageID);
    }


    const style = args[0];

    // reply text support
    let text = args.slice(1).join(" ");

    if (!text && event.type === "message_reply") {
      text = event.messageReply.body;
    }

    if (!text)
      return api.sendMessage(
        "📒 FONT STYLE\n━━━━━━━━━━━\n⚠️ Enter text or reply to message\n\nExample: font [1/10] TARIF",
        event.threadID,
        event.messageID
      );


    const font = fonts.find(f => f.name == style);

    if (!font)
      return api.sendMessage(
        "❌ Invalid style\nUse: font list",
        event.threadID,
        event.messageID
      );


    const result = text
      .split("")
      .map(c => font.map[c] || c)
      .join("");


    return api.sendMessage(
      result,
      event.threadID,
      event.messageID
    );
  }
};
