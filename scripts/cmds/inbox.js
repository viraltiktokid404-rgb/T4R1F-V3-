const { GoatWrapper } = require("fca-liane-utils");

module.exports = {
  config: {
    name: "inbox",
    version: "1.0.1",
    author: "AHMED TARIF",
    role: 0,
    noPrefix: true,
    prefixRequired: true,
    premium: true,
    description: "User inbox send",
    category: "Inform",
    guide: { en: "${prefix} mention or reply inbox" }
  },
  onStart: async ({ api, event, usersData }) => {
    const uid = event.messageReply?.senderID || Object.keys(event.mentions)[0] || event.senderID;
    try {
      await api.shareContact("", uid, event.threadID);
      const avtId = event.messageReply?.senderID || event.attachments?.[0]?.target?.id || uid;
      const avt = await usersData.getAvatarUrl(avtId);
      if (!avt) throw new Error("Avatar not found.");
      const attachment = await global.utils.getStreamFromURL(avt);
      if (!attachment) throw new Error("Failed to fetch avatar.");
      await api.sendMessage({ body: "", attachment }, event.threadID);
      await api.sendMessage("✅ Contact shared successfully.", event.threadID, event.messageID);
    } catch (err) { await api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID); }
  }
};
