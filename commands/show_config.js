import { SlashCommandBuilder } from 'discord.js';
import { loadConfig } from '../utils/config.js';

// Setup command show_config data
export const data = new SlashCommandBuilder()
    .setName('show_config')
    .setDescription('Show the current channel configuration for this server');

// Setup command show_config execute function
export async function execute(interaction) {
    const guildId = interaction.guild.id;
    const config = loadConfig(guildId);

    if (!config || Object.keys(config).length === 0) {
        await interaction.reply('⚠️ No channel configuration found for this server.');
        return;
    }

    let response = `📑 **Channel Configuration for ${interaction.guild.name}**\n\n`;

    Object.entries(config).forEach(([util, data]) => {
        response += `**${util}**\n\n`;

        // Iterate through listenChannels
        response += '正在監聽的頻道: ';
        if (data.listenChannels && Array.isArray(data.listenChannels)) {
            data.listenChannels.forEach((channelId) => {
                response += `<#${channelId}> `;
            });
            response += '\n';
        }

        // Iterate through replyChannels
        response += '設定回覆的頻道: ';
        if (data.replyChannels && Array.isArray(data.replyChannels)) {
            data.replyChannels.forEach((channelId) => {
                response += `<#${channelId}> `;
            });
        }
        response += '\n\n';
    });
    await interaction.reply(response);
}
