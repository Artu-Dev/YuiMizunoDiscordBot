import { addChannel, getChannels } from "../database.js";

export const name = "add-channel";

export async function run(client, message) {
  const guild_id = message.guild.id
  const channel_id = message.channel.id
  const channels = getChannels(guild_id)

  if (!channels.includes(channel_id)) {
    addChannel(guild_id, channel_id);
    message.reply("Canal adicionado!");
  }
}
