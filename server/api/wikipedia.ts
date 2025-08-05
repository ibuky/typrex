// server/api/wikipedia.ts
import { defineEventHandler } from 'h3';
import axios from 'axios';
import { getKanaReading } from '../../utils/mecabProcessor';

async function fetchWikipediaSummary(title: string): Promise<string> {
  const url = `https://ja.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&titles=${encodeURIComponent(title)}`;
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TypingGame/1.0 (https://example.com)'
      }
    });
    const data = response.data;
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId === '-1') throw new Error('Article not found.');
    return pages[pageId].extract;
  } catch (error) {
    console.error('Failed to fetch from Wikipedia:', error);
    return '';
  }
}

export default defineEventHandler(async (event) => {
  const title = '日本'; // You can later get this from query params: getQuery(event).title

  try {
    let summary = await fetchWikipediaSummary(title);
    if (!summary) {
      throw new Error('Failed to fetch summary.');
    }

    // Normalize text by removing content in parentheses and standardizing whitespace.
    summary = summary.replace(/（[^）]*）/g, '').replace(/\s+/g, ' ').trim();

    const kanaSummary = await getKanaReading(summary);

    const originalSentences = summary.split('。').filter(s => s.trim().length > 0);
    const kanaSentences = kanaSummary.split('。').filter(s => s.trim().length > 0);

    if (originalSentences.length !== kanaSentences.length) {
      console.error('Sentence count mismatch between original and kana.');
      throw new Error('Problem generation failed due to sentence mismatch.');
    }

    const problems = originalSentences.map((sentence, index) => ({
      word: sentence.trim() + '。',
      kana: kanaSentences[index].trim() + '。',
    }));

    return problems;
  } catch (error: any) {
    console.error('Error in API route:', error);
    event.node.res.statusCode = 500;
    return { error: error.message };
  }
});