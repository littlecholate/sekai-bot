import { franc } from 'franc';

export function handleHornBot(content, username) {
    if (content.startsWith(';')) return; // block messages starting with ";"
    // console.log(content);

    // Extract message content to translate.
    let cleanedText = content.replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{2600}-\u{27BF}]/gu, '');
    cleanedText = cleanedText.replace(/<a?:\w+:\d+>/g, ''); // remove custom Discord emojis <:name:id> or <a:name:id>
    cleanedText = cleanedText.replace(/:\w+:/g, ''); // remove shorthand :name: (if you also want to strip those)
    cleanedText = cleanedText.replace(/(https?:\/\/[^\s)]+)|(<#[0-9]+>)|(<@&?[0-9]+>)/g, '');
    cleanedText = cleanedText.trim();
    if (!cleanedText) return;

    // insert space if content is five numbers
    cleanedText = cleanedText.replace(/(\d{5})/g, (match) => match.split('').join(' '));

    // minLength tells franc the minimum number of characters needed to try detection.
    const langCode = franc(cleanedText, { minLength: 1 }); // detects ISO 639-3

    let prefix = ';sv en-US ' + username + ' say '; // English

    console.log(username + ' ' + langCode);

    // Map franc code to our prefixes
    if (langCode === 'cmn') prefix = ';sv zh-CN ' + username + ' 說 '; // Chinese
    else if (langCode === 'jpn') prefix = ';sv ja ' + username + ' '; // Japanese

    // Send the message to the other channel with the ;sv prefix
    return prefix + cleanedText;
}
