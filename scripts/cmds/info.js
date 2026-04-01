const axios = require("axios");

module.exports.config = {
  name: "info",
  version: "8.0.0",
  author: "AHMED TARIF",
  countDown: 3,
  role: 0,
	noPrefix: true,
  category: "Inform"
};

module.exports.onStart = async ({ message }) => {
  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/MR-TARIF-BOT-X404/T4R1F/refs/heads/main/info-api.json");
    if (!data?.infoList?.length) return message.reply("❌ API data invalid!");

    const r = data.infoList[Math.floor(Math.random() * data.infoList.length)];

    const t = process.uptime();
    const upTime = `${Math.floor(t / 3600)}𝐡${Math.floor((t % 3600) / 60)}𝐦 ${Math.floor(t % 60)}𝐬`;

    const prefix = global.GoatBot.config.prefix || ".";
    const botName = global.GoatBot.config.nickNameBot || "TARIF BOT";

    const msg = `
        〔 BOT OWNER INFORM 〕

𝘕𝘢𝘮𝘦: ${r.name || "N/A"}
𝘈𝘨𝘦: ${r.age || "N/A"}
𝘚𝘵𝘢𝘵𝘶𝘴: ${r.status || "N/A"}

🌐 Social
𝘛𝘦𝘭𝘦𝘨𝘳𝘢𝘮: ${r.telegram || "N/A"}
𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱: ${r.number || "N/A"}
𝘍𝘢𝘤𝘦𝘣𝘰𝘰𝘬: ${r.facebook || "N/A"}
𝘐𝘯𝘴𝘵𝘢𝘨𝘳𝘢𝘮: ${r.instagram || "N/A"}

Role   : ${r.role || "User"}

──────────────

𝘉𝘰𝘵𝘕𝘪𝘤𝘬: ${botName}
𝘗𝘳𝘦𝘧𝘪𝘹: ${prefix}
𝗨𝗣𝗧𝗜𝗠𝗘: ${upTime}

         〔 SISTER TARIF 〕
`;

    return r.img
      ? message.reply({
          body: msg,
          attachment: await global.utils.getStreamFromURL(r.img)
        })
      : message.reply(msg);

  } catch {
    return message.reply("❌ API load fail!");
  }
};
