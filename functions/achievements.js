import { 
    addUserProperty, 
    unlockAchievement, 
    resetTalkingToSelf,
    setUserProperty,
    incrementTalkingToSelf,
    getOrCreateUser
} from "../database.js";

import { gerar_conquista } from "./image.js";

const isOnlyCaps = (text) => /^[A-Z\s]+$/.test(text);
const isQuestionMessage = (text) => text.endsWith("?");
const isNightOwlHour = () => {
    const hour = new Date().getHours();
    return hour >= 2 && hour < 6;
};

const updateUserStats = (userId, updates) => {
    for (const [prop, value] of Object.entries(updates)) {
        if (typeof value === "number") {
            addUserProperty(prop, userId, value);
        } else if (typeof value === "boolean" && value) {
            addUserProperty(prop, userId);
        }
    }
};

const giveAchievement = async (message, userId, achievement, authorUserObj) => {
    const isNew = unlockAchievement(userId, achievement.id);
    if (!isNew) return;

    const size = achievement.description.length > 22 ? "small" : "normal"
    const userData = getOrCreateUser(userId, authorUserObj.displayName, message.guild.id);
    setUserProperty("charLeft", userId, (userData.charLeft || 0) + achievement.charPoints);

    const buffer = await gerar_conquista(authorUserObj, achievement, size);

    await message.channel.send({ files: [{ attachment: buffer, name: "achievement.png" }] });
    await message.channel.send(
        `**${authorUserObj.displayName}** ganhou **${achievement.charPoints}** caracteres como recompensa`
    );
};

const checkAllAchievements = async (message, userId, stats, authorUserObj) => {
    for (const ach of Object.values(achievements)) {
        if (ach.check(stats)) {;
            await giveAchievement(message, userId, ach, authorUserObj);
        }
    }
};

const handleMentions = async (message, userId) => {
    if (!message.mentions.users.size) return;
    

    for (const [mentionedId, mentionedUser] of message.mentions.users) {
        const mentionedDisplayName =
            message.guild.members.cache.get(mentionedId)?.displayName ||
            mentionedUser.username;

            
        if (!mentionedUser.bot) {
            addUserProperty("mentions_sent", userId);
            if (achievements.stalker.check(getOrCreateUser(userId, mentionedDisplayName, message.guild.id))) {
                await giveAchievement(message, userId, achievements.stalker, message.author, "small");
            }
        }

        if (mentionedId !== userId) {
            addUserProperty("mentions_received", mentionedId);
            if (achievements.popular.check(getOrCreateUser(mentionedId, mentionedDisplayName, message.guild.id))) {
                await giveAchievement(message, mentionedId, achievements.popular, mentionedUser);
            }
        }
    }
};

export const handleAchievements = async (message) => {
    const userId = message.author.id;
    const channelId = message.author.id;
    const content = message.content?.trim() || "";
    const now = Date.now();
    const guildId = message.guild?.id;
    const displayName = message.member?.displayName || message.author.username;

    let stats = getOrCreateUser(userId, displayName, guildId);
    const updates = {};

    // Night owl
    if (isNightOwlHour()) updates.night_owl_messages = true;

    // Talking to self
    if (message.channel.lastAuthorId === userId) {
        incrementTalkingToSelf(userId, channelId)
    } else {
        resetTalkingToSelf(userId, channelId);
    }

    // Stats gerais
    updates.messages_sent = 1;
    if (isOnlyCaps(content)) updates.caps_lock_messages = 1;
    if (isQuestionMessage(content)) updates.question_marks = 1;

    updateUserStats(userId, updates);
    stats = getOrCreateUser(userId, displayName, guildId);

    await handleMentions(message, userId);

    // Checar achievements gerais
    await checkAllAchievements(message, userId, stats, message.author);

    // Ghost achievement (30 dias sem mensagem)
    const diffDays = (now - (stats.last_message_time ?? now)) / (1000 * 60 * 60 * 24);
    if (diffDays >= 30) await giveAchievement(message, userId, achievements.ghost, message.author);

    // Atualizar último horário de mensagem
    setUserProperty("last_message_time", userId, now);
};

export const achievements = {
    ghost: {
        id: 1,
        name: "Fantasma",
        charPoints: 5000,
        emoji: "👻",
        description: "Ficou 30 dias sem mandar mensagem",
        check: () => false,
    },

    monologue: {
        id: 2,
        charPoints: 200,
        name: "Monólogo",
        emoji: "🎭",
        description: "Mandou 10 mensagens seguidas sem resposta",
        check: (stats) => stats.talking_to_self >= 10,
    },

    caps_addict: {
        id: 3,
        charPoints: 600,
        name: "VICIADO EM CAPS LOCK",
        emoji: "📢",
        description: "Mandou 50 mensagens em CAPS LOCK",
        check: (stats) => stats.caps_lock_messages >= 5,
    },

    night_owl: {
        id: 5,
        charPoints: 1500,
        name: "Coruja Noturna",
        emoji: "🦉",
        description: "Mandou 100 mensagens entre 2h e 6h da manhã",
        check: (stats) => stats.night_owl_messages >= 100,
    },

    popular: {
        id: 6,
        charPoints: 2000,
        name: "Popular",
        emoji: "⭐",
        description: "Recebeu 200 menções",
        check: (stats) => stats.mentions_received >= 200,
    },

    stalker: {
        id: 7,
        charPoints: 1500,
        name: "Stalker",
        emoji: "👀",
        description: "Mencionou outras pessoas 300 vezes",
        check: (stats) => stats.mentions_sent >= 300,
    },

    question_everything: {
        id: 8,
        charPoints: 1500,
        name: "Questiona Tudo",
        emoji: "❓",
        description: "Fez 150 perguntas",
        check: (stats) => stats.question_marks >= 200,
    },

    loved: {
        id: 10,
        charPoints: 2000,
        name: "Amado",
        emoji: "❤️",
        description: "Recebeu 500 reações",
        check: (stats) => stats.reactions_received >= 500,
    },

    chatterbox: {
        id: 11,
        charPoints: 2000,
        name: "Tagarela",
        emoji: "💬",
        description: "Enviou 1000 mensagens",
        check: (stats) => stats.messages_sent >= 1000,
    },
};