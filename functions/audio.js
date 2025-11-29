import { createWriteStream, unlinkSync, readdirSync, existsSync } from "fs";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, EndBehaviorType } from "@discordjs/voice";
import ffmpeg from "fluent-ffmpeg";
import { opus } from "prism-media";
import { getRandomTime } from "./utils.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let timeoutId, timeoutId2;

export function startRecording(connection, client) {
    const receiver = connection.receiver;
      const time = getRandomTime(60, 240);
      console.log("proxima gravação em", time/998.4);
  
      receiver.speaking.once("start", (userId) => {
        const user = client.users.cache.get(userId);
        if(!user || user.bot) {
          console.log("Ignorando bot:", user?.username);
          timeoutId2 = setTimeout(() => startRecording(connection, client), time);
          return;
        }

      console.log(`Iniciando gravação de áudio de ${user.username}`);
    
      const audioStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.Manual,
        },
      });
  
      const pcmFileName = `./recordings/${user.username}-${Date.now()}.pcm`;
      const fileStream = createWriteStream(pcmFileName);

      let totalBytes = 0;
      const MAX_BYTES = 1 * 1024 * 1024; 

      fileStream.on("drain", () => {});
    
      const opusDecoder = new opus.Decoder({
        rate: 48000,
        channels: 1,
        frameSize: 960,
      });
      audioStream.pipe(opusDecoder).pipe(fileStream);
     
      const maxDurationTimeout = setTimeout(() => {
        console.log("⏱️ Tempo máximo atingido (10s)");
        stopRecording();
      }, 10_000);

      const sizeInterval = setInterval(() => {
        try {
          const stats = statSync(pcmFileName);
          if (stats.size >= 1_000_000) {
            console.log("📦 Tamanho máximo atingido (1MB)");
            stopRecording();
          }
        } catch {}
      }, 300);
  
      function stopRecording() {
        clearTimeout(maxDurationTimeout);
        clearInterval(sizeInterval);

        audioStream.destroy();
        fileStream.end();

        convertPcmToWav(pcmFileName, connection)
          .catch(() => console.log("Erro ao converter PCM"));
      }

  
      audioStream.on("end", stopRecording);
      audioStream.on("close", stopRecording);
      audioStream.on("error", (err) => {
        console.error(`Erro na gravação:`, err);
        stopRecording();
      });

      connection.on("disconnect", () => {
        console.log(`Desconectado do canal de voz, encerrando gravação...`);
        stopRecording();
      });
  
      timeoutId2 = setTimeout(() => startRecording(connection, client), time);  
    });
}

async function convertPcmToWav(pcmFileName) {
  const wavFileName = pcmFileName.replace(".pcm", ".wav");
  ffmpeg(pcmFileName)
    .inputOptions(["-f s16le", "-ar 48000", "-ac 1"])
    .audioFrequency(48000)
    .audioChannels(1)
    .audioCodec("pcm_s16le")
    .on("end", function () {
        try {
          if (existsSync(pcmFileName)) {
            unlinkSync(pcmFileName);
          }
        } catch (err) {
          console.log("Erro ao deletar PCM:", err);
        }
      // unlinkSync(pcmFileName);
    })
    .on("error", function (err) {
      console.error("Erro ao converter o áudio:", err);
    })
    .save(wavFileName);
}

export function playRandomAudio(connection) {
  const time = getRandomTime(60, 240);
  console.log(`Próxima execução em ${time / 60000}s`);

  const allFilesWav = readdirSync("./recordings").filter((file) => file.endsWith(".wav"));
  if (allFilesWav.length !== 0) {
    console.log("Tocando áudio...");
    const randomFile = allFilesWav[Math.floor(Math.random() * allFilesWav.length)];
    playAudio(`recordings/${randomFile}`, connection, allFilesWav.length >= 50);
  }

  timeoutId = setTimeout(() => playRandomAudio(connection), time);
}

function playAudio(wavFileName, connection, deleteFile) {
  const player = createAudioPlayer();
  const audioPath = join(__dirname,"..", wavFileName);
  const resource = createAudioResource(audioPath);
  connection.subscribe(player);
  player.play(resource);

  if (deleteFile) {
    player.on(AudioPlayerStatus.Idle, () => {
      unlinkSync(audioPath);
    });
  }
}

export function stopPlayingAudio() {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    clearTimeout(timeoutId2);
    timeoutId = null;
    timeoutId2 = null;
  }
}
