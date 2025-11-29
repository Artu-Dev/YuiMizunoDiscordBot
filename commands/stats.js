import { EmbedBuilder } from "discord.js";
import { achievements } from "../functions/achievements.js";
import { getOrCreateUser } from "../database.js";

export const name = "stats";

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
    const unlocked = JSON.parse(user.achievements_unlocked || "[]");

    const achievementsPretty = unlocked.length
      ? unlocked
          .map((id) => {
            const ach = Object.values(achievements).find((a) => a.id === id);
            return ach ? `ㅤ•ㅤ${ach.emoji}  ${ach.name}` : `ㅤ•ㅤ🏆  ID ${id}`;
          })
          .join("\n")
      : "_Nenhuma ainda_";

    return new EmbedBuilder()
      .setColor("#8A2BE2")
      .setAuthor({
        name: `${discordUser.displayName} — Estatísticas`,
        iconURL: discordUser.displayAvatarURL()
      })
      .setThumbnail(discordUser.displayAvatarURL({ size: 256 }))
      .setDescription(`
**Resumo de Atividade**

• Caracteres restantes no mês: **${user.charLeft ?? 0}**
• Mensagens enviadas: **${user.messages_sent ?? 0}**
• Perguntas feitas: **${user.question_marks ?? 0}**
• CAPS LOCK: **${user.caps_lock_messages ?? 0}**
• Menções recebidas: **${user.mentions_received ?? 0}**
• Menções enviadas: **${user.mentions_sent ?? 0}**
• Reações recebidas: **${user.reactions_received ?? 0}**

🏆 **Conquistas desbloqueadas:**  
${achievementsPretty}
      `)
      .setFooter({
        text: `ID: ${discordUser.id} • Dados atualizados`
      });
  }

  const embed = generateMessage(userData, targetUserDiscord);
  return message.reply({ embeds: [embed] });
}