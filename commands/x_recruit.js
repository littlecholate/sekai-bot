import { SlashCommandBuilder } from 'discord.js';
import { readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';

const CONFIG_FILE = './configs/last_recruit.json';

// Setup command x_recruit data
export const data = new SlashCommandBuilder()
    .setName('x_recruit')
    .setDescription('Recruit X members')
    .addStringOption((opt) =>
        opt
            .setName('歌')
            .setDescription('Song for playing')
            .setRequired(true)
            .addChoices(
                { name: 'ロスエン', value: 'ロスエン' },
                { name: '🦐', value: '🦐' },
                { name: 'おまかせ', value: 'おまかせ' }
            )
    )
    .addStringOption((opt) => opt.setName('主').setDescription('The % of the leader').setRequired(true).setAutocomplete(true))
    .addStringOption((opt) => opt.setName('募').setDescription('The % of members').setRequired(true).setAutocomplete(true))
    .addStringOption((opt) => opt.setName('房號').setDescription('Room number').setRequired(true))
    .addStringOption((opt) => opt.setName('回數').setDescription('Playing times').setRequired(true));

// Setup command x_recruit execute function
export async function execute(interaction) {
    // Get values from interaction data
    const song = interaction.options.getString('歌');
    const main = interaction.options.getString('主');
    const want = interaction.options.getString('募');
    const room = interaction.options.getString('房號');
    const time = interaction.options.getString('回數');

    // Save current value into last_recruit.json
    writeFileSync(CONFIG_FILE, JSON.stringify({ main, want }), 'utf8');

    try {
        const template = await readFile('x_template/post.txt', 'utf-8');
        const content = template
            .replace(/{{song}}/g, song)
            .replace(/{{main}}/g, main)
            .replace(/{{want}}/g, want)
            .replace(/{{room}}/g, room)
            .replace(/{{time}}/g, time);
        // console.log(content);

        const safeForDiscord = content.replace(/%/g, '%25'); // double-encode "%" symbol
        const encodedText = encodeURIComponent(safeForDiscord);
        const tweetLink = `https://twitter.com/intent/tweet?text=${encodedText}`;

        // Send the link first time
        await interaction.reply(`[Click here to tweet](<${tweetLink}>)`);
        const message = await interaction.fetchReply();

        // Update every 10 seconds, total repeat 6 times
        let elapsed = 0;
        const interval = setInterval(async () => {
            elapsed += 1;
            if (elapsed >= 6) {
                clearInterval(interval);
                return;
            }
            try {
                const newTweetLink = tweetLink + '🙏'.repeat(elapsed);
                await message.edit(`[Click here to tweet](<${newTweetLink}>) - link has refreshed ${elapsed} times`);
            } catch (error) {
                console.error('Failed to re-edit message:', error);
                clearInterval(interval);
            }
        }, 10000);
    } catch (error) {
        console.error('Error:', error);
        await interaction.reply('❌ Failed to post tweet. Make sure the format is valid.');
    }
}

// Setup command x_recruit autocomplete function
export async function autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);

    try {
        // Read default values from the config.json file
        const config = JSON.parse(await readFile(CONFIG_FILE, 'utf8'));

        let choice = '';
        if (focusedOption.name === '主') {
            choice = config.main;
        } else if (focusedOption.name === '募') {
            choice = config.want;
        }
        // Respond the array type, dc autocomplete about giving the user a list of suggestions to choose
        await interaction.respond([{ name: choice, value: choice }]);
    } catch (error) {
        console.error('Autocomplete read error:', error);
        await interaction.respond([]);
    }
}
