const axios = require("axios");

module.exports = {
  config: {
    name: "translate",
    aliases: ["trans"],
    version: "1.5",
    role: 0,
    author: "AHMED TARIF",
    noPrefix: true,
    prefixRequired: true,
    premium: true,
    category: "Inform",
    description: {
      vi: "Dịch văn bản sang ngôn ngữ mong muốn",
      en: "Translate text to the desired language"
    }
  },
  langs: {
    vi: { translateTo: "🌐 Dịch từ %1 sang %2" },
    en: { translateTo: "🌐 Translate from %1 to %2" }
  },

  onStart: async ({ message, event, args, threadsData, getLang }) => {
    try {
      const defaultLang = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;
      let content = event.messageReply?.body || event.body || "";
      if (!content) return message.SyntaxError();

      // Detect target language with -> or =>
      let targetLang = args[0] || defaultLang;
      const match = content.match(/(->|=>)\s*([a-zA-Z]{2,3})$/);
      if (match) {
        targetLang = match[2].toLowerCase();
        content = content.slice(0, match.index).trim();
      }

      const { text, lang } = await axios
        .get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(content)}`)
        .then(res => ({ text: res.data[0].map(i => i[0]).join(""), lang: res.data[2] || targetLang }));

      return message.reply(`${text}\n\n${getLang("translateTo", lang, targetLang)}`);
    } catch {
      return message.reply("❌ Error occurred while translating.");
    }
  }
};
