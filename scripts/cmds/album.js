const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const ALBUM_JSON = "https://raw.githubusercontent.com/MR-TARIF-BOT-X404/T4R1F/refs/heads/main/album-api.json";
const DIR = path.join(__dirname, "cache", "album");
const DB = path.join(DIR, "album-data.json");
fs.ensureDirSync(DIR);

module.exports = {
  config: {
    name: "album",
    aliases: ["alb"],
    version: "15.0.0",
    author: "AHMED TARIF",
    countDown: 0,
    role: 0,
    noPrefix: true,
    category: "Everyone",
    guide:
      "{p}album\n{p}album video\n{p}album video <cat>\n{p}album image <cat>\n" +
      "{p}album add <cat> <link>\nReply media + {p}album add <cat>\n" +
      "{p}album del <cat>\n{p}album del <cat> <index|link>"
  },

  onStart: async ({ api, event, args }) => {
    const a0 = low(args[0]);

    const remote = await loadRemote();
    const data = await loadAll(remote); // merged

    if (!a0) return menu(api, event, remote); // show API cats only

    // ADD
    if (a0 === "add") {
      const cat = low(args[1]);
      if (!cat) return err(api, event, "Use: album add <cat> <link> OR reply media + album add <cat>");

      let link = String(args[2] || "").trim();
      if (!link) {
        const att = event.messageReply?.attachments?.[0];
        link = att?.url || att?.playableUrl || att?.playable_url || "";
      }
      link = clean(link);
      const ext = extFromUrl(link);
      if (!["mp4", "jpg", "png"].includes(ext)) return err(api, event, "Only mp4/jpg/png allowed!");

      if (!(await addLocal(cat, link))) return err(api, event, "Save failed!");
      return api.sendMessage(
        `⚙ Album Add 👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [✅]➜ Added\n• [📂]➜ ${cap(cat)}\n• [🔗]➜ .${ext}\n━━━━━━━━━━━━`,
        event.threadID,
        event.messageID
      );
    }

    // DELETE
    if (a0 === "del" || a0 === "delete" || a0 === "rm") {
      const cat = low(args[1]);
      if (!cat) return err(api, event, "Use: album del <cat>  OR  album del <cat> <index|link>");

      const key = String(args[2] || "").trim();

      // if only category given -> remove whole local category
      if (!key) {
        const ok = await delLocalCategory(cat);
        if (!ok) return err(api, event, "Local category not found!");
        return api.sendMessage(
          `⚙ Album Delete 👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [✅]➜ Removed Local Category\n• [📂]➜ ${cap(cat)}\n━━━━━━━━━━━━`,
          event.threadID,
          event.messageID
        );
      }

      // delete single item from local by index/link
      const mergedList = (data?.[cat] || []).map(pickUrl).map(clean).filter(Boolean);
      const ok = await delLocalItem(cat, key, mergedList);
      if (!ok) return err(api, event, "Not found / Delete failed!");

      return api.sendMessage(
        `⚙ Album Delete 👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [✅]➜ Deleted Item\n• [📂]➜ ${cap(cat)}\n━━━━━━━━━━━━`,
        event.threadID,
        event.messageID
      );
    }

    // VIDEO
    if (isVid(a0) && !args[1]) return listVideos(api, event, data, null, 1);          // all cats
    if (isVid(a0) && args[1]) return listVideos(api, event, data, low(args[1]), 1);   // one cat

    // IMAGE RANDOM (cat)
    if (isImg(a0)) return sendRand(api, event, data, low(args[1]), "image");

    // RANDOM ANY (cat)
    return sendRand(api, event, data, low(args[0]), "any");
  },

  onReply: async ({ api, event, Reply }) => {
    if (!Reply?.type) return;
    if (event.senderID !== Reply.author) return err(api, event, "This menu/list is not for you.\nType: album");

    const body = String(event.body || "").trim().toLowerCase();

    // category menu
    if (Reply.type === "alb_menu") {
      const n = parseInt(body, 10);
      if (!n || n < 1 || n > Reply.cats.length) return err(api, event, `Reply 1-${Reply.cats.length}`);

      const remote = await loadRemote();
      const data = await loadAll(remote);
      const cat = low(Reply.cats[n - 1]);

      cleanReply(Reply);
      await api.unsendMessage(Reply.messageID).catch(() => {});
      return sendRand(api, event, data, cat, "any");
    }

    // video list picker
    if (Reply.type === "alb_vlist") {
      const remote = await loadRemote();
      const data = await loadAll(remote);

      if (body === "n" || body === "next") {
        cleanReply(Reply);
        await api.unsendMessage(Reply.messageID).catch(() => {});
        return listVideos(api, event, data, Reply.cat, Reply.page + 1);
      }
      if (body === "p" || body === "prev") {
        cleanReply(Reply);
        await api.unsendMessage(Reply.messageID).catch(() => {});
        return listVideos(api, event, data, Reply.cat, Math.max(1, Reply.page - 1));
      }

      const idx = parseInt(body, 10);
      if (!idx || idx < 1 || idx > Reply.items.length) return err(api, event, `Reply 1-${Reply.items.length} or N/P`);

      const pick = Reply.items[idx - 1];
      cleanReply(Reply);
      await api.unsendMessage(Reply.messageID).catch(() => {});

      const file = await dl(pick.url).catch(() => null);
      if (!file) return err(api, event, "Failed to fetch video!");

      const msg =
        `⚙ Album ( ${pick.catLabel} )👨🏿‍🌾\n━━━━━━━━━━━━\n\n` +
        `• [✅]➜ Video Sent\n• [📂]➜ Category : ${pick.catLabel}\n• [📦]➜ Total Video : ${pick.total}\n━━━━━━━━━━━━`;

      try {
        await api.sendMessage({ body: msg, attachment: fs.createReadStream(file) }, event.threadID, event.messageID);
      } finally {
        setTimeout(() => fs.remove(file).catch(() => {}), 7000);
      }
    }
  }
};

