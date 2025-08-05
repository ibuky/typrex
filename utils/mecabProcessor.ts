// utils/mecabProcessor.ts
import { exec } from 'child_process';

/**
 * Converts Katakana to Hiragana.
 * @param text The text in Katakana.
 * @returns The converted text in Hiragana.
 */
function katakanaToHiragana(text: string): string {
  return text.replace(/["\u30a1-\u30f6"]/g, (match) => {
    const charCode = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(charCode);
  });
}

/**
 * Pre-processes text to handle mixed numbers with Kanji units for mecab.
 * @param text The input text.
 * @returns The processed text.
 */
function preprocessForMecab(text: string): string {
  return text.replace(/億/g, 'おく').replace(/万/g, 'まん').replace(/千/g, 'せん');
}

/**
 * Uses mecab to generate kana readings for the given text.
 * This function includes pre-processing for numbers and post-processing for katakana to hiragana conversion.
 * @param text The input text.
 * @returns The text with readings in Hiragana.
 */
export function getKanaReading(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const processedText = preprocessForMecab(text);
    const sanitizedText = processedText.replace(/"/g, '\"').replace(/`/g, '\`').replace(/\$/g, '\\$');
    const command = `echo "${sanitizedText}" | mecab -O yomi`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Mecab execution failed:', stderr);
        reject(new Error('Mecab execution failed. Is mecab installed and in your PATH?'));
        return;
      }
      resolve(katakanaToHiragana(stdout.trim()));
    });
  });
}
