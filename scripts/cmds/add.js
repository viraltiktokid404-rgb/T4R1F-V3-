module.exports = {
  config: {
    name: "add",
    version: "5.2",
    author: "AHMED TARIF",
    role: 0
    countDown: 5,
    prefixRequired: true,
    premium: true,
    description: "${prefix}add uid or message reply",
    category: "Group",
    guide: { en: "added group!" }
  },

  onStart: async function ({ api, event, args }) {
    const send = m => api.sendMessage(m, event.threadID, event.messageID);
    const uid = args[0] || event.messageReply?.senderID;
    if (!uid) return send("⚠️ Example: /add <uid> or reply to a user's message");

    try {
      const info = await api.getThreadInfo(event.threadID);
      const isBotAdmin = info.adminIDs.some(i => i.id == api.getCurrentUserID());
      if (!isBotAdmin) {
        const link = await api.getThreadInviteLink(event.threadID);
        return send(`⚠️ Bot isn't admin.\n🔗 Invite manually:\n${link}`);
      }

      api.addUserToGroup(uid, event.threadID, err =>
        send(err ? "❌ Can't add user (locked/private/already added)." : `✅ Added user: ${uid}`)
      );
    } catch {
      send("❌\ 𝐚𝐝𝐞𝐝 𝐛𝐨𝐭 𝐠𝐫𝐨𝐮𝐩 𝐚𝐝𝐦𝐢𝐧");
    }
  }
};
