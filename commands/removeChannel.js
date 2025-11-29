import { intializeDbBot, removeChannel, getChannels } from "../database.js";
await intializeDbBot();

export const name = "remove-channel";
export async function run(client, message) {
  const guild_id = message.guild.id
  const channel_id = message.channel.id
  const channels = getChannels(guild_id)

  if (!channels.includes(channel_id)) {
    removeChannel(guild_id, channel_id);
    message.reply("Canal removido!");
  }
}
