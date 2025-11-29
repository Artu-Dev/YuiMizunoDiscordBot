import fs from "fs"

import fetch from "node-fetch";

export const createAudioFileFromText = async (text) => {
  const res = await fetch("http://127.0.0.1:5001/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) console.log("Erro ao gerar áudio:", res.status);
  const buffer = await res.arrayBuffer();
  const filePath = `audio/YUIBOT_${Date.now()}.wav`;
  await fs.promises.writeFile(filePath, Buffer.from(buffer));
  return filePath;
};
