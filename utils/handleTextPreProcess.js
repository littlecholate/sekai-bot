export function handleTextPreProcess(content) {
    try {
        // Extract message content to translate.
        let cleanedText = content.replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{2600}-\u{27BF}]/gu, '');
        cleanedText = cleanedText.replace(/<a?:\w+:\d+>/g, ''); // remove custom Discord emojis <:name:id> or <a:name:id>
        cleanedText = cleanedText.replace(/:\w+:/g, ''); // remove shorthand :name:
        cleanedText = cleanedText.replace(/(https?:\/\/[^\s)]+)|(<#[0-9]+>)|(<@&?[0-9]+>)/g, ''); // remove link
        cleanedText = cleanedText.trim();

        // insert space if content is five numbers
        cleanedText = cleanedText.replace(/(\d{5})/g, (match) => match.split('').join(' '));
        return cleanedText;
    } catch (error) {
        console.error('Error during text preprocessing: ', error);
    }
}
