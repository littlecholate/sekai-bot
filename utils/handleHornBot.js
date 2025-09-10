import { franc } from 'franc';

export function handleHornBot(content, user) {
    if (content.startsWith(';')) return; // block messages starting with ";"
    // console.log(content);

    // Extract message content to translate.
    let cleanedText = content.replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{2600}-\u{27BF}]/gu, '');
    cleanedText = cleanedText.replace(/<a?:\w+:\d+>/g, ''); // remove custom Discord emojis <:name:id> or <a:name:id>
    cleanedText = cleanedText.replace(/:\w+:/g, ''); // remove shorthand :name: (if you also want to strip those)
    cleanedText = cleanedText.replace(/(https?:\/\/[^\s)]+)|(<#[0-9]+>)|(<@&?[0-9]+>)/g, '');
    cleanedText = cleanedText.trim();
    if (!cleanedText) return;

    // Detect language

    // minLength tells franc the minimum number of characters needed to try detection.
    const langCode = franc(cleanedText, { minLength: 1 }); // detects ISO 639-3

    let prefix = ';sv en-US ';

    // Map franc code to our prefixes
    if (langCode === 'cmn') prefix = ';sv zh-CN ' + user.globalName + ' '; // Chinese
    else if (langCode === 'eng') prefix = ';sv en-US ' + user.globalName + ' '; // English
    else if (langCode === 'jpn') prefix = ';sv ja ' + user.globalName + ' '; // Japanese

    // console.log(user); // use user.globalName

    // Send the message to the other channel with the ;sv prefix
    return prefix + cleanedText;
}
