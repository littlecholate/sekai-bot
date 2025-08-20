import path from 'node:path';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const configs = {}; // in-memory config cache

// load the config files to in-memory cache at the beginning
export function loadConfig(guildId) {
    if (configs[guildId]) return configs[guildId];

    const filePath = path.join(process.cwd(), `configs/${guildId}.json`);
    let data = {};

    // config not in memory cache, read the files
    try {
        if (existsSync(filePath)) {
            const raw = readFileSync(filePath, 'utf-8');
            data = JSON.parse(raw);
        }
    } catch (err) {
        console.error(`Failed to read config for guild ${guildId}:`, err);
    }

    // Cache in memory
    configs[guildId] = data;
    return data;
}

// save the config to config files but also in-memory cache in run time
export function saveConfig(guildId, config) {
    configs[guildId] = config; // update cache

    const filePath = path.join(process.cwd(), `configs/${guildId}.json`);

    try {
        writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (err) {
        console.error(`Failed to save config for guild ${guildId}:`, err);
    }
}
