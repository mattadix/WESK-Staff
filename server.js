const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const { Client, GatewayIntentBits } = require('discord.js');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  DISCORD_BOT_TOKEN,
  GUILD_ID_RENAME,
  CHANNEL_ID_1,
  CHANNEL_ID_2,
  CHANNEL_ID_3
} = process.env;

// Spusti Discord klienta
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
bot.login(DISCORD_BOT_TOKEN);

// OAuth2 autorizačná URL
app.get('/auth/discord', (req, res) => {
  const redirect = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.members.read`;
  res.redirect(redirect);
});

// Callback z Discord OAuth
app.get('/auth/discord/callback', async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).send('Missing code');

  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
      scope: 'identify guilds guilds.members.read'
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, token_type } = tokenRes.data;

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `${token_type} ${access_token}` }
    });

    const user = userRes.data;

    // Presmeruj naspäť s user údajmi ako query string
    res.redirect(`/index.html?discordId=${user.id}&username=${user.username}#success`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('OAuth2 error');
  }
});

// API endpoint na odoslanie občianskeho a premenu
app.post('/submit', async (req, res) => {
  const { discordId, firstName, lastName, dob, robloxNick } = req.body;

  const birthDate = new Date(dob);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  const rpName = `${firstName} ${lastName}`;
  const newNickname = `${rpName} || ${robloxNick}`;

  try {
    const guild = await bot.guilds.fetch(GUILD_ID_RENAME);
    const member = await guild.members.fetch(discordId);

    if (member) {
      await member.setNickname(newNickname);
    }

    const embed = {
      title: '🆔 Nový občiansky preukaz',
      color: 0x00bfff,
      fields: [
        { name: 'RP Meno', value: rpName },
        { name: 'Vek', value: `${age}` },
        { name: 'Roblox Nick', value: robloxNick },
        { name: 'Discord ID', value: discordId }
      ],
      timestamp: new Date()
    };

    const channels = [CHANNEL_ID_1, CHANNEL_ID_2, CHANNEL_ID_3];
    for (const ch of channels) {
      const channel = await bot.channels.fetch(ch);
      await channel.send({ embeds: [embed] });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Nepodarilo sa nastaviť' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server beží na http://localhost:${PORT}`));
