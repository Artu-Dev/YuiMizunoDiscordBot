export function getRandomTime(minSeconds, maxSeconds) {
    const min = minSeconds * 1000;
    const max = maxSeconds * 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
  

export function parseMessage(message, client = null) {
    const {
        guild,
        author,
        channel,
        content = "",
        mentions,
        member,
        reference
    } = message;

    const cleaned = content.trim();

    return {
        guildId: guild?.id ?? null,
        channelId: channel.id,
        userId: author.id,
        messageId: message.id,
        timestamp: message.createdTimestamp,
        isBot: author.bot,

        username: author.username,
        displayName: member?.displayName ?? author.username,
        avatarURL: author.displayAvatarURL?.() ?? null,
        roles: member?.roles?.cache
            ? Array.from(member.roles.cache.keys())
            : [],

        text: cleaned,
        textLower: cleaned.toLowerCase(),
        wordCount: cleaned.split(/\s+/).length,
        hasLinks: /https?:\/\//.test(cleaned),
        urls: cleaned.match(/https?:\/\/\S+/g) || [],
        emojis: cleaned.match(/<a?:\w+:\d+>/g) || [],
        isCommand: cleaned.startsWith("!"),
        commandName: cleaned.startsWith("!")
            ? cleaned.split(/\s+/)[0].slice(1)
            : null,

        mentions: {
            users: Array.from(mentions.users.keys()),
            roles: Array.from(mentions.roles.keys()),
            channels: Array.from(mentions.channels.keys()),
            everyone: mentions.everyone,
            here: cleaned.includes("@here"),
            isMentioningClient:
                client && client.user
                    ? mentions.has(client.user)
                    : false
        },

        isReply: Boolean(reference?.messageId),
        repliedMessageId: reference?.messageId ?? null,
        repliedUserId: reference?.authorId ?? null,

        isDM: channel.isDMBased?.() ?? false,
        channelType: channel.type,
        guildName: guild?.name ?? null,
        guildMemberCount: guild?.memberCount ?? null,

        randomInt: (Math.random() * 15 | 0) + 1,
        lettersOnly: cleaned.replace(/[^a-zA-ZÀ-ú ]/g, ""),
        numbersInMessage: cleaned.match(/\d+/g) || [],
        firstWord: cleaned.split(/\s+/)[0] ?? null,
        lastWord: cleaned.split(/\s+/).slice(-1)[0] ?? null
    };
}

export const replaceMentions = async (message, content) => {
      if (!content) return content;

      const mentionRegex = /<@!?(\d+)>/g;
      let processedContent = content;

      const mentions = content.match(mentionRegex);
      if (mentions) {
        for (const mention of mentions) {
          const userId = mention.match(/\d+/)[0];
          try {
            const user = await message.guild.members.fetch(userId);
            const displayName = user.displayName || user.user.username;
            processedContent = processedContent.replace(
              mention,
              `@${displayName}`
            );
          } catch (error) {
            console.log(`Não foi possível buscar usuário ${userId}`);
          }
        }
      }

      return processedContent;
    };