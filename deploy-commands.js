import { config } from 'dotenv';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'node:fs';

config(); // read variables in .env

// Read all the commands in command folder
const commands = [];
const commandFiles = readdirSync('./commands').filter((file) => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    const command = await import(`./commands/${file}`); // using dynamic import
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command ${file} is missing a required "data" or "execute" property.`);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy your commands to discord servers!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const guildIds = process.env.SERVER_ID.split(',');
        // The rest put method is used to fully refresh all commands
        // 1. If commands need protection or fast update, use Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.SERVER_ID)
        // 2. If not, use Routes.applicationCommands(process.env.CLIENT_ID)
        for (const guildId of guildIds) {
            const data = await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId), {
                body: commands,
            });
            console.log(`Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`);
        }
    } catch (error) {
        console.error(error);
    }
})();
