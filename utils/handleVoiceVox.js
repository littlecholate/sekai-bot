import { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType } from '@discordjs/voice';

// A single function to handle the entire "speak" command
export async function handleVoiceVox(message) {
    const voiceChannel = await client.channels.fetch('1415758733912571984');

    try {
        // Step 1: Query the VOICEVOX API to get the audio query JSON
        const queryUrl = `http://127.0.0.1:50021/audio_query?speaker=89&text=${encodeURIComponent(textToSpeak)}`;
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

        // Step 3: Connect to the voice channel and stream the audio
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        connection.subscribe(player);

        const audioStream = synthesisResponse.body; // Get the readable stream from the fetch response
        const resource = createAudioResource(audioStream, {
            inputType: StreamType.Arbitrary,
        });

        player.play(resource);

        player.on('stateChange', (oldState, newState) => {
            if (newState.status === 'idle') {
                // You could disconnect here
                // connection.destroy();
            }
        });
    } catch (error) {
        console.error('Error during voice command:', error);
        message.reply('An error occurred while processing your request.');
    }
}
