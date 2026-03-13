const axios = require("axios");
const yts = require("yt-search");

const spinner = ['⠇','⠦','⠏','⠧','⠹','⠋','⠇','⠦','⠏','⠧','⠹','⠋','⠇','⠦','⠏','⠧','⠹','⠋'];
const ytID = url => (url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/) || [])[1];

let apiUrl;
(async () => {
  try { 
    apiUrl = (await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json")).data.api; 
  } catch(e){ console.error("API URL load failed", e); }
})();

const getStream = async (url,name) => (await axios.get(url,{responseType:"stream"})).data;

module.exports = {
  config: {
    name: "video",
    version: "1.0.5",
    author: "AHMED TARIF",
    role: 0,
    countDown:5,
    prefixRequired: true,
    premium: true,
    description: "Searches and downloads YouTube videos!",
    category: "Music",
    guide: { en: "${prefix} video name" }
  },
  onStart: async ({api,args,event}) => {
    try {
      const query = args.join(" "); 
      if(!query) return api.sendMessage("❌ Provide video name or URL.",event.threadID,event.messageID);

      let id = query.includes("youtu") ? ytID(query) : null;

      // Spinner
      let frame=0;
      const waitMsg = await api.sendMessage(`${spinner[frame]} 𝚜𝚎𝚊𝚛𝚌𝚑...`, event.threadID);
      const interval = setInterval(()=>{
        frame = (frame+1) % spinner.length;
        api.editMessage(`${spinner[frame]} 𝙳𝚘𝚠𝚗𝚕𝚘𝚊𝚍𝚒𝚗𝚐...`, waitMsg.messageID).catch(()=>{});
      },200);

      if(!id){ 
        const search = await yts(query); 
        if(!search.videos.length){ 
          clearInterval(interval); 
          await api.unsendMessage(waitMsg.messageID); 
          return api.sendMessage("❌ No results found.",event.threadID,event.messageID); 
        } 
        id = search.videos[0].videoId; 
      }

      const {data} = await axios.get(`${apiUrl}/ytDl3?link=${id}&format=mp4`);

      clearInterval(interval); 
      await api.unsendMessage(waitMsg.messageID);

      await api.sendMessage({
        body:`♲︎︎︎| 𝐏𝐥𝐚𝐲𝐢𝐧𝐠...⌨︎\n𐙚━━━━━━━━━𐙚\n⧉| 𝐔𝐑𝐋: ${data.title}`,
        attachment: await getStream(data.downloadLink, `${data.title}.mp4`)
      }, event.threadID, event.messageID);

    } catch(e){ 
      console.error(e); 
      api.sendMessage("❌ Failed to download video.",event.threadID,event.messageID); 
    }
  },

  run: async ctx => module.exports.onStart(ctx),
};
