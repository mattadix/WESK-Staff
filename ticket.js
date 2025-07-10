const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  Events,
  InteractionType,
} = require('discord.js');

client.login(process.env.TOKEN);  

const STAFF_ROLE_ID = '1382415847871615132';       // Tvoja staff rola
const TICKET_CATEGORY_ID = '1382416085948567552';  // ID kategórie, kde sa budú vytvárať tickety

const ticketQuestions = {
  ck: [
    { id: 'kto', label: 'Kto?', style: TextInputStyle.Short },
    { id: 'komu', label: 'Komu?', style: TextInputStyle.Short },
    { id: 'typ', label: 'Typ (self, normal, situačné..)?', style: TextInputStyle.Short },
    { id: 'kedy', label: 'Kedy?', style: TextInputStyle.Short },
    { id: 'dovod', label: 'Dôvod?', style: TextInputStyle.Paragraph }
  ],
  vk: [
    { id: 'kto', label: 'Kto?', style: TextInputStyle.Short },
    { id: 'auto', label: 'Auto?', style: TextInputStyle.Short },
    { id: 'majitel', label: 'Majiteľ auta?', style: TextInputStyle.Short },
    { id: 'co', label: 'Čo sa stalo?', style: TextInputStyle.Paragraph },
    { id: 'dokaz', label: 'Dôkaz?', style: TextInputStyle.Paragraph }
  ],
  podpora: [
    { id: 'co', label: 'Čo od nás potrebujete?', style: TextInputStyle.Paragraph }
  ],
  // ... pridať ďalšie kategórie podľa potreby ...
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log(`Bot je online ako ${client.user.tag}`);

  // Registrácia slash príkazu /ticket setup (zaregistruj len raz, potom to môžeš vymazať)
  const data = new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Správa ticket systému')
    .addSubcommand(sub =>
      sub
        .setName('setup')
        .setDescription('Nastaví ticket systém')
        .addRoleOption(option => option.setName('staff').setDescription('Staff rola').setRequired(true))
        .addRoleOption(option => option.setName('everyone').setDescription('@everyone rola').setRequired(true))
        .addChannelOption(option => option.setName('channel').setDescription('Kanál na ticket správu').setRequired(true))
    );

  // Globálna registrácia (môže trvať až hodinu)
  await client.application.commands.create(data);
});

// Slash príkaz /ticket setup
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'ticket') {
      if (interaction.options.getSubcommand() === 'setup') {
        const staffRole = interaction.options.getRole('staff');
        const everyoneRole = interaction.options.getRole('everyone');
        const targetChannel = interaction.options.getChannel('channel');

        // Zakáž zobrazenie kanála pre everyone
        await targetChannel.permissionOverwrites.create(everyoneRole, {
          ViewChannel: false,
        });

        // Embed správa s výberom typu ticketu
        const embed = new EmbedBuilder()
          .setColor('Blue')
          .setTitle('🎟️ Otvor si ticket - West Slovakia Roleplay')
          .setDescription('Vyber si typ ticketu, ktorý chceš otvoriť.');

        const menu = new StringSelectMenuBuilder()
          .setCustomId('ticket-type')
          .setPlaceholder('Vyber typ ticketu')
          .addOptions(
            Object.keys(ticketQuestions).map((key) => ({
              label: key.replace(/_/g, ' '),
              value: key,
            }))
          );

        const row = new ActionRowBuilder().addComponents(menu);
        await targetChannel.send({ embeds: [embed], components: [row] });
        await interaction.reply({
          content: `✅ Ticket systém bol nastavený v kanáli ${targetChannel}`,
          ephemeral: true,
        });

        // Uloženie rolí do klienta na ďalšie použitie
        client.staffRole = staffRole;
        client.everyoneRole = everyoneRole;
      }
    }
  } else if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ticket-type') {
      const category = interaction.values[0];
      const questions = ticketQuestions[category];
      if (!questions)
        return interaction.reply({
          content: 'Neplatný typ ticketu.',
          ephemeral: true,
        });

      // Vytvorenie modálu s otázkami (max 5 otázok)
      const modal = new ModalBuilder()
        .setCustomId(`ticketModal_${category}`)
        .setTitle(`Ticket - ${category}`);

      const rows = [];

      for (let i = 0; i < Math.min(5, questions.length); i++) {
        const q = questions[i];
        const input = new TextInputBuilder()
          .setCustomId(q.id)
          .setLabel(q.label)
          .setStyle(q.style)
          .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(input);
        rows.push(actionRow);
      }

      modal.addComponents(...rows);

      await interaction.showModal(modal);
    }
  } else if (interaction.type === InteractionType.ModalSubmit) {
    if (!interaction.customId.startsWith('ticketModal_')) return;

    const category = interaction.customId.split('_')[1];
    const questions = ticketQuestions[category];
    if (!questions)
      return interaction.reply({
        content: 'Nastala chyba, neplatný typ ticketu.',
        ephemeral: true,
      });

    try {
      // Vytvorenie ticket kanála
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel] },
          { id: client.staffRole.id, allow: [PermissionFlagsBits.ViewChannel] },
        ],
      });

      // Zloženie odpovedí do embed správy
      let description = `**Používateľ:** <@${interaction.user.id}>\n**Kategória:** ${category}\n\n`;

      for (const q of questions) {
        const answer = interaction.fields.getTextInputValue(q.id);
        description += `**${q.label}**: ${answer}\n`;
      }

      const ticketEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('🎫 Nový ticket')
        .setDescription(description);

      await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ticketEmbed] });
      await interaction.reply({ content: `Ticket bol vytvorený: ${ticketChannel}`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'Nastala chyba pri vytváraní ticketu.',
        ephemeral: true,
      });
    }
  }
});

