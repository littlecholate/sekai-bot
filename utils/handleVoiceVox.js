import { createAudioResource, StreamType, getVoiceConnection } from '@discordjs/voice';
import { players } from '../utils/config.js';

// A single function to handle the entire "speak" command
export async function handleVoiceVox(message, guildId) {
    try {
        // Step 1: Query the VOICEVOX API to get the audio query JSON
        const queryUrl = `http://127.0.0.1:50021/audio_query?speaker=89&text=${encodeURIComponent(message)}`;
        const queryResponse = await fetch(queryUrl, { method: 'POST' });

        if (!queryResponse.ok) {
            throw new Error(`API Error: Status ${queryResponse.status}`);
        }
        const audioQuery = await queryResponse.json();

        // Step 2: Synthesis the audio and create a stream
        const synthesisUrl = `http://127.00.1:50021/synthesis?speaker=89`;
        const synthesisResponse = await fetch(synthesisUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(audioQuery),
        });

        if (!synthesisResponse.ok) {
            throw new Error(`Synthesis API Error: Status ${synthesisResponse.status}`);
        }

        const audioStream = synthesisResponse.body; // Get the readable stream from the fetch response

        // Step 3: Connect to the voice channel and stream the audio
        const connection = getVoiceConnection(guildId);
        if (!connection) {
            console.error('Bot is not in a voice channel in this guild.');
            return;
        }

        // Retrieve the existing player for this guild
        const player = players.get(guildId);
        if (!player) {
            console.error('Audio player not found for this guild.');
            return;
        }

        const resource = createAudioResource(audioStream, {
            inputType: StreamType.Arbitrary,
        });

        player.play(resource);
    } catch (error) {
        console.error('Error during voice command: ', error);
    }
}
