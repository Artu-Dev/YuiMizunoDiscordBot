
export const name = "ping";

export async function run(client, message) {
  const apiLatency = Math.round(client.ws.ping);
  
  const sent = await message.reply("Calculando ping...");
  
  const messageLatency = sent.createdTimestamp - message.createdTimestamp;
  
  await sent.edit(
    `Latência da API: **${apiLatency}ms**\n` +
    `Latência de resposta: **${messageLatency}ms**`
  );
}
