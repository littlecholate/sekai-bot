import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { config } from 'dotenv';

import { execute as morningCallExecute } from '../commands/call.js';
const COMMANDS_FILE = path.resolve('./public/call_scheduler.json');

config(); // read variables in .env

const runScheduledTask = async (client) => {
    try {
        const fileContent = await fs.readFile(COMMANDS_FILE, 'utf-8');
        const commandsConfig = JSON.parse(fileContent);

        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');

        // --- The only line that changes ---
        const currentTimeKey = `${month}${day}-${hour}${minute}`;

        const commandLine = commandsConfig[currentTimeKey];
        if (commandLine) {
            console.log(`[CRON] Found command for ${currentTimeKey}: "${commandLine}"`);

            const [commandName, ...args] = commandLine.split(' ');

            const GUILD_ID = process.env.SHEDULE_GUILD;
            const CHANNEL_ID = process.env.SHEDULE_CHANNEL;

            const guild = client.guilds.cache.get(GUILD_ID);
            const channel = guild.channels.cache.get(CHANNEL_ID);

            if (!guild || !channel) {
                console.error('[CRON] Error: Guild or Channel not found. Cannot execute command.');
                return;
            }

            const mockInteraction = {
                channel,
                options: {
                    getString: (name) => (name === 'people' ? args.join(' ') : null),
                },
                reply: async ({ content, flags }) => {
                    console.log(`[MOCK REPLY] ${content}`);
                },
            };

            console.log('[CRON] Executing command...');
            await morningCallExecute(mockInteraction);
        } else {
            console.log(`[CRON] No command scheduled for current time.`);
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`[CRON] Error: commands.json file not found at ${COMMANDS_FILE}`);
        } else {
            console.error('[CRON] An unexpected error occurred:', err);
        }
    }
};

export const startSchedulers = (client) => {
    console.log('Starting schedulers...');
    // Schedule the command to run every hour at the 50-minute mark
    cron.schedule(
        '50 * * * *',
        () => {
            console.log('[CRON] Scheduled task running...');
            runScheduledTask(client);
        },
        {
            timezone: 'Asia/Taipei',
        }
    );
};
