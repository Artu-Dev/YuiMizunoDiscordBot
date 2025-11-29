import { getOrCreateUser } from "../database.js";

export async function run(client, message) {
  const mentionedUser = message.mentions.users.first();
  const guildId = message.guild.id;
  const displayName = mentionedUser
    ? message.guild.members.cache.get(mentionedUser.id)?.displayName ||
      mentionedUser.username
    : message.member?.displayName || message.author.username;
  const targetUserId = mentionedUser ? mentionedUser.id : message.author.id;

  const userData = getOrCreateUser(targetUserId, displayName, guildId);

  if (!mentionedUser) {
    if (userData) {
      return await message.reply(
        `Você tem ${userData.charLeft} caracteres restantes!`
      );
    } else {
      return await message.reply(
        "Ainda não te registrei mano, manda uma mensagem aí (mas sem ser comando burro)."
      );
    }
  }

  if (userData) {
    return await message.reply(
      `O usuário **${displayName}** tem ${userData.charLeft} caracteres restantes.`
    );
  } else {
    return await message.reply(
      `O usuário **${displayName}** ainda não está registrado.`
    );
  }
}

export const name = "chars";
