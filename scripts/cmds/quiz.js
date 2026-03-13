const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/MR-TARIF-BOT-X404/T4R1F//refs/heads/main/baseApiUrl.json"
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "1.2",
    author: "AHMED TARIF",
    countDown: 0,
    role: 0,
    noPrefix: true,
    category: "game",
    guide: "{p}quiz\n{p}quiz bn\n{p}quiz en",
  },

  onStart: async function ({ api, event, usersData, args }) {
    const input = (args.join(" ").toLowerCase() || "bn").trim();
    const timeout = 40;

    let category = "bangla";
    if (input === "en" || input === "english") category = "english";
    if (input === "bn" || input === "bangla") category = "bangla";

    try {
      const { data } = await axios.get(
        `${await baseApiUrl()}/quiz?category=${category}&q=random`
      );

      const quizData = data?.question;
      if (!quizData?.question || !quizData?.options) {
        return api.sendMessage(
          "❌ | Quiz API returned invalid data.",
          event.threadID,
          event.messageID
        );
      }

      const { question, correctAnswer, options } = quizData;
      const { a, b, c, d } = options;

      const playerName = await usersData.getName(event.senderID);

      const quizMsg = {
        body:
          `` +
          `Hye, ${playerName} (乄)👨🏿‍🌾\n` +
          `━━━━━━━━━━━━━━\n` +
          `` +
          `• Mode   : ${category.toUpperCase()}\n` +
          `• Time   : ${timeout}s\n\n` +
          `📜| Question:\n\n` +
          `` +
          `• ${question}\n` +
          `━━━━━━━━━━━━━━\n` +
          `• [A]➜ ${a}\n` +
          `• [B]➜ ${b}\n` +
          `• [C]➜ ${c}\n` +
          `• [D]➜ ${d}\n\n` +
          ``,
      };

      api.sendMessage(quizMsg, event.threadID, (err, info) => {
        if (err || !info?.messageID) return;

        global.GoatBot.onReply.set(info.messageID, {
          type: "reply",
          commandName: this.config.name,
          author: event.senderID,
          messageID: info.messageID,
          dataGame: quizData,
          correctAnswer,
          nameUser: playerName,
          attempts: 0,
        });

        setTimeout(() => {
          api.unsendMessage(info.messageID).catch(() => {});
        }, timeout * 1000);
      }, event.messageID);
    } catch (e) {
      console.error("❌ | Quiz error:", e);
      api.sendMessage(
        `❌ | Error: ${String(e?.message || e)}`,
        event.threadID,
        event.messageID
      );
    }
  },

  onReply: async ({ event, api, Reply, usersData }) => {
    if (!Reply || Reply.type !== "reply") return;

    const { correctAnswer, nameUser, author, dataGame } = Reply;

    if (event.senderID !== author) {
      return api.sendMessage(
        "🚫 | This quiz is not for you.\n✅ | Start your own: quiz",
        event.threadID,
        event.messageID
      );
    }

    const maxAttempts = 2;

    if (Reply.attempts >= maxAttempts) {
      await api.unsendMessage(Reply.messageID).catch(() => {});
      return api.sendMessage(
        `𝐇𝐞𝐲, ${nameUser} (乄)👨🏿‍🌾\n` +
          `━━━━━━━━━━━━━━\n\n` +
          `• [📛]➜ Attempts : ${maxAttempts}/${maxAttempts}\n` +
          `• [🧏‍♂️]➜ Correct Answer: ${correctAnswer}`,
        event.threadID,
        event.messageID
      );
    }

    const opts = dataGame?.options || {};
    const optionMap = {
      a: String(opts.a ?? "").trim(),
      b: String(opts.b ?? "").trim(),
      c: String(opts.c ?? "").trim(),
      d: String(opts.d ?? "").trim(),
    };

    let userRaw = String(event.body || "").trim();
    let user = userRaw.toLowerCase();

    // A/B/C/D দিলে option text এ কনভার্ট
    if (["a", "b", "c", "d"].includes(user)) {
      userRaw = optionMap[user] || userRaw;
      user = userRaw.toLowerCase();
    }

    const caRaw = String(correctAnswer || "").trim();
    const caLower = caRaw.toLowerCase();

    const correctTextLower =
      ["a", "b", "c", "d"].includes(caLower)
        ? (optionMap[caLower] || "").toLowerCase()
        : caLower;

    const isCorrect =
      (user && user === correctTextLower) ||
      (["a", "b", "c", "d"].includes(caLower) && user === caLower);

    if (isCorrect) {
      await api.unsendMessage(Reply.messageID).catch(() => {});

      const rewardCoins = 3000;
      const rewardExp = 1000;

      const u = await usersData.get(author);
      await usersData.set(author, {
        money: (u?.money || 0) + rewardCoins,
        exp: (u?.exp || 0) + rewardExp,
        data: u?.data || {},
      });

      return api.sendMessage(
        `𝐇𝐞𝐲, ${nameUser} (乄)👨🏿‍🌾\n` +
          `━━━━━━━━━━━━━━\n\n` +
          `• [🤩]➜ BBY YOU WON!👨🏿‍🌾\n` +
          `` +
          `• [💲]➜ BALANCE: +${rewardCoins}\n` +
          `• [🌡️]➜ EXP: +${rewardExp}\n`,
        event.threadID,
        event.messageID
      );
    }

    // WRONG
    Reply.attempts = (Reply.attempts || 0) + 1;
    global.GoatBot.onReply.set(Reply.messageID, Reply);

    if (Reply.attempts >= maxAttempts) {
      await api.unsendMessage(Reply.messageID).catch(() => {});
      return api.sendMessage(
        `𝐇𝐞𝐲, ${nameUser} (乄)👨🏿‍🌾\n` +
          `━━━━━━━━━━━━━━\n\n` +
          `• [⛔]➜ Attempts : ${maxAttempts}/${maxAttempts}\n` +
          `• [🧏‍♂️]➜ Correct Answer: ${correctAnswer}`,
        event.threadID,
        event.messageID
      );
    }

    return api.sendMessage(
      `𝐇𝐞𝐲, ${nameUser} (乄)👨🏿‍🌾\n` +
        `━━━━━━━━━━━━━━\n\n` +
        `• [⛔]➜ Attempts Left : ${maxAttempts - Reply.attempts}\n` +
        `• [♻]➜ Try Again! Reply`,
      event.threadID,
      event.messageID
    );
  },
};
