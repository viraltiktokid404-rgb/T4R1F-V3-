const axios = require("axios");

const QUIZ_JSON =
  "https://raw.githubusercontent.com/MR-TARIF-BOT-X404/T4R1F/refs/heads/main/quiz2-api.json";

module.exports = {
  config: {
    name: "quiz2",
    aliases: ["qz2"],
    version: "2.0.0",
    author: "AHMED TARIF",
    countDown: 0,
    role: 0,
    noPrefix: true,
    category: "game",
    guide:
      "{p}quiz2 (menu)\n" +
      "{p}quiz2 <category>\n" +
      "{p}quiz2 <category> <timeSec>\n" +
      "Example: {p}quiz2 islamic 40"
  },

  onStart: async function ({ api, event, usersData, args }) {
    const playerName = await usersData.getName(event.senderID).catch(() => "Player");
    const data = await loadJson();

    if (!data) {
      return api.sendMessage(
        `⚙ 𝗤𝘂𝗶𝘇 ( Error )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [⛔]➜ Quiz API load failed!\n━━━━━━━━━━━━`,
        event.threadID,
        event.messageID
      );
    }

    // quiz2 => menu
    if (!args[0]) {
      const cats = getCategories(data);
      if (!cats.length) {
        return api.sendMessage(
          `⚙ 𝗤𝘂𝗶𝘇 ( Menu )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [⛔]➜ No categories found!\n━━━━━━━━━━━━`,
          event.threadID,
          event.messageID
        );
      }

      const menu =
        `⚙ List (Quiz2 )👨🏿‍🌾\n` +
        `━━━━━━━━━━━━\n\n` +
        `${cats.slice(0, 20).map((c, i) => `• [${i + 1}]➜ ${c}`).join("\n")}\n\n` +
        `━━━━━━━━━━━━\n` +
        `• Reply: 1-${Math.min(20, cats.length)} (Start Quiz)`;

      return api.sendMessage(menu, event.threadID, (err, info) => {
        if (err || !info?.messageID) return;

        global.GoatBot.onReply.set(info.messageID, {
          type: "quiz2_menu",
          commandName: module.exports.config.name,
          author: event.senderID,
          messageID: info.messageID,
          cats,
          playerName
        });
      }, event.messageID);
    }

    // quiz2 <category> [time]
    const category = norm(args[0]);
    let timeSec = isNum(args[1]) ? parseInt(args[1], 10) : 40;
    timeSec = clamp(timeSec, 10, 300);

    const q = pickQuestion(data, category);
    if (!q) {
      return api.sendMessage(
        `⚙ 𝗤𝘂𝗶𝘇 ( ${cap(category)} )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [⛔]➜ No questions found!\n• Need: question + 4 options + answer\n━━━━━━━━━━━━`,
        event.threadID,
        event.messageID
      );
    }

    return sendQuiz(api, event, usersData, playerName, category, q, timeSec);
  },

  onReply: async function ({ api, event, usersData, Reply }) {
    if (!Reply) return;

    // menu reply
    if (Reply.type === "quiz2_menu") {
      if (event.senderID !== Reply.author) {
        return api.sendMessage(
          "🚫 | This menu is not for you.\n✅ | Type: quiz2",
          event.threadID,
          event.messageID
        );
      }

      const choice = parseInt(String(event.body || "").trim(), 10);
      const max = Math.min(20, Reply.cats.length);
      if (!choice || choice < 1 || choice > max) {
        return api.sendMessage(`⛔ | Reply 1-${max}`, event.threadID, event.messageID);
      }

      const data = await loadJson();
      if (!data) return api.sendMessage("⛔ | Quiz API load failed!", event.threadID, event.messageID);

      const category = norm(Reply.cats[choice - 1]);
      const q = pickQuestion(data, category);
      if (!q) return api.sendMessage("⛔ | No questions found in this category!", event.threadID, event.messageID);

      global.GoatBot.onReply.delete(Reply.messageID);
      await api.unsendMessage(Reply.messageID).catch(() => {});

      return sendQuiz(api, event, usersData, Reply.playerName || "Player", category, q, 40);
    }

    // question reply
    if (Reply.type === "quiz2_question") {
      if (event.senderID !== Reply.author) {
        return api.sendMessage(
          "🚫 | This quiz is not for you.\n✅ | Start your own: quiz2",
          event.threadID,
          event.messageID
        );
      }

      const close = async () => {
        global.GoatBot.onReply.delete(Reply.messageID);
        await api.unsendMessage(Reply.messageID).catch(() => {});
      };

      // time over
      if (Date.now() > (Reply.expireAt || 0)) {
        await close();
        return api.sendMessage(
          `⚙ 𝗤𝘂𝗶𝘇 ( ${cap(Reply.category)} )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [⏰]➜ Time Over! (${Reply.timeSec}s)\n• [🧏‍♂️]➜ ✅ Answer: ${Reply.correctText}\n━━━━━━━━━━━━`,
          event.threadID,
          event.messageID
        );
      }

      // parse answer
      let raw = String(event.body || "").trim();
      const m = raw.match(/[a-d1-4]/i);
      let input = m ? m[0].toLowerCase() : "";
      input = ({ "1": "a", "2": "b", "3": "c", "4": "d" }[input]) || input;

      if (!["a", "b", "c", "d"].includes(input)) {
        return api.sendMessage(
          `⚙ 𝗤𝘂𝗶𝘇 ( Reply )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [⛔]➜ Invalid reply!\n• [♻]➜ Reply: A/B/C/D\n━━━━━━━━━━━━`,
          event.threadID,
          event.messageID
        );
      }

      // correct
      if (input === Reply.correctLetter) {
        const u = await usersData.get(Reply.author).catch(() => ({}));
        await usersData.set(Reply.author, {
          money: (u?.money || 0) + (Reply.rewardCoins || 0),
          exp: (u?.exp || 0) + (Reply.rewardExp || 0),
          data: u?.data || {}
        });

        await close();
        return api.sendMessage(
          `⚙ 𝗤𝘂𝗶𝘇 ( Win )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [🤩]➜ YOU WON!\n• [💲]➜ +${Reply.rewardCoins} Coins\n• [🌡️]➜ +${Reply.rewardExp} Exp\n• [✅]➜ Answer: ${Reply.correctText}\n━━━━━━━━━━━━`,
          event.threadID,
          event.messageID
        );
      }

      // wrong attempt
      Reply.attempts = (Reply.attempts || 0) + 1;

      if (Reply.attempts >= (Reply.maxAttempts || 2)) {
        await close();
        return api.sendMessage(
          `⚙ 𝗤𝘂𝗶𝘇 ( Lose )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [📛]➜ Attempts: ${Reply.maxAttempts}/${Reply.maxAttempts}\n• [✅]➜ Correct: ${Reply.correctText}\n━━━━━━━━━━━━`,
          event.threadID,
          event.messageID
        );
      }

      global.GoatBot.onReply.set(Reply.messageID, Reply);
      return api.sendMessage(
        `⚙ 𝗤𝘂𝗶𝘇 ( Wrong )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [⛔]➜ Wrong!\n• [♻]➜ Attempts Left: ${(Reply.maxAttempts || 2) - Reply.attempts}\n━━━━━━━━━━━━`,
        event.threadID,
        event.messageID
      );
    }
  }
};

