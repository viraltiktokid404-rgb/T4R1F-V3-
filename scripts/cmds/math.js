module.exports = {
  config: {
    name: "math",
    aliases: ["mathgame", "mathquiz"],
    version: "1.1",
    author: "AHMED TARIF",
    countDown: 0,
    role: 0,
    nixPrefix: true,
    category: "game",
    guide: "{p}math",
  },

  onStart: async function ({ api, event, usersData }) {
    const playerName = await usersData.getName(event.senderID);

    // generate math
    const ops = ["+", "-", "×", "÷"];
    const op = ops[Math.floor(Math.random() * ops.length)];

    let a = rand(5, 30);
    let b = rand(2, 20);

    // division always integer
    if (op === "÷") {
      const ans = rand(2, 15);
      b = rand(2, 12);
      a = ans * b;
    }

    // no negative
    if (op === "-" && b > a) [a, b] = [b, a];

    const correct = calc(a, b, op);

    const options = makeOptions(correct);
    const correctIndex = options.indexOf(correct); // 0..3
    const correctLetter = ["a", "b", "c", "d"][correctIndex];

    const msg =
      `⚙ 𝗤𝘂𝗶𝘇 ( Math )乄👨🏿‍🌾\n` +
      `━━━━━━━━━━━━\n`+
      `𝐇𝐞𝐲, ${playerName} (乄)👨🏿‍🌾\n`+
      `━━━━━━━━━━━━━━\n ` +
      `` +
      `• [📜]➜ : ${a} ${op} ${b} = ?\n` +
      ` ━━━━━━━━━━━━━━━\n\n` +
      `• [A]➜  ${options[0]}\n` +
      `• [B]➜ ${options[1]}\n` +
      `• [C]➜ ${options[2]}\n` +
      `• [D]➜ ${options[3]}\n` +
      `` +
      ``;

    api.sendMessage(msg, event.threadID, (err, info) => {
      if (err || !info?.messageID) return;

      global.GoatBot.onReply.set(info.messageID, {
        type: "reply",
        commandName: this.config.name,
        author: event.senderID,
        messageID: info.messageID,

        playerName,
        a,
        b,
        op,
        correct,
        correctLetter,
        options,

        attempts: 0,
        maxAttempts: 2,
        rewardCoins: 3000,
        rewardExp: 1000,
      });
    }, event.messageID);
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    if (!Reply || Reply.type !== "reply") return;

    if (event.senderID !== Reply.author) {
      return api.sendMessage("• [🚫]➜  Not your math quiz.", event.threadID, event.messageID);
    }

    // accept A/B/C/D or 1/2/3/4
    let input = String(event.body || "").trim().toLowerCase();
    input = input.replace(/\s+/g, "");
    input = input.replace(/[^a-d1-4]/g, "");

    const numToLetter = { "1": "a", "2": "b", "3": "c", "4": "d" };
    if (numToLetter[input]) input = numToLetter[input];

    // must be a/b/c/d
    if (!["a", "b", "c", "d"].includes(input)) {
      return api.sendMessage(
        `⚙ 𝗤𝘂𝗶𝘇 ( Math )👨🏿‍🌾 \n`+
        `━━━━━━━━━━━━\n\n`+
        `• [⛔]➜ Wor are you! \n`+
        `• [♻]➜ Try Again! Reply A,B,C,D`,
        event.threadID,
        event.messageID
      );
    }

    const isCorrect = input === Reply.correctLetter;

    if (isCorrect) {
      const u = await usersData.get(Reply.author);
      await usersData.set(Reply.author, {
        money: (u?.money || 0) + Reply.rewardCoins,
        exp: (u?.exp || 0) + Reply.rewardExp,
        data: u?.data || {},
      });

      return api.sendMessage(
        `⚙ 𝗤𝘂𝗶𝘇 ( Math )👨🏿‍🌾\n` +
        `━━━━━━━━━━━━\n\n`+
          `• [💲]➜ Balance: +${Reply.rewardCoins}\n` +
          `• [♻️]➜ExP: +${Reply.rewardExp} \n`+
          `• [📝]➜ Solution: ${Reply.a} ${Reply.op} ${Reply.b} = ${Reply.correct}`,
        event.threadID,
        event.messageID
      );
    }

    // wrong
    Reply.attempts = (Reply.attempts || 0) + 1;
    global.GoatBot.onReply.set(Reply.messageID, Reply);

    if (Reply.attempts >= Reply.maxAttempts) {
      return api.sendMessage(
        `⚙ 𝗤𝘂𝗶𝘇 ( Math )👨🏿‍🌾\n` +
        `━━━━━━━━━━━━\n\n`+
        `• [🚩]➜ Game Over!\n`+
        `• [⛔]➜ ❌ Wrong!\n`+
        `• [🧏‍♂️]➜ ✅ Answer: ${Reply.a} ${Reply.op} ${Reply.b} = ${Reply.correct}`,
        event.threadID,
        event.messageID
      );
    }

    return api.sendMessage(
      `⚙ 𝗤𝘂𝗶𝘇 ( Math )👨🏿‍🌾\n` +
      `━━━━━━━━━━━━\n\n`+
      `• [❌]➜ Wrong! Attempts left: ${Reply.maxAttempts - Reply.attempts}\n`+
       `• [♻️]➜ Reply again!?`,
      event.threadID,
      event.messageID
    );
  },
};

// helpers
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calc(a, b, op) {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "×") return a * b;
  if (op === "÷") return a / b; // always integer by design
  return 0;
}

function makeOptions(correct) {
  const set = new Set([correct]);

  while (set.size < 4) {
    const delta = rand(1, 8);
    const sign = Math.random() < 0.5 ? -1 : 1;
    const v = correct + sign * delta;
    if (v >= 0) set.add(v);
  }

  const arr = [...set];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
