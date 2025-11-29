import Database from "better-sqlite3";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";

export const dbBot = new Low(new JSONFile("./data/dbBot.json"), {channels: [],
    configs: {
      limitChar: 2000,
      speakMessage: true,
      generateMessage: true,
      maxSavedAudios: 50,
      prefix: "$"
    },
    AiConfig: {
      voiceId: "4tRn1lSkEn13EVTuqb0g",
      textModel: "gpt-oss:120b-cloud",
      voiceModel: "eleven_flash_v2_5"
    },
});
export const db = new Database("./data/data.db");
const charLimit = dbBot.data.configs.limitChar

export const intializeDbBot = async () => {
  await dbBot.read();
  await dbBot.write();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        display_name TEXT,
        guild_id TEXT,
        charLeft INTEGER DEFAULT ${charLimit},
        messages_sent INTEGER DEFAULT 0,
        mentions_received INTEGER DEFAULT 0,
        mentions_sent INTEGER DEFAULT 0,
        reactions_received INTEGER DEFAULT 0,
        caps_lock_messages INTEGER DEFAULT 0,
        question_marks INTEGER DEFAULT 0,
        last_message_time TEXT,
        talking_to_self INTEGER DEFAULT 0,
        night_owl_messages INTEGER DEFAULT 0,
        achievements_unlocked TEXT DEFAULT '[]'
    )
    `
  ).run();

  db.prepare(`
        CREATE TABLE IF NOT EXISTS talking_to_self (
            user_id TEXT,
            channel_id TEXT,
            count INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, channel_id)
        )
  `).run();
  
  db.prepare(`
        CREATE TABLE IF NOT EXISTS bot_channels (
            guild_id TEXT PRIMARY KEY,
            channel_id TEXT DEFAULT '[]'
        )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS message_context (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT,
      guild_id TEXT,
      author TEXT,
      content TEXT,
      timestamp TEXT
    )
  `).run();

};


// export const getOrCreateUser = (userId, displayName, guildId) => {
//     const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
//     if (!user) {
//       db.prepare("INSERT OR REPLACE INTO users (id, display_name) VALUES (?, ?)").run(
//         guildId,
//         userId,
//         displayName
//       );
//       return db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
//     }

//     return user;
// };

export const getUser = (userId) => {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
};

export const createUser = (userId, displayName, guildId) => {
    db.prepare("INSERT OR REPLACE INTO users (id, display_name, guild_id) VALUES (?, ?, ?)").run(
    userId,
    displayName,
    guildId
);
    return getUser(userId);
};

export const getOrCreateUser = (userId, displayName, guildId) => {
    let user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    if (!user) {
        db.prepare(
            `INSERT INTO users (id, display_name, guild_id) VALUES (?, ?, ?)`
        ).run(userId, displayName, guildId);
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    }
    return user;
};

/// ==============================================
/// NOTICIAS
/// ==============================================

export function saveMessageContext(channelId, guildId, author, content) {
  if (!content || content.length < 20) return;

  db.prepare(`
    INSERT INTO message_context (channel_id, guild_id, author, content, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(channelId, guildId, author, content, new Date().toISOString());

  db.prepare(`
    DELETE FROM message_context
    WHERE channel_id = ?
    AND id NOT IN (
      SELECT id FROM message_context
      WHERE channel_id = ?
      ORDER BY timestamp DESC
      LIMIT 100
    )
  `).run(channelId, channelId);
}

export function getRecentMessages(channelId, limit = 20) {
  const rows = db.prepare(`
    SELECT author, content
    FROM message_context
    WHERE channel_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `).all(channelId, limit);

  return rows.map(row => `${row.author}: ${row.content}`);
}

export function getGuildMembers(guildId, limit = 10) {
  const rows = db.prepare(`
    SELECT display_name
    FROM users
    WHERE guild_id = ?
    LIMIT ?
  `).all(guildId, limit);

  return rows.map(row => row.display_name);
}


/// ==============================================
/// CONQUISTAS
/// ==============================================


export function getAchievements(userId) {
    const row = db.prepare("SELECT achievements_unlocked FROM users WHERE id = ?").get(userId);
    return row ? JSON.parse(row.achievements_unlocked || "[]") : [];
}

export function unlockAchievement(userId, achievementKey) {
    const current = getAchievements(userId);
    if (current.includes(achievementKey)) {
        return false;
    }

    current.push(achievementKey);

    db.prepare(
        "UPDATE users SET achievements_unlocked = ? WHERE id = ?"
    ).run(JSON.stringify(current), userId);

    return true;
}

// ==============================================
// CANAIS
// ==============================================


export const getChannels = (guild_id) => {
  const row = db
    .prepare("SELECT channel_id FROM bot_channels WHERE guild_id = ?")
    .get(guild_id);
  return row ? JSON.parse(row.channel_id || "[]") : [];
}

export const addChannel = (guild_id, channel_id) => {
  let channels = getChannels(guild_id);

  if (!channels.length) {
    db.prepare(
      "INSERT OR IGNORE INTO bot_channels (guild_id, channel_id) VALUES (?, ?)"
    ).run(guild_id, "[]");
  }

  if (!channels.includes(channel_id)) {
    channels.push(channel_id);
  }

  db.prepare("UPDATE bot_channels SET channel_id = ? WHERE guild_id = ?")
    .run(JSON.stringify(channels), guild_id);
};

export const removeChannel = (guild_id, channel_id) => {
  const currentChannels = getChannels(guild_id);

  const updated = currentChannels.filter(id => id !== channel_id);

  db.prepare("UPDATE bot_channels SET channel_id = ? WHERE guild_id = ?")
    .run(JSON.stringify(updated), guild_id);
};

/// ==============================================
/// PROPRIEDADES USUARIO
/// ==============================================


export const addUserProperty = (property, userId) => {
  db.prepare(`UPDATE users SET ${property} = ${property} + 1 WHERE id = ?`).run(userId)
}

export function resetUserProperty(prop, userId) {
    db.prepare(`
        UPDATE users SET ${prop} = 0 WHERE id = ?
    `).run(userId);
}

export function setUserProperty(prop, userId, value) {
    db.prepare(`
        UPDATE users SET ${prop} = ? WHERE id = ?
    `).run(value, userId);
}

export const reduceChars = (userId, amount) => {
    const user = getUser(userId);
    const date = new Date().toISOString();
    const newValue = Math.max(0, user.charLeft - amount);

    db.prepare("UPDATE users SET charLeft = ?,last_message_time = ?  WHERE id = ?").run(
      newValue,
      date,
      userId
    );

    return newValue;
};

/// ==============================================
/// FALANDO SOZINHO
/// ==============================================


export function getTalkingToSelf(userId, channelId) {
    const row = db.prepare(`
        SELECT count 
        FROM talking_to_self
        WHERE user_id = ? AND channel_id = ?
    `).get(userId, channelId);

    return row ? row.count : 0;
}

export function incrementTalkingToSelf(userId, channelId) {
    db.prepare(`
        INSERT INTO talking_to_self (user_id, channel_id, count)
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, channel_id)
        DO UPDATE SET count = count + 1
    `).run(userId, channelId);
}

export function resetTalkingToSelf(userId, channelId) {
    db.prepare(`
        UPDATE talking_to_self
        SET count = 0
        WHERE user_id = ? AND channel_id = ?
    `).run(userId, channelId);
}