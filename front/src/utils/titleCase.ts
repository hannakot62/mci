const SMALL_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'nor',
  'for',
  'yet',
  'so',
  'in',
  'on',
  'at',
  'to',
  'from',
  'by',
  'with',
  'as',
  'of',
  'vs',
  'via',
]);

/** Title case for button labels (articles, conjunctions, prepositions stay lowercase). */
export function toButtonLabel(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) {
        return lower;
      }
      if (word.length === 0) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
