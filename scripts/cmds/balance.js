module.exports = {
  config: {
    name: "balance",
    aliases: ["bal"],
    author: "AHMED TARIF",
    role: 0,
    prefixRequired: true,
    premium: true,
    description: "Balance, top, send, set",
    category: "game",
    guide: { en: "!bal | !bal top | !bal send @user 500 | !bal set @user 1000" }
  },

  onStart: async ({ message, event, usersData, args, role }) => {
    // font (short)
    const map = {a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳",A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙"," ":" "};
    const font = (t="Unknown") => t.split("").map(c => map[c] || c).join("");

    const format = (n) =>
      n >= 1e12 ? (n/1e12).toFixed(2)+"𝐓" :
      n >= 1e9  ? (n/1e9 ).toFixed(2)+"𝐁" :
      n >= 1e6  ? (n/1e6 ).toFixed(2)+"𝐌" :
      n >= 1e3  ? (n/1e3 ).toFixed(2)+"𝐊" :
      String(Number(n) || 0);

    const isValid = (x) => Number.isFinite(Number(x)) && Number(x) > 0;
    const moneyOf = (u) => Number(u?.money) || 0;

    const adminIDs = new Set(["61552422054139"]);
    const isAdmin = role >= 1 || adminIDs.has(event.senderID);

    // top
    if (args[0] === "top") {
      const all = usersData.getAll ? await usersData.getAll() : [];
      if (!all.length) return message.reply("❌ No data!");

      const top = all
        .map(u => ({ name: u.name || "Unknown", money: Number(u.money) || 0 }))
        .sort((a, b) => b.money - a.money)
        .slice(0, 15);

      return message.reply(
        "𝐓𝐨𝐩 𝟏𝟓 𝐑𝐢𝐜𝐡𝐞𝐬𝐭 𝐔𝐬𝐞𝐫𝐬:\n乄━━━━━━━━━━━━乄\n" +
        top.map((u, i) => `${i+1}. ${font(u.name)}: $${format(u.money)}`).join("\n")
      );
    }

    // send
    if (args[0] === "send" || args[0] === "transfer") {
      const mID = Object.keys(event.mentions || {})[0];
      const toID = mID || event.messageReply?.senderID;
      const amount = mID ? args[2] : args[1];

      if (!toID) return message.reply("• 𝐄𝐱𝐚𝐦𝐩𝐥𝐞...\n\n• !bal transfer amount");
      if (toID === event.senderID) return message.reply("❌ Can't send to yourself.");
      if (!isValid(amount)) return message.reply("❌ Invalid amount.");

      const from = await usersData.get(event.senderID);
      const to = await usersData.get(toID);
      if (!from || !to) return message.reply("❌ User data not found!");

      const n = Number(amount), fm = moneyOf(from);
      if (fm < n) return message.reply(`❌ Not enough balance. Yours: $${format(fm)}`);

      await usersData.set(event.senderID, { money: fm - n });
      await usersData.set(toID, { money: moneyOf(to) + n });

      return message.reply(
        `𝐇𝐞𝐲, ${font(to.name)}!👨🏿‍🌾\n\n` +
        `• 𝐁𝐚𝐥𝐚𝐧𝐜𝐞 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥: $${format(n)}\n` +
        `• 𝐘𝐨𝐮𝐫 𝐜𝐮𝐫𝐫𝐞𝐧𝐭 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐢𝐬: $${format(fm - n)}`
      );
    }

    // set (admin)
    if (args[0] === "set") {
      if (!isAdmin) return message.reply("❌ No permission.");

      const mID = Object.keys(event.mentions || {})[0];
      const targetID = mID || event.messageReply?.senderID;
      const amount = mID ? args[2] : args[1];

      if (!targetID) return message.reply("• 𝐄𝐱𝐚𝐦𝐩𝐥𝐞...\n\n• !bal set amount");
      if (!Number.isFinite(Number(amount)) || Number(amount) < 0) return message.reply("❌ Invalid amount.");

      const target = await usersData.get(targetID);
      if (!target) return message.reply("❌ User data not found!");

      await usersData.set(targetID, { money: Number(amount) });
      return message.reply(`𝐇𝐞𝐲, ${font(target.name)}!👨🏿‍🌾\n\n• S𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥 𝐒𝐄𝐓 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${format(Number(amount))}`);
    }

    // show balance
    let id = event.senderID;
    if (event.messageReply) id = event.messageReply.senderID;
    else if (Object.keys(event.mentions || {}).length) id = Object.keys(event.mentions)[0];

    const u = await usersData.get(id);
    if (!u) return message.reply("❌ User data not found!");

    return message.reply(`𝐇𝐞𝐲, ${font(u.name)}!👨🏿‍🌾\n\n• 𝐘𝐨𝐮𝐫 𝐜𝐮𝐫𝐫𝐞𝐧𝐭 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐢𝐬: $${format(moneyOf(u))}`);
  }
};
