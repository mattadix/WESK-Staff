 // Spustenie bota pomocou: node index.js 

  // POZOR!!§


require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel], // voliteľné, ak pracuješ s DM alebo inými čiastočnými dátami
});

client.once("ready", () => {
  console.log(`✅ Bot prihlásený ako ${client.user.tag}`);
});

client.on("messageCreate", (msg) => {
  // Ignoruj správy od botov
  if (msg.author.bot) return;

  if (msg.content.startsWith("/message ")) {
    const message = msg.content.slice(9).trim();

    if (!message) {
      return msg.reply("❗ Prosím zadaj správu za príkazom `/message`.");
    }

    msg.channel.send(`📩 Správa: ${message}`);
  }
});

client.login(process.env.TOKEN);