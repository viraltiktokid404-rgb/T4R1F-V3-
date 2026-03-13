module.exports.config = {
  name: "link",
  aliases: ["fblink"],
  author: "AHMED TARIF",
  version: "1.3",
  role: 0,
  noPrefix: true,
  prefixRequired: true,
  premium: true,
  description: { en: "UID বা মেনশন থেকে FB লিঙ্ক দেখাবে" },
  category: "Inform",
  guide: { en: "মেসেজ রিপ্লাই, মেনশন বা UID ব্যবহার করুন।" }
};

module.exports.onStart = async ({ api, event }) => {
  try {
    let id = Object.keys(event.mentions)[0] || event.messageReply?.senderID || event.senderID;
    let user = id;
    try { user = (await api.getUserInfo(id))[id].vanity || id; } catch {}
    await api.sendMessage(`https://facebook.com/${user}`, event.threadID, event.messageID);
  } catch {
    await api.sendMessage("⚠️ সমস্যা হয়েছে। আবার চেষ্টা করুন।", event.threadID, event.messageID);
  }
};
