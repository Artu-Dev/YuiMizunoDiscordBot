import { addChars, getOrCreateUser, getRandomUserId, reduceChars, setUserProperty } from "../database";
import { parseMessage } from "../functions/utils";

export const name = "roubar";


export async function run(client, message) {
  const {userId, guildId, displayName} = parseMessage(message, client);
  const randomChance = Math.random();
  const victimId = getRandomUserId(guildId, userId);
  const victimData = getOrCreateUser(victimId, displayName, guildId);
  const victimChars = victimData.charLeft;
  const stolenAmount = Math.floor(victimChars * (Math.random() * 0.15 + 0.05));

  const now = Date.now();
  const lastRoubo = getOrCreateUser(userId, displayName, guildId).lastRoubo || 0;

  if (now - lastRoubo > 24 * 60 * 60 * 1000) {  
    setUserProperty(userId, guildId, "lastRoubo", now);
  } else {
    message.reply("Tu já roubou alguém 3x nas últimas 24 horas seu maldito!");
    return;
  }

  setUserProperty(userId, guildId, "lastRoubo", now);

  if (randomChance < 0.38) {
    addChars(userId, guildId, stolenAmount);
    reduceChars(victimId, guildId, stolenAmount);
    message.reply(`${displayName} roubou ${stolenAmount} caracteres de ${victimData.display_name || "um usuário desconhecido"}!`);
  } else {
    reduceChars(userId, guildId, 100);
    addChars(victimId, guildId, 100);
    message.reply(`${displayName} foi roubar e se fodeu, foi pego na covardia e perdeu 100 caracteres para ${victimData.display_name || "um usuário desconhecido"}!`);
    return;
  }
}
