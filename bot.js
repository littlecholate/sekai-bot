import { config } from 'dotenv';
import { Client, Events, Collection, GatewayIntentBits, Partials, MessageFlags } from 'discord.js';
import fs from 'node:fs';
import { loadConfig } from './utils/config.js';
import { handleHornBot } from './utils/handleHornBot.js';
import { handleTranslate } from './utils/handleTranslate.js';
import { startSchedulers } from './utils/scheduler.js';

config(); // read variables in .env

// Discord client instance setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
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
    // only called once when the bot successfully connects, preventing multiple instances of your cron jobs
    startSchedulers(client);
});

// ===== Message Handlers =====
client.on('messageCreate', async (message, user) => {
    if (message.author.bot && message.author.id !== '1116946826877227068') return; // avoid loops

    const guildId = message.guild?.id;
    if (!guildId) return; // skip direct messages

    const config = loadConfig(guildId);

    // Check if current channel is in listenChannels
    if (config['horn_bot'].listenChannels.includes(message.channel.id)) {
        const response = await handleHornBot(message.content, user);
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

// ===== Message Reaction Add =====
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    // Trigger on the configured emoji
    if (reaction.emoji.id === process.env.TRANSLATE_TRIGGER_EMOJI_ID) {
        await handleTranslate(reaction, user);
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
