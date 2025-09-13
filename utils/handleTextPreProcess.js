export function handleTextPreProcess(content) {
    try {
        // Extract message content to translate.
        let cleanedText = content.replace(
            /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{2600}-\u{27BF}]/gu |
                /<a?:\w+:\d+>/g |
                /:\w+:/g |
                /(https?:\/\/[^\s)]+)|(<#[0-9]+>)|(<@&?[0-9]+>)/g |
                /[?!~,.:+-*/]/g,
            ''
        );
        cleanedText = cleanedText.trim();

        // insert space if content is five numbers
        cleanedText = cleanedText.replace(/(\d{5})/g, (match) => match.split('').join(' '));
        return cleanedText;
    } catch (error) {
        console.error('Error during text preprocessing: ', error);
    }
}
