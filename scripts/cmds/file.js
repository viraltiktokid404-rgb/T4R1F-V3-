const fs = require('fs');

module.exports = {
  config: {
    name: "file",
    version: "5.1.0",
    author: "AHMED TARIF",
    countDown: 5,
    role: 0,
    noPrefix: true,
    shortDescription: "Send bot script",
    longDescription: "Send bot specified file ",
    category: "Owner",
    guide: "{pn} file name."
  },

  onStart: async function ({ message, args, api, event }) {
    const fileName = args[0];
    const T4R1F = global.GoatBot.config.T4R1F;
 if (!T4R1F.includes(event.senderID)) {
 api.sendMessage("❌ | 𝐎𝐧𝐥𝐲 𝐛𝐨𝐭'𝐬 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫 𝐜𝐚𝐧 𝐮𝐬𝐞 𝐭𝐡𝐞 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 <𝐅𝐈𝐋𝐄>", event.threadID, event.messageID);
 return;
			}
    if (!fileName) {
      return api.sendMessage("👨🏿‍🔧| 𝐏𝐥𝐞𝐚𝐬𝐞 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐟𝐢𝐥𝐞 𝐧𝐚𝐦𝐞?", event.threadID, event.messageID);
    }

    const fileT4R1F = __dirname + `/${fileName}.js`;
    if (!fs.existsSync(fileT4R1F)) {
      return api.sendMessage(`👨🏿‍🔧| File not found: ${fileName}.js`, event.threadID, event.messageID);
    }

    const fileContent = fs.readFileSync(fileT4R1F, 'utf8');
    api.sendMessage({ body: fileContent }, event.threadID);
  }
};