/* ---------- UI: menu (API cats only) ---------- */
function menu(api, event, remote) {
  const cats = Object.keys(remote || {}).filter((k) => Array.isArray(remote[k]));
  if (!cats.length) return err(api, event, "No API categories found!");
  const show = cats.slice(0, 50);
  const msg =
    `⚙ List (Album )👨🏿‍🌾\n━━━━━━━━━━━━\n\n` +
    show.map((c, i) => `• [${i + 1}]➜ ${c}`).join("\n") +
    `\n\n━━━━━━━━━━━━\n• Reply 1-${show.length}`;
  return api.sendMessage(msg, event.threadID, (e, info) => {
    if (e || !info?.messageID) return;
    global.GoatBot.onReply.set(info.messageID, {
      type: "alb_menu",
      commandName: module.exports.config.name,
      author: event.senderID,
      messageID: info.messageID,
      cats: show
    });
  }, event.messageID);
}

/* ---------- RANDOM (shows total incl. old added) ---------- */
async function sendRand(api, event, data, cat, mode) {
  cat = low(cat);
  const arr = Array.isArray(data?.[cat]) ? data[cat] : [];
  if (!arr.length) return err(api, event, `No items for: ${cat}`);

  const urls = arr.map(pickUrl).map(clean).filter(Boolean);
  const vids = uniq(urls.filter((u) => extFromUrl(u) === "mp4"));
  const imgs = uniq(urls.filter((u) => ["jpg", "png"].includes(extFromUrl(u))));

  const list = mode === "video" ? vids : mode === "image" ? imgs : [...vids, ...imgs];
  if (!list.length) return err(api, event, `No ${mode} found for: ${cat}`);

  const url = list[(Math.random() * list.length) | 0];
  const file = await dl(url).catch(() => null);
  if (!file) return err(api, event, "Failed to fetch media!");

  const totalLine =
    mode === "video"
      ? `• [📦]➜ Total Video : ${vids.length}\n`
      : mode === "image"
      ? `• [📦]➜ Total Image : ${imgs.length}\n`
      : `• [📦]➜ Total : ${vids.length} Video / ${imgs.length} Image\n`;

  const label = mode === "video" ? "Video" : mode === "image" ? "Image" : "Media";
  const msg =
    `⚙ Album ( ${cap(cat)} )👨🏿‍🌾\n━━━━━━━━━━━━\n\n` +
    `• [✅]➜ Random ${label} Sent\n• [📂]➜ Category : ${cap(cat)}\n` +
    totalLine +
    `━━━━━━━━━━━━`;

  try {
    await api.sendMessage({ body: msg, attachment: fs.createReadStream(file) }, event.threadID, event.messageID);
  } finally {
    setTimeout(() => fs.remove(file).catch(() => {}), 7000);
  }
}

/* ---------- VIDEO LIST (API+old added merged) ---------- */
async function listVideos(api, event, data, cat, page) {
  const items = buildVideos(data, cat); // already merged
  if (!items.length) return err(api, event, cat ? `No video in: ${cat}` : "No videos found!");

  const per = 15;
  const tp = Math.max(1, Math.ceil(items.length / per));
  page = Math.max(1, Math.min(tp, page));
  const slice = items.slice((page - 1) * per, (page - 1) * per + per).map((x) => ({ ...x, total: items.length }));

  const head = cat ? `Category : ${cap(cat)}` : "All Categories";
  const msg =
    `⚙ Album VIDEO List 👨🏿‍🌾\n━━━━━━━━━━━━\n\n` +
    `• [📂]➜ ${head}\n• [📦]➜ Total Video : ${items.length}\n• [📄]➜ Page : ${page}/${tp}\n\n` +
    slice.map((x, i) => `• [${i + 1}]➜ ${x.catLabel}`).join("\n") +
    `\n\n━━━━━━━━━━━━\n• Reply 1-${slice.length} to send\n• Reply N = Next | P = Prev`;

  return api.sendMessage(msg, event.threadID, (e, info) => {
    if (e || !info?.messageID) return;
    global.GoatBot.onReply.set(info.messageID, {
      type: "alb_vlist",
      commandName: module.exports.config.name,
      author: event.senderID,
      messageID: info.messageID,
      cat: cat || null,
      page,
      items: slice
    });
  }, event.messageID);
}

