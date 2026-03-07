import { addChars, addUserPropertyByAmount, getOrCreateUser, getRandomUserId, reduceChars, setUserProperty } from "../database.js";
import { parseMessage } from "../functions/utils.js";

export const name = "roubar";


export async function run(client, message) {
  const {userId, guildId, displayName} = parseMessage(message, client);
  const randomChance = Math.random();
  const victimId = getRandomUserId(guildId, userId);
  const victimData = getOrCreateUser(victimId, displayName, guildId);
  const victimChars = victimData.charLeft;
  const stolenAmount = Math.floor(victimChars * (Math.random() * 0.15 + 0.05));

  const now = new Date();
  const today = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  const user = getOrCreateUser(userId, displayName, guildId);
  const lastRouboDate = user.lastRoubo;
  const timesRoubou = Number(user.timesRoubou) || 0;

  if (lastRouboDate != today) {
    setUserProperty("timesRoubou", userId, guildId, 1); 
    setUserProperty("lastRoubo", userId, guildId, today);
  } 
  else if (timesRoubou < 3) {
    addUserPropertyByAmount("timesRoubou", userId, guildId, 1);
  }
  else {
    message.reply("Tu já roubou alguém 3x nas últimas 24 horas seu maldito!");
    return;
  }

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
