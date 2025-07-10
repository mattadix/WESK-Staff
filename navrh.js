require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const allowedChannelId = '1382416085948567552'; // kanál na návrhy
const aTeamRoleId = '1382415847871615132'; // rola A-team

client.once('ready', () => {
  console.log(`✅ Bot prihlásený ako ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.id !== allowedChannelId) return;

  const embed = new EmbedBuilder()
    .setColor(0x00AE86)
    .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
    .setDescription(`📩 **Návrh od používateľa:**\n${message.content}`)
    .setFooter({ text: `Používateľ ID: ${message.author.id}` })
    .setTimestamp();

  try {
    const sentMessage = await message.channel.send({ embeds: [embed] });
    await sentMessage.react('👍');
    await sentMessage.react('❌');
    await message.delete();
  } catch (error) {
    console.error('❌ Chyba pri posielaní návrhu:', error);
  }
});

