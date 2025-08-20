import { SlashCommandBuilder } from 'discord.js';
import { loadConfig, saveConfig } from '../utils/config.js';

// Setup command set data
export const data = new SlashCommandBuilder()
    .setName('set')
    .setDescription('Set various bot configs')
    .addStringOption((opt) =>
        opt
            .setName('action')
            .setDescription('Setting channel action for bot')
            .setRequired(true)
            .addChoices(
                { name: '開始監聽', value: 'listen_start' },
                { name: '停止監聽', value: 'listen_end' },
                { name: '設定回覆頻道', value: 'reply_start' },
                { name: '移除回覆頻道', value: 'reply_end' }
            )
    )
    .addChannelOption((opt) => opt.setName('channel').setDescription('Channel to do action').setRequired(true))
    .addStringOption((opt) =>
        opt
            .setName('util')
            .setDescription('Name of utils')
            .setRequired(true)
            .addChoices({ name: 'for_HornBot', value: 'horn_bot' }, { name: 'for_translation', value: 'translation' })
    );

// Setup command set execute function
export async function execute(interaction) {
    const action = interaction.options.getString('action');
    const util = interaction.options.getString('util');
    const channel = interaction.options.getChannel('channel');
    const channelId = channel.id;
    const guildId = interaction.guildId;

    // Load from cache or file
    const config = loadConfig(guildId);

    // Ensure nested structures
    if (!config[util]) config[util] = { listenChannels: [], replyChannels: [] };

    let replyMsg = '';

    switch (action) {
        case 'listen_start':
            if (!config[util].listenChannels.includes(channelId)) {
                config[util].listenChannels.push(channelId);
            }
            replyMsg = `✅ Bot listening channel for **${util}** is set to <#${channelId}>`;
            break;
        case 'listen_end':
            config[util].listenChannels = config[util].listenChannels.filter((id) => id !== channelId);
            replyMsg = `✅ Bot listening channel for **${util}** removed`;
            break;
        case 'reply_start':
            if (!config[util].replyChannels.includes(channelId)) {
                config[util].replyChannels.push(channelId);
            }
            replyMsg = `✅ Bot replying channel for **${util}** is set to <#${channelId}>`;
            break;
        case 'reply_end':
            config[util].replyChannels = config[util].replyChannels.filter((id) => id !== channelId);
            replyMsg = `✅ Bot replying channel for **${util}** removed`;
            break;
        default:
            replyMsg = '⚠️ Unknown action';
            break;
    }

    // Save back to cache and file
    saveConfig(guildId, config);

    await interaction.reply(replyMsg);
}
