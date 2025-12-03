import { EmbedBuilder } from "discord.js";
import { achievements } from "../functions/achievements.js";
import { getOrCreateUser } from "../database.js";

export const name = "conqs";

export async function run(client, message) {
  const mentionedUser = message.mentions.users.first();
  const targetUserId = mentionedUser ? mentionedUser.id : message.author.id;
  const targetUserDiscord = mentionedUser ? mentionedUser : message.author;
  const guildId = message.guild.id;
  const displayName = mentionedUser
    ? message.guild.members.cache.get(mentionedUser.id)?.displayName ||
      mentionedUser.username
    : message.member?.displayName || message.author.username;

  const userData = getOrCreateUser(targetUserId, displayName, guildId);

  function generateMessage(user, discordUser) {
    const unlocked = JSON.parse(user.achievements_unlocked || "{}");

    const achievementsPretty = Object.keys(unlocked).length
  ? Object.keys(unlocked)
      .map((key) => {
        const ach = achievements[key];
        return ach ? `ㅤ•ㅤ${ach.emoji} ${ach.name}` : `ㅤ•ㅤ🏆 ${key}`;
      })
      .join("\n")
  : "_Nenhuma ainda_";

    return new EmbedBuilder()
      .setColor("#8A2BE2")
      .setAuthor({
        name: `${discordUser.displayName} — CONQUISTAS FODAS`,
        iconURL: discordUser.displayAvatarURL(),
      })
      .setThumbnail(discordUser.displayAvatarURL({ size: 256 }))
      .setDescription(
        `
🏆 **Conquistas desbloqueadas:**  
${achievementsPretty}
      `
      )
      .setFooter({
        text: `ID: ${discordUser.id} • Dados atualizados`,
      });
  }

  const embed = generateMessage(userData, targetUserDiscord);
  return message.reply({ embeds: [embed] });
}
