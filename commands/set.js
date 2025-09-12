import { SlashCommandBuilder, ChannelType } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection, createAudioPlayer } from '@discordjs/voice';
import { loadConfig, saveConfig, players } from '../utils/config.js';

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
        opt.setName('util').setDescription('Name of utils').setRequired(true).addChoices({ name: 'for_tts', value: 'tts' })
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

            // Enter voice channel if it is set
            try {
                if (channel.type === ChannelType.GuildVoice) {
                    // Check if a connection already exists
                    if (getVoiceConnection(guildId)) return;

                    // Join the voice channel
                    const connection = joinVoiceChannel({
                        channelId: channelId,
                        guildId: guildId,
                        adapterCreator: channel.guild.voiceAdapterCreator,
                        selfDeaf: true, // bot CANNOT hear
                        selfMute: false, // bot can still speak
                    });

                    // Create the audio player and store it
                    const player = createAudioPlayer();
                    players.set(guildId, player);
                    connection.subscribe(player);
                }
            } catch (err) {
                console.error(`Failed to connect to voice channel ${channelId}`, err);
            }
            break;
        case 'reply_end':
            config[util].replyChannels = config[util].replyChannels.filter((id) => id !== channelId);
            replyMsg = `✅ Bot replying channel for **${util}** removed`;
            // Leave voice channel if it is set
            try {
                if (channel.type === ChannelType.GuildVoice) {
                    // Check if a connection already exists
                    const connection = getVoiceConnection(guildId);
                    const player = players.get(guildId);

                    // Unsubscribe the player to prevent new audio from being played
                    if (player) {
                        player.stop();
                        players.delete(guildId);
                    }

                    // Destroy the voice connection to make the bot leave
                    connection.destroy();
                }
            } catch (err) {
                console.error(`Failed to connect to voice channel ${channelId}`, err);
            }
            break;
        default:
            replyMsg = '⚠️ Unknown action';
            break;
    }

    // Save back to cache and file
    saveConfig(guildId, config);

    await interaction.reply(replyMsg);
}
