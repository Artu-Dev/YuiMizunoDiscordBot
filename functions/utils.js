export function getRandomTime(minSeconds, maxSeconds) {
    const min = minSeconds * 1000;
    const max = maxSeconds * 1000;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
  

export function parseMessage(client, message) {
    return {
        guildId: message.guild?.id,
        userId: message.author.id,
        channelId: message.channel.id,
        displayName: message.member?.displayName || message.author.username,
        text: message.content,
        randomInt: Math.floor(Math.random() * 15) + 1,
        isMentioned: message.mentions.has(client.user),
    };
}