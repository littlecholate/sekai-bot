import { config } from 'dotenv';
import { GoogleGenAI } from '@google/genai';

config(); // read variables in .env

const DEFAULT_ROLE_TO_LANG = {
    // Map role display names → Gemini target_lang
    中文: 'Traditional Chinese',
    EN: 'English',
    日本語: 'Japanese',
};

export async function handleTranslate(reaction, user) {
    try {
        // Fetch partials if needed (reactions/messages can be partial)
        if (reaction.partial) await reaction.fetch().catch(() => {});
        const msg = reaction.message?.partial ? await reaction.message.fetch().catch(() => null) : reaction.message;
        if (!msg) return;

        // Ensure we have a guild & member context (skip DMs)
        const guild = msg.guild;
        if (!guild) return;

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return;

        // Determine target language from member's roles
        const role = member.roles.cache.find((r) => DEFAULT_ROLE_TO_LANG[r.name]);
        let targetLang = role ? DEFAULT_ROLE_TO_LANG[role.name] : null;
        if (!targetLang) {
            // No mapped role; quietly ignore to avoid spam
            return;
        }

        // Extract message content to translate.
        let cleanedText = msg.content.replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{2600}-\u{27BF}]/gu, '');
        cleanedText = cleanedText.replace(/<a?:\w+:\d+>/g, ''); // remove custom Discord emojis <:name:id> or <a:name:id>
        cleanedText = cleanedText.replace(/:\w+:/g, ''); // remove shorthand :name: (if you also want to strip those)
        cleanedText = cleanedText.replace(/(https?:\/\/[^\s)]+)|(<#[0-9]+>)|(<@&?[0-9]+>)/g, '');
        cleanedText = cleanedText.trim();
        if (!cleanedText) return;

        const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

        const prompt = `Translate following text into ${targetLang}.
            The input text might be in Chinese, English, or Japanese.
            ONLY provide the translated plain text and nothing else. 
            Text to translate: "${cleanedText}"
        `;
        // Send the prompt to the Gemini API
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });
        if (!response) return;

        // Reply to the original message so the context is clear.
        await msg.reply({
            content: `<:Translate:1413900737028821133>  ${response.text}`,
        });
    } catch (err) {
        // Robust error guard: never throw beyond the listener.
        console.error('[handleTranslate] Error:', err);
        try {
            // Best-effort, non-spammy error surface (only if we have a message context)
            if (reaction?.message?.reply) {
                await reaction.message.reply('⚠️ Translation failed. Please try again later.').catch(() => {});
            }
        } catch (_) {}
    }
}
