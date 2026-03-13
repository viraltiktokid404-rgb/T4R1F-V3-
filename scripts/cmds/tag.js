 module.exports = {
  config: {
    name: "tag",
    aliases: [],
    role: 0,
    noPrefix: true,
    author: 'AHMED TARIF',
    countDown: 3,
    category: 'Group',
    description: {
      en: '𝗧𝗮𝗴𝘀 a user by reply, name, or self-mention if no one specified.'
    },
    guide: {
      en: `1. Reply to a message\n2. Use {pm}tag [name]\n3. Use {pm}tag [name] [message]`
    },
  },

  onStart: async ({ api, event, usersData, threadsData, args }) => {
    const { threadID, messageID, messageReply, senderID } = event;

    try {
      const threadData = await threadsData.get(threadID);
      const members = threadData.members.map(member => ({
        Name: member.name,
        UserId: member.userID
      }));

      let namesToTag = [];
      let extraMessage = args.join(' ');
      let m = messageID;

      if (messageReply) {
        // Tag the user from reply
        m = messageReply.messageID;
        const uid = messageReply.senderID;
        const name = await usersData.getName(uid);
        namesToTag.push({ Name: name, UserId: uid });
      } else if (args[0]) {
        // Tag by name from args
        const nameArg = args[0];
        namesToTag = members.filter(member =>
          member.Name.toLowerCase().includes(nameArg.toLowerCase())
        );
        if (namesToTag.length === 0) {
          return api.sendMessage('❌ User not found', threadID, messageID);
        }
        extraMessage = args.slice(1).join(' ');
      } else {
        // No args or reply, self-mention
        const name = await usersData.getName(senderID);
        namesToTag.push({ Name: name, UserId: senderID });
      }

      // Prepare mentions
      const mentions = namesToTag.map(({ Name, UserId }) => ({
        tag: Name,
        id: UserId
      }));

      const body = namesToTag.map(({ Name }) => Name).join(', ');
      const finalBody = extraMessage ? `${body} \n✆|  ${extraMessage}` : body;

      // Send message with mentions
      await api.sendMessage({ body: finalBody, mentions }, threadID, m);

    } catch (e) {
      console.error(e);
      await api.sendMessage(`❌ Error: ${e.message}`, threadID, messageID);
    }
  }
};
