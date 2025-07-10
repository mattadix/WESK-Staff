require('dotenv').config();
const { Client, GatewayIntentBits, Partials, SlashCommandBuilder, Routes, REST, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const statusChannelId = '1382416038016192582';
const roleId1 = '1382415742531534858';
const roleId2 = '1382415847871615132';

client.once('ready', () => {
  console.log(`✅ Bot prihlásený ako ${client.user.tag}`);
});

// Registrácia príkazu
const commands = [
  new SlashCommandBuilder()
    .setName('statusservera')
    .setDescription('Zobrazí menu na nastavenie statusu servera'),
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ Slash command zaregistrovaný');
  } catch (error) {
    console.error('❌ Chyba pri registrácii príkazov:', error);
  }
})();

// Interakcia
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return;

  if (interaction.isChatInputCommand() && interaction.commandName === 'statusservera') {
    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('server_status_menu')
        .setPlaceholder('Vyber stav servera')
        .addOptions([
          {
            label: 'Server je otvorený',
            value: 'open',
            emoji: '🟢',
          },
          {
            label: 'Server je zatvorený',
            value: 'closed',
            emoji: '🔴',
          },
        ])
    );

    await interaction.reply({ content: 'Zvoľ stav servera:', components: [menu], ephemeral: true });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'server_status_menu') {
    const choice = interaction.values[0];
    const isOpen = choice === 'open';

    const embed = new EmbedBuilder()
      .setTitle('🛡️ Stav servera')
      .setDescription(`${isOpen ? '🟢 **Server je otvorený!**' : '🔴 **Server je zatvorený!**'}`)
      .setColor(isOpen ? 0x00ff00 : 0xff0000)
      .setTimestamp();

    try {
      const channel = await client.channels.fetch(statusChannelId);
      await channel.send({
        content: `<@&${roleId1}> <@&${roleId2}>`,
        embeds: [embed],
      });

      await interaction.update({ content: `✅ Stav servera bol oznámený.`, components: [] });
    } catch (error) {
      console.error('❌ Chyba pri posielaní statusu:', error);
      await interaction.update({ content: '❌ Chyba pri oznamovaní statusu.', components: [] });
    }
  }
});