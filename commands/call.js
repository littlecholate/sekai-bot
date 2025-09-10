// commands/call.js
// Slash command: /call targets:"<@123> <@456>"
// Sends "Hi @A, @B, @C" every 5 minutes, 3 total rounds.
// If a mentioned user reacts to the message, they are removed from future rounds

import { SlashCommandBuilder, MessageFlags } from 'discord.js';

// Setup command show_config data
export const data = new SlashCommandBuilder()
    .setName('morning_call')
    .setDescription('Ping a set of people every 5 minutes (3 times), removing anyone who reacts.')
    .addStringOption((opt) => opt.setName('people').setDescription('Mentions of names (e.g., @A @B @C).').setRequired(true));

// Setup command show_config execute function
export async function execute(interaction) {
    // We’ll send messages in the same channel where the command is used
    const channel = interaction.channel;
    if (!channel) {
        return interaction.reply({
            content: 'This command can only be used in a server text channel.',
            flags: MessageFlags.Ephemeral,
        });
    }

    // Parse mention IDs strictly from the provided string: <@123>, <@!123> formats
    const raw = interaction.options.getString('people', true);
    const idRegex = /<@!?(?<id>\d{5,})>/g;
    const ids = new Set(); // unique, preserves insertion order via spreading later
    let match;
    while ((match = idRegex.exec(raw)) !== null) {
        ids.add(match.groups.id);
    }

    if (ids.size === 0) {
        return interaction.reply({
            content: 'No valid mentions found. Please use formats like "<@727548193218232371>".',
            flags: MessageFlags.Ephemeral,
        });
    }

    // Track users who opt out by reacting
    const optedOut = new Set();

    // Prepare 3 rounds, 3 minutes apart
    const TOTAL_ROUNDS = 3;
    const INTERVAL_MS = 3 * 60 * 1000; // 5 minutes

    // Helper to render the mention line using remaining IDs
    const renderLine = () => {
        const remaining = [...ids].filter((id) => !optedOut.has(id));
        return {
            remaining,
            text:
                '嗨 ' +
                remaining.map((id) => `<@${id}>`).join(', ') +
                '\n\nお越しいただき、お手伝いありがとうございます。次の交代でお手伝いを開始していただきます。準備ができましたら、絵文字をクリックして完了をお知らせください。' +
                '\n感謝您前來幫忙，您將於下一梯次開始協助，請點擊表情符號表示準備完成' +
                '\nThank you for coming to assist. You will begin your assistance with the next rotation. Please click the emoji to confirm you are ready.',
        };
    };

    // Send status to the invoker (ephemeral) so they know it started
    await interaction.reply({
        content: `Starting calls for ${ids.size} user(s) every 3 minutes, for 3 times`,
        flags: MessageFlags.Ephemeral,
    });

    // Fire each round via setTimeout; we also attach a reaction collector per message.
    const scheduleRound = async (roundIndex = 1) => {
        try {
            const { remaining, text } = renderLine();

            // If everyone opted out, stop early
            if (remaining.length === 0) {
                // Optional: notify the invoker quietly (no spam)
                try {
                    await interaction.followUp({
                        content: `Everyone opted out. Stopping.`,
                        flags: MessageFlags.Ephemeral,
                    });
                } catch (_) {}
                return;
            }

            // Send the round message
            const msg = await channel.send({ content: text });

            // Create a reaction collector so mentioned users can opt out by reacting with anything
            // Collector lasts until the next round (or a bit less if it's the last round)
            const duration = roundIndex < TOTAL_ROUNDS ? INTERVAL_MS - 5000 : 2 * 60 * 1000; // 2 min for last round
            const filter = (reaction, user) => {
                // ignore bot reactions; accept any emoji if the reactor is currently targeted
                return !user.bot && remaining.includes(user.id);
            };

            const collector = msg.createReactionCollector({ filter, time: duration, dispose: true });

            collector.on('collect', async (_reaction, user) => {
                try {
                    // Mark them as opted out for future rounds
                    if (!optedOut.has(user.id)) {
                        optedOut.add(user.id);
                        // (Optional) Acknowledge with a short reply (kept small to avoid noise)
                        await msg.reply({ content: `<@${user.id}>, thank you for coming.` });
                    }
                    console.log(optedOut);
                } catch (_) {}
            });

            collector.on('remove', async (_reaction, user) => {
                if (user.bot) return;
                if (optedOut.has(user.id)) {
                    optedOut.delete(user.id); // user changed mind; include them in future rounds again
                }
                console.log(optedOut);
            });

            collector.on('end', () => {
                // noop; the optedOut set has been updated during collection
                console.log('end ' + optedOut);
            });

            // For convenience, add a quick ✅ so users know they can react
            // (Any emoji works; this is just a hint)
            try {
                await msg.react('✅');
            } catch (_) {}

            // Schedule next round if needed
            if (roundIndex < TOTAL_ROUNDS) {
                setTimeout(() => scheduleRound(roundIndex + 1).catch(() => {}), INTERVAL_MS);
            }
        } catch (err) {
            // Log and soft-notify the user; do not crash the bot
            console.error('[call command] round failed:', err);
            try {
                await interaction.followUp({
                    content: `Something went wrong in round ${roundIndex}. Check logs.`,
                    flags: MessageFlags.Ephemeral,
                });
            } catch (_) {}
        }
    };

    // Kick off round 1 immediately
    await scheduleRound(1);
}
