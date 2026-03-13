const f = (n) => {
  n = Number(n) || 0;
  const sign = n < 0 ? "-" : "";
  n = Math.abs(n);

  const fmt = (v, s) => {
    const out = v.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
    return sign + out + s;
  };

  return n >= 1e12 ? fmt(n / 1e12, "𝐓")
    : n >= 1e9  ? fmt(n / 1e9,  "𝐁")
    : n >= 1e6  ? fmt(n / 1e6,  "𝐌")
    : n >= 1e3  ? fmt(n / 1e3,  "𝐊")
    : sign + String(n);
};

const toInt = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.floor(n) : d;
};

module.exports = {
  config: {
    name: "slot",
    version: "1.7",
    author: "AHMED TARIF",
    countDown: 0,
    shortDescription: { en: "𝐒𝐥𝐨𝐭 𝐆𝐚𝐦𝐞" },
    longDescription: { en: "𝐒𝐥𝐨𝐭 𝐆𝐚𝐦𝐞 (𝟐𝟎 𝐩𝐥𝐚𝐲𝐬 / 𝟏𝟎 𝐡𝐨𝐮𝐫𝐬 𝐥𝐢𝐦𝐢𝐭)" },
    category: "game",
    guide: { en: "{p}slot <amount>" }
  },

  langs: {
    en: {
      invalid_amount: "❌ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 𝐚𝐦𝐨𝐮𝐧𝐭.",
      not_enough_money: "❌ 𝐘𝐨𝐮 𝐝𝐨𝐧'𝐭 𝐡𝐚𝐯𝐞 𝐞𝐧𝐨𝐮𝐠𝐡 𝐛𝐚𝐥𝐚𝐧𝐜𝐞.",
      cooldown_active: "⏳ 𝐋𝐢𝐦𝐢𝐭 𝐟𝐢𝐧𝐢𝐬𝐡𝐞𝐝! 𝐓𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐚𝐟𝐭𝐞𝐫 %1𝐡 %2𝐦.",

      // ✅ 20 spin er moddhe koybar win hoyeche
      status_line: "• 𝐖𝐢𝐧 𝐑𝐚𝐭𝐞 𝐓𝐨𝐝𝐚𝐲: (%1/%3)",

      win_message: "• 𝐁𝐚𝐛𝐲, 𝐲𝐨𝐮 𝐰𝐨𝐧 $%1",
      lose_message: "• 𝐁𝐚𝐛𝐲, 𝐲𝐨𝐮 𝐥𝐨𝐬𝐭 $%1",
      jackpot_message: "🎉 𝐉𝐚𝐜𝐤𝐩𝐨𝐭! 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1 𝐟𝐨𝐫 𝐭𝐡𝐫𝐞𝐞 %2 𝐬𝐲𝐦𝐛𝐨𝐥𝐬 😻",
      results: "• 𝐆𝐚𝐦𝐞 𝐑𝐞𝐬𝐮𝐥𝐭𝐬: %1"
    }
  },

  onStart: async function ({ args, message, event, usersData, getLang }) {
    const senderID = event.senderID;
    const userData = await usersData.get(senderID);
    const balance = Number(userData.money || 0);

    const bet = Number(args[0]);
    if (!Number.isFinite(bet) || bet <= 0) return message.reply(getLang("invalid_amount"));
    if (bet > balance) return message.reply(getLang("not_enough_money"));

    const now = Date.now();
    const LIMIT = 20;
    const COOLDOWN = 10 * 60 * 60 * 1000;

    const data = userData.data || {};
    data.slotCooldown = data.slotCooldown || { used: 0, start: now };
    data.slotStats = data.slotStats || { won: 0 };

    const slotCooldown = data.slotCooldown;
    const slotStats = data.slotStats;

    // ✅ NaN fix: data file e jodi string/undefined thake
    slotCooldown.used = toInt(slotCooldown.used, 0);
    slotCooldown.start = toInt(slotCooldown.start, now);
    slotStats.won = toInt(slotStats.won, 0);

    // ✅ reset window
    if (!slotCooldown.start || now - slotCooldown.start >= COOLDOWN) {
      slotCooldown.used = 0;
      slotCooldown.start = now;
      slotStats.won = 0;
    }

    // ✅ cooldown check
    if (slotCooldown.used >= LIMIT) {
      const leftMs = COOLDOWN - (now - slotCooldown.start);
      const h = Math.max(0, Math.floor(leftMs / 3600000));
      const m = Math.max(0, Math.floor((leftMs % 3600000) / 60000));
      return message.reply(getLang("cooldown_active", h, m));
    }

    // ✅ consume spin
    slotCooldown.used += 1;

    // ✅ symbols
    const slots = ["💚", "💛", "💙", "💛", "💚", "💙", "💙", "💛", "💚"];
    const s1 = slots[Math.floor(Math.random() * slots.length)];
    const s2 = slots[Math.floor(Math.random() * slots.length)];
    const s3 = slots[Math.floor(Math.random() * slots.length)];

    // ✅ winnings (profit/loss)
    const winnings = calculateWinnings(s1, s2, s3, bet);

    // ✅ won counter only when win
    if (winnings > 0) slotStats.won += 1;

    // ✅ save
    data.slotCooldown = slotCooldown;
    data.slotStats = slotStats;

    await usersData.set(senderID, {
      money: balance + winnings,
      data
    });

    const line = `[ ${s1} | ${s2} | ${s3} ]`;
    const resultText = getSpinResultMessage(s1, s2, s3, winnings, getLang);

    // ✅ status: won/20 + used/20
    return message.reply(
      `${resultText}\n${getLang("results", line)}\n${getLang(
        "status_line",
        slotStats.won,
        LIMIT,
        slotCooldown.used
      )}`
    );
  }
};

function calculateWinnings(a, b, c, betAmount) {
  if (a === "💚" && b === "💚" && c === "💚") return betAmount * 20;
  if (a === "💛" && b === "💛" && c === "💛") return betAmount * 15;
  if (a === "💙" && b === "💙" && c === "💙") return betAmount * 25;
  if (a === b && b === c) return betAmount * 10;
  if (a === b || a === c || b === c) return betAmount * 5;
  return -betAmount;
}

function getSpinResultMessage(a, b, c, winnings, getLang) {
  if (winnings > 0) {
    if (a === "💙" && b === "💙" && c === "💙") {
      return getLang("jackpot_message", f(winnings), "💙");
    }
    return getLang("win_message", f(winnings));
  }
  return getLang("lose_message", f(-winnings));
}
