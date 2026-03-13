const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yt = require("yt-search");

const API = "https://www.noobs-apis.run.place";
const CACHE = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE);

const isYT = (s = "") => /(youtu\.be|youtube\.com)/i.test(s);
const clean = (s = "song2") =>
  (s || "song2")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "song";

const pick = (d) =>
  d?.downloads?.data?.fileUrl ||
  d?.downloads?.data?.url ||
  d?.download_url ||
  d?.link ||
  d?.url ||
  d?.data?.fileUrl ||
  d?.data?.url;

const download = async (url, out) => {
  const r = await axios.get(url, {
    responseType: "stream",
    timeout: 240000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  await new Promise((res, rej) => {
    const w = fs.createWriteStream(out);
    r.data.pipe(w);
    w.on("finish", res);
    w.on("error", rej);
    r.data.on("error", rej);
  });
};

module.exports = {
  config: {
    name: "song2",
    version: "1.0.7",
    author: "AHMED TARIF",
    role: 0,
    countDown: 7,
    noPrefix: true,
    prefixRequired: true,
    premium: true,
    category: "Music",
    guide: { en: "{p}song2 <name/url>" },
  },

  onStart: async ({ message, event, args }) => {
    const q = args.join(" ").trim();
    if (!q) return message.reply("❌ | Use: song2 <name/url>");

    const react = (e) => message.reaction(e, event.messageID).catch(() => {});
    let filePath;

    try {
      react("⏳");

      // 1) get url + title
      let url = q,
        title = "Unknown Song";

      if (!isYT(q)) {
        const s = await yt(q);
        const v = s?.videos?.[0];
        if (!v) return react("❌"), message.reply("❌ | No song found!");
        url = v.url;
        title = v.title || title;
      } else {
        // only if user gave url
        try {
          const s = await yt(url);
          title = s?.videos?.[0]?.title || title;
        } catch (_) {}
      }

      // 2) api mp3
      const { data } = await axios.get(
        `${API}/nazrul/youtube?type=mp3&url=${encodeURIComponent(url)}`,
        { timeout: 60000 }
      );

      const durl = pick(data);
      if (!durl) return react("❌"), message.reply("❌ | Download link not found!");

      // 3) download + send
      filePath = path.join(CACHE, `${clean(title)}_${Date.now()}.mp3`);
      await download(durl, filePath);

      await message.reply({
        body: `✅ | Song Ready\n🎵 Title: ${title}`,
        attachment: fs.createReadStream(filePath),
      });

      react("✅");
    } catch (e) {
      console.log("song2 error:", e?.response?.data || e?.message || e);
      react("❌");
      return message.reply("❌ | Song download failed!");
    } finally {
      try {
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (_) {}
    }
  },
};
