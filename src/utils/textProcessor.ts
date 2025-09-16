interface WordFrequency {
  [word: string]: number;
}

interface WordData {
  text: string;
  size: number;
  frequency: number;
}

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'cannot', 'cant',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs',
  'this', 'that', 'these', 'those', 'here', 'there', 'where', 'when', 'why', 'how',
  'what', 'which', 'who', 'whom', 'whose', 'if', 'then', 'else', 'than', 'as', 'so',
  'very', 'really', 'quite', 'just', 'only', 'still', 'also', 'too', 'much', 'many',
  'more', 'most', 'less', 'few', 'some', 'any', 'all', 'no', 'not', 'yes', 'well'
]);

export function processText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
}

export function calculateWordFrequencies(texts: string[]): WordFrequency {
  const frequencies: WordFrequency = {};

  texts.forEach(text => {
    const words = processText(text);
    words.forEach(word => {
      frequencies[word] = (frequencies[word] || 0) + 1;
    });
  });

  return frequencies;
}

export function createWordCloudData(
  frequencies: WordFrequency,
  maxWords: number = 50,
  minFrequency: number = 1
): WordData[] {
  const entries = Object.entries(frequencies)
    .filter(([, freq]) => freq >= minFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxWords);

  if (entries.length === 0) return [];

  const maxFreq = entries[0][1];
  const minSize = 12;
  const maxSize = 64;

  return entries.map(([word, frequency]) => ({
    text: word,
    frequency,
    size: minSize + ((frequency / maxFreq) * (maxSize - minSize))
  }));
}

export function addTextToFrequencies(
  currentFrequencies: WordFrequency,
  newText: string
): WordFrequency {
  const words = processText(newText);
  const updatedFrequencies = { ...currentFrequencies };

  words.forEach(word => {
    updatedFrequencies[word] = (updatedFrequencies[word] || 0) + 1;
  });

  return updatedFrequencies;
}