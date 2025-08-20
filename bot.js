import { config } from 'dotenv';
import { Client, Events, Collection, GatewayIntentBits, MessageFlags } from 'discord.js';
import fs from 'node:fs';
import { loadConfig } from './utils/config.js';
import { handleHornBot } from './utils/handleHornBot.js';

config(); // read variables in .env

// Discord client instance setup
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});
client.commands = new Collection();

// Read all the commands in command folder
const commandFiles = fs.readdirSync('./commands').filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = await import(`./commands/${file}`); // using dynamic import
    client.commands.set(command.data.name, command);
}

// When the client is ready to be online, run this code (only once).
client.once(Events.ClientReady, () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
});

// ===== Message Handlers =====
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // avoid loops

    const guildId = message.guild?.id;
    if (!guildId) return; // skip direct messages

    const config = loadConfig(guildId);

    // Check if current channel is in listenChannels
    if (config['horn_bot'].listenChannels.includes(message.channel.id)) {
        const response = await handleHornBot(message.content);
        for (const targetChannelId of config['horn_bot'].replyChannels) {
            const targetChannel = client.channels.cache.get(targetChannelId);
            targetChannel.send(response);
        }
    }
});

// ===== Interaction Handlers =====
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (interaction.isAutocomplete()) {
            await handleAutocomplete(interaction);
        } else if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction);
        }
    } catch (error) {
        console.error(`❌ Error handling interaction:`, error);
    }
});

// ===== Slash Command Execution =====
async function handleSlashCommand(interaction) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (!interaction.replied) {
            await interaction.reply({ content: '❌ Error executing command.', flags: MessageFlags.Ephemeral });
        }
    }
}

// ===== Autocomplete Execution =====
async function handleAutocomplete(interaction) {
    const command = client.commands.get(interaction.commandName);
    if (!command || typeof command.autocomplete !== 'function') return;

    try {
        await command.autocomplete(interaction);
    } catch (error) {
        console.error(`❌ Autocomplete error for ${interaction.commandName}:`, error);
        await interaction.respond([]); // return no choices if error
    }
}

// Log in to Discord with your client's token
client.login(process.env.DISCORD_TOKEN);
