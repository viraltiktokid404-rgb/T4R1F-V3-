global.uptLive = global.uptLive || {};

module.exports = {
  config: {
    name: "upt",
    version: "1.4.0",
    author: "AHMED TARIF",
    role: 0,
    noPrefix: true,
    prefixRequired: true,
    premium: true,
    description: "乄",
    category: "Inform",
    guide: { en: " BOT RUNNING TIME SHOW" }
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    const tid = event.threadID;

    // CLEAR OLD (auto replace)
    if (global.uptLive[tid]) {
      clearInterval(global.uptLive[tid]);
      delete global.uptLive[tid];
    }

    const users = usersData?.getAll ? await usersData.getAll() : [];
    const threads = threadsData?.getAll ? await threadsData.getAll() : [];

    const nodeVersion = process.version;
    const startPing = Date.now();

    const msg = await api.sendMessage("⎙| 𝐔𝐩𝐭𝐢𝐦𝐞...Chaking...", tid);

    global.uptLive[tid] = setInterval(async () => {
      const t = Math.floor(process.uptime());

      const d = Math.floor(t / 86400);
      const h = Math.floor((t % 86400) / 3600);
      const m = Math.floor((t % 3600) / 60);
      const s = t % 60;

      const time = new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });

      const ping = Date.now() - startPing;

      try {
        await api.editMessage(
`𝗧𝗔𝗥𝗜𝗙 𝗕𝗢𝗧 𝗨𝗣𝗧𝗜𝗠𝗘

⎙| 𝐔𝐩𝐭𝐢𝐦𝐞: ${d}𝐝 ${h}𝐡 ${m}𝐦 ${s}𝐬
𓋜| 𝐓𝐢𝐦𝐞: ${time}

⎒| 𝐓𝐨𝐭𝐚𝐥 𝐔𝐬𝐞𝐫𝐬: ${users.length}
⎒| 𝐓𝐨𝐭𝐚𝐥 𝐆𝐫𝐨𝐮𝐩𝐬: ${threads.length}

⎘| 𝐏𝐢𝐧𝐠: ${ping} 𝐦𝐬
⎘| 𝐍𝐨𝐝𝐞.𝐣𝐬: ${nodeVersion}`,
          msg.messageID
        );
      } catch {
        clearInterval(global.uptLive[tid]);
        delete global.uptLive[tid];
      }
    }, 1000);
  }
};
