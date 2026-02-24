import axios from "axios";
import { dbBot, reduceChars, setUserProperty } from "../database.js";
import { parseMessage } from "./utils.js";
import { user } from "@elevenlabs/elevenlabs-js/api/index.js";

const penalities = [
  {nome: "mudo", description: "Voce agora nao pode usar espaços nas mensagens"},
  {nome: "estrangeiro", description: "Voce agora nao pode usar vogais nas mensagens"},
  {nome: "palavra_obrigatoria", description: "Voce agora precisa terminar suas mensagens com: "},
  {nome: "eco", description: "suas mensagens serao apagadas em 5 segundos"},
  {nome: "screamer", description: "Voce agora só pode enviar mensagens em letras maiúsculas"},
  {nome: "poeta_binario", description: "Voce agora só pode enviar mensagens com uma única palavra"},
  {nome: "gago_digital", description: "Voce agora precisa repetir cada palavra duas vezes"}
]

const randomWords = [
  "labubu", "papai", "xibiu", "amor", "porra", "?", "pneumoultramicroscopicosilicovulcanoconiose", "capeta", "merda", "bosta", "caralho", "puta",
]


export const limitChar = async (message, userData) => {
  const {text, guildId, userId, displayName } = parseMessage(message)
  if (!dbBot.data.configs.charLimitEnabled) return true;

  handlePenalities(message, userData);

  const randomWordBanned = axios.get("https://api.dicionario-aberto.net/random").then(res => res.data[0].word) || "capeta";

  let textSize = text.length;

  if (message.attachments.size > 0) {
    textSize += message.attachments.size;
  }

  const regexlink = /(https?:\/\/[^\s]+)/g;
  const links = text.match(regexlink);
  if (links) {
    textSize += links.length * 10;
  }

  const newValue = reduceChars(userId, guildId, textSize);


  if (newValue <= 0) {
    const randomPenality = penalities[Math.floor(Math.random() * penalities.length)];
    let randomWord = "";

    setUserProperty(userId, guildId, "penalities", [...userData.penalities, randomPenality.nome]);
    if(randomPenality.nome === "palavra_obrigatoria") {
      randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
      setUserProperty(userId, guildId, "penalityWord", randomWord);
    }

    await message.reply(`!${displayName} seus caracteres acabaram e voce receu a penalidade: ${randomPenality.description}!!!`);
    await message.channel.send(`${randomPenality.description}${randomWord}`);

    setTimeout(() => {
      message.delete();
    }, 5000);

    return false;
  }

  if (text.toLowerCase().includes(randomWordBanned.toLowerCase())) {
    reduceChars(userId, guildId, 500);
    message.reply("❌Palavra proibida!!! Você perdeu 500 caracteres!!!❌");
  }


  // const ROLE_GREEN  = "1443792452506091642";
  // const ROLE_YELLOW = "1443792779900751883"; 
  // const ROLE_RED    = "1443792854207041546";

  // const member = message.member;

  // await member.roles.remove([ROLE_GREEN, ROLE_YELLOW, ROLE_RED]).catch(() => {});

  // if (newValue > 1000) {
  //   await member.roles.add(ROLE_GREEN);
  // } 
  // else if (newValue > 500) {
  //   await member.roles.add(ROLE_YELLOW);
  // } 
  // else {
  //   await member.roles.add(ROLE_RED);
  // }

  if (newValue > 1000) message.react("🟢");
  else if (newValue > 500) message.react("🟡");
  else message.react("🔴");

  return true;
};


function handlePenalities(message, userData) {
  if (!userData.penalities || userData.penalities.length === 0) return;

  if (userData.penalities.includes("mudo") && message.content.includes(' ')) {
    message.delete();
    message.reply("Você está penalizado com 'Mudo', não pode usar espaços!");
  }

  if (userData.penalities.includes("estrangeiro") && /[aeiou]/i.test(message.content)) {
    message.delete();
    message.reply("Você está penalizado com 'Estrangeiro', não pode usar vogais!");
  }

  if (userData.penalities.includes("palavra_obrigatoria")  && !message.content.endsWith(userData.penalityWord)) {
    message.delete();
    message.reply(`Você está penalizado com "Palavra Obrigatória", suas mensagens precisam terminar com ${userData.penalityWord}!`);
  }

  if (userData.penalities.includes("eco")) {
    setTimeout(() => {
      message.delete();
    }, 5000); 
  }

  if (userData.penalities.includes("screamer") && message.content !== message.content.toUpperCase()) {
    message.delete();
    message.reply("Você está penalizado com 'Screamer', só pode usar letras maiúsculas!");
  }

  if (userData.penalities.includes("poeta_binario") && message.content.trim().includes(' ')) {
    message.delete();
    message.reply("Você está penalizado com 'Poeta Binário', só pode enviar mensagens de uma palavra!");
  } 

  if (userData.penalities.includes("gago_digital")) {
    const words = message.content.trim().split(/\s+/);
    for (let i = 0; i < words.length; i += 2) {
      if (words[i] !== words[i + 1]) {
        message.delete();
        message.reply("Você está penalizado com 'Gago Digital', precisa repetir cada palavra duas vezes!");
        break;
      }
    }
  }
}