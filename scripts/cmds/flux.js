const axios = require("axios");

module.exports.config = {
  name: "flux",
  version: "2.0",
  role: 0,
  author: "Dipto",
  description: "Flux Image Generator",
  category: "Image",
  premium: true,
  guide: "{pn} [prompt] --ratio 1024x1024\n{pn} [prompt]",
  countDown: 15,
};

module.exports.onStart = async ({ event, args, api }) => {
  const dipto = "https://api.noobs-api.rf.gd/dipto";

  try {
    const prompt = args.join(" ").trim();
    if (!prompt) {
      return api.sendMessage(
        `• 𝐄𝐱𝐚𝐦𝐩𝐥𝐞...\n\n${module.exports.config.guide.replace(/{pn}/g, module.exports.config.name)}`,
        event.threadID,
        event.messageID
      );
    }

    const [prompt2, ratio = "1:1"] = prompt.includes("--ratio")
      ? prompt.split("--ratio").map((s) => s.trim())
      : [prompt, "1:1"];

    const startTime = Date.now();
    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const apiurl = `${dipto}/flux?prompt=${encodeURIComponent(prompt2)}&ratio=${encodeURIComponent(ratio)}`;
    const response = await axios.get(apiurl, { responseType: "stream" });

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
    api.setMessageReaction("✅", event.messageID, () => {}, true);

    return api.sendMessage(
      {
        body: `Here's your image (Generated in ${timeTaken} seconds)`,
        attachment: response.data,
      },
      event.threadID,
      event.messageID
    );
  } catch (e) {
    console.error(e);
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    api.sendMessage("Error: " + (e?.message || e), event.threadID, event.messageID);
  }
};
