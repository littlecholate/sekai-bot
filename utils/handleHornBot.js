import { franc } from 'franc';

export function handleHornBot(content) {
    if (content.startsWith(';')) return; // block messages starting with ";"

    // console.log(content);

    // Remove emojis from message content
    const cleanedText = content.replace(/[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F02F}\u{2600}-\u{27BF}]/gu, '').trim();
    if (!cleanedText) return; // if text is empty after removing emojis, skip

    // Detect language
    let prefix = ';sv en-US '; // default

    // minLength tells franc the minimum number of characters needed to try detection.
    const langCode = franc(cleanedText, { minLength: 1 }); // detects ISO 639-3

    // Map franc code to our prefixes
    if (langCode === 'cmn') prefix = ';sv zh-CN '; // Chinese
    else if (langCode === 'jpn') prefix = ';sv ja '; // Japanese

    // Send the message to the other channel with the ;sv prefix
    return prefix + cleanedText;
}