/* ================= send quiz ================= */

async function sendQuiz(api, event, usersData, playerName, category, q, timeSec) {
  const msg =
    `𝐇𝐞𝐲, ${playerName} (乄)👨🏿‍🌾\n` +
    `━━━━━━━━━━━━━━\n` +
    `• Mode : ${cap(category)}\n` +
    `• Time : ${timeSec}s\n\n` +
    `📜| Question:\n\n` +
    `• ${q.question}\n` +
    `━━━━━━━━━━━━━━\n` +
    `• [A]➜ ${q.options[0]}\n` +
    `• [B]➜ ${q.options[1]}\n` +
    `• [C]➜ ${q.options[2]}\n` +
    `• [D]➜ ${q.options[3]}\n\n` +
    `• Reply: A/B/C/D (or 1/2/3/4)`;

  api.sendMessage(msg, event.threadID, (err, info) => {
    if (err || !info?.messageID) return;

    const qid = info.messageID;
    const timeoutMs = timeSec * 1000;
    const expireAt = Date.now() + timeoutMs;

    global.GoatBot.onReply.set(qid, {
      type: "quiz2_question",
      commandName: module.exports.config.name,
      author: event.senderID,
      messageID: qid,
      category,

      question: q.question,
      options: q.options,
      answerIndex: q.answerIndex,
      correctText: q.options[q.answerIndex],
      correctLetter: ["a", "b", "c", "d"][q.answerIndex],

      nameUser: playerName,
      attempts: 0,
      maxAttempts: 2,

      rewardCoins: 3000,
      rewardExp: 1000,

      timeSec,
      expireAt
    });

    // time over => unsend question msg
    setTimeout(async () => {
      const r = global.GoatBot.onReply.get(qid);
      if (!r) return;
      if (Date.now() < r.expireAt) return;

      global.GoatBot.onReply.delete(qid);
      await api.unsendMessage(qid).catch(() => {});
      await api.sendMessage(
        `⚙ 𝗤𝘂𝗶𝘇 ( ${cap(r.category)} )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [⏰]➜ Time Over! (${r.timeSec}s)\n• [✅]➜ Answer: ${r.correctText}\n━━━━━━━━━━━━`,
        event.threadID
      ).catch(() => {});
    }, timeoutMs);
  }, event.messageID);
}

/* ================= JSON helpers ================= */

async function loadJson() {
  try {
    const res = await axios.get(QUIZ_JSON, { timeout: 20000 });
    return res.data;
  } catch {
    return null;
  }
}

function getCategories(data) {
  if (!data || typeof data !== "object") return [];
  return Object.keys(data).filter((k) => Array.isArray(data[k]));
}

function pickQuestion(data, category) {
  const list = Array.isArray(data?.[category]) ? data[category] : [];
  if (!list.length) return null;

  for (let i = 0; i < 25; i++) {
    const raw = list[(Math.random() * list.length) | 0];
    const q = String(raw?.question || "").trim();

    const opts = Array.isArray(raw?.options) ? raw.options.map((x) => String(x).trim()) : [];
    if (!q || opts.length !== 4) continue;

    let idx = parseIndex(raw);
    if (idx < 0 || idx > 3) continue;

    return { question: q, options: opts, answerIndex: idx };
  }
  return null;
}

function parseIndex(raw) {
  // prefer answerIndex
  if (Number.isInteger(raw?.answerIndex)) return raw.answerIndex;

  // or answer like "A"
  const a = String(raw?.answer || "").trim().toLowerCase();
  const map = { a: 0, b: 1, c: 2, d: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
  if (map[a] !== undefined) return map[a];

  return 0;
}

/* ================= utils ================= */

function norm(s) {
  return String(s || "").toLowerCase().trim();
}
function cap(s) {
  s = String(s || "quiz");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function clamp(n, a, b) {
  n = parseInt(n, 10);
  if (isNaN(n)) n = a;
  return Math.max(a, Math.min(b, n));
}
function isNum(s) {
  return /^\d+$/.test(String(s || ""));
}