function buildVideos(data, cat) {
  const out = [];
  const cats = Object.keys(data || {}).filter((k) => Array.isArray(data[k]));
  const target = cat ? [cat] : cats;

  for (const c of target) {
    const arr = Array.isArray(data?.[c]) ? data[c] : [];
    for (const x of arr) {
      const u = clean(pickUrl(x));
      if (extFromUrl(u) !== "mp4") continue;
      out.push({ cat: low(c), catLabel: cap(c), url: u });
    }
  }

  const seen = new Set();
  return out.filter((x) => (seen.has(x.url) ? false : (seen.add(x.url), true)));
}

/* ---------- DATA ---------- */
async function loadRemote() {
  return axios
    .get(ALBUM_JSON, { timeout: 20000 })
    .then((r) => (r.data && typeof r.data === "object" ? r.data : {}))
    .catch(() => ({}));
}

async function loadAll(remote) {
  const local = await fs.readJson(DB).catch(() => ({}));
  const out = { ...remote };

  // merge local into same category
  for (const k of Object.keys(local || {})) {
    const a = Array.isArray(out[k]) ? out[k] : [];
    const b = Array.isArray(local[k]) ? local[k] : [];
    out[k] = uniq([...a, ...b].map(clean).filter(Boolean));
  }
  return out;
}

async function addLocal(cat, link) {
  try {
    const db = await fs.readJson(DB).catch(() => ({}));
    if (!Array.isArray(db[cat])) db[cat] = [];
    db[cat] = uniq([...db[cat], clean(link)].filter(Boolean));
    await fs.writeJson(DB, db, { spaces: 2 });
    return true;
  } catch {
    return false;
  }
}

// remove whole local category
async function delLocalCategory(cat) {
  try {
    const db = await fs.readJson(DB).catch(() => ({}));
    if (!db[cat]) return false;
    delete db[cat];
    await fs.writeJson(DB, db, { spaces: 2 });
    return true;
  } catch {
    return false;
  }
}

// remove one local item by index/link (index uses merged list serial)
async function delLocalItem(cat, key, mergedList) {
  try {
    const db = await fs.readJson(DB).catch(() => ({}));
    if (!Array.isArray(db[cat]) || !db[cat].length) return false;

    let target = "";
    const idx = parseInt(String(key).trim(), 10);
    if (idx && idx >= 1 && idx <= mergedList.length) target = mergedList[idx - 1];
    else target = clean(key);
    if (!target) return false;

    const before = db[cat].length;
    db[cat] = db[cat].filter((u) => clean(u) !== target);
    if (db[cat].length === before) return false;

    await fs.writeJson(DB, db, { spaces: 2 });
    return true;
  } catch {
    return false;
  }
}

/* ---------- DOWNLOAD ---------- */
async function dl(url) {
  url = clean(url);
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 150000,
    maxRedirects: 10,
    validateStatus: (s) => (s >= 200 && s < 300) || s === 206,
    headers: { "User-Agent": "Mozilla/5.0", Accept: "*/*", "Accept-Encoding": "identity", Range: "bytes=0-" }
  });

  const ct = String(res.headers?.["content-type"] || "").toLowerCase();
  if (ct.includes("text/html")) throw new Error("html");

  const ext = extFromCT(ct) || extFromUrl(res.request?.res?.responseUrl || url);
  if (!["mp4", "jpg", "png"].includes(ext)) throw new Error("bad");

  const file = path.join(DIR, `alb_${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`);
  fs.writeFileSync(file, Buffer.from(res.data));
  return file;
}

/* ---------- HELPERS ---------- */
function cleanReply(Reply) { try { global.GoatBot.onReply.delete(Reply.messageID); } catch {} }
function uniq(a) { return [...new Set(a)]; }
function pickUrl(x) { return typeof x === "string" ? x : x?.url || x?.link || x?.media || x?.src || x?.file || ""; }
function clean(s) { return String(s || "").trim(); }
function low(s) { return String(s || "").toLowerCase().trim(); }
function cap(s) { s = String(s || "album"); return s.charAt(0).toUpperCase() + s.slice(1); }
function isVid(s) { return ["video", "vid", "mp4"].includes(low(s)); }
function isImg(s) { return ["image", "img", "pic"].includes(low(s)); }
function extFromCT(ct) { return ct.includes("video/mp4") ? "mp4" : ct.includes("image/jpeg") ? "jpg" : ct.includes("image/png") ? "png" : ""; }
function extFromUrl(u) { const m = String(u || "").toLowerCase().match(/\.(mp4|jpg|jpeg|png)(\?|$)/i); return m ? (m[1] === "jpeg" ? "jpg" : m[1]) : ""; }
function err(api, event, msg) {
  return api.sendMessage(`⚙ Error (Album )👨🏿‍🌾\n━━━━━━━━━━━━\n\n• [⛔]➜ ${msg}\n━━━━━━━━━━━━`, event.threadID, event.messageID);
}
