const axios = require("axios");

const CAPTION_JSON =
  "https://raw.githubusercontent.com/MR-TARIF-BOT-X404/T4R1F/refs/heads/main/caption-api.json";

module.exports = {
  config: {
    name: "caption",
    aliases: ["cap"],
    version: "1.0.0",
    author: "AHMED TARIF",
    countDown: 0,
    role: 0,
    noPrefix: true,
    category: "Everyone",
    guide:
      "{p}caption\n" +
      "{p}caption <category>\n" +
      "{p}caption <category> <count>\n" +
      "Example: {p}caption sad 5"
  },

  onStart: async function ({ api, event, args }) {
    const data = await loadJson();
    if (!data) return sendErr(api, event, "Caption API load failed!");

    // caption => menu
    if (!args[0]) {
      const cats = getCats(data);
      if (!cats.length) return sendErr(api, event, "No caption categories found!");

      const menu =
        `⚙ List (Caption )👨🏿‍🌾\n` +
        `━━━━━━━━━━━━\n\n` +
        `${cats.slice(0, 20).map((c, i) => `• [${i + 1}]➜ ${c}`).join("\n")}\n\n` +
        `━━━━━━━━━━━━\n` +
        `• Reply: 1-${Math.min(20, cats.length)} (Random Caption)`;

      return api.sendMessage(menu, event.threadID, (err, info) => {
        if (err || !info?.messageID) return;

        global.GoatBot.onReply.set(info.messageID, {
          type: "caption_menu",
          commandName: module.exports.config.name,
          author: event.senderID,
          messageID: info.messageID,
          cats
        });
      }, event.messageID);
    }

    // caption <category> [count]
    const cat = norm(args[0]);
    const list = Array.isArray(data?.[cat]) ? data[cat] : [];
    if (!list.length) return sendErr(api, event, `No captions in: ${cat}\nType: caption`);

    const count = clampInt(args[1], 1, 10, 1);
    return sendCaptions(api, event, cat, list, count);
  },

  onReply: async function ({ api, event, Reply }) {
    if (!Reply || Reply.type !== "caption_menu") return;

    if (event.senderID !== Reply.author) {
      return sendErr(api, event, "This menu is not for you.\nType: caption");
    }

    const n = parseInt(String(event.body || "").trim(), 10);
    const max = Math.min(20, Reply.cats.length);
    if (!n || n < 1 || n > max) return sendErr(api, event, `Reply 1-${max}`);

    const data = await loadJson();
    if (!data) return sendErr(api, event, "Caption API load failed!");

    const cat = norm(Reply.cats[n - 1]);
    const list = Array.isArray(data?.[cat]) ? data[cat] : [];

    global.GoatBot.onReply.delete(Reply.messageID);
    await api.unsendMessage(Reply.messageID).catch(() => {});

    if (!list.length) return sendErr(api, event, `No captions in: ${cat}`);

    return sendCaptions(api, event, cat, list, 1);
  }
};

/* ================= SEND ================= */

function sendCaptions(api, event, cat, list, count) {
  const picks = [];
  for (let i = 0; i < count; i++) {
    picks.push(String(list[(Math.random() * list.length) | 0] || "").trim());
  }

  const body =
    `⚙ Caption ( ${cap(cat)} )👨🏿‍🌾\n` +
    `━━━━━━━━━━━━\n\n` +
    `${picks.map((x) => (x.startsWith("•") ? x : `• [📓]➜ ${x}`)).join("\n")}\n\n` +
    `━━━━━━━━━━━━`;

  return api.sendMessage(body, event.threadID, event.messageID);
}

function sendErr(api, event, msg) {
  return api.sendMessage(
    `⚙ Error (Caption )👨🏿‍🌾\n` +
      `━━━━━━━━━━━━\n\n` +
      `• [⛔]➜ ${msg}\n` +
      `━━━━━━━━━━━━`,
    event.threadID,
    event.messageID
  );
}

/* ================= API ================= */

async function loadJson() {
  try {
    const res = await axios.get(CAPTION_JSON, { timeout: 20000 });
    return res.data;
  } catch {
    return null;
  }
}

function getCats(data) {
  if (!data || typeof data !== "object") return [];
  return Object.keys(data).filter((k) => Array.isArray(data[k]));
}

/* ================= utils ================= */
function norm(s) {
  return String(s || "").toLowerCase().trim();
}
function cap(s) {
  s = String(s || "caption");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function clampInt(v, min, max, def) {
  const n = parseInt(String(v || ""), 10);
  if (isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}
