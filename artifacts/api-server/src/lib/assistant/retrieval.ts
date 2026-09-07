import { HELP_ARTICLES, type HelpArticle, type SupportedLocale } from "@workspace/content";

/**
 * Deterministic retrieval over the verified help articles.
 *
 * This is the same philosophy as the help page's substring search: no model in
 * the loop, no failure mode. It serves two purposes:
 *  1. The fallback answer when Gemini is not configured or fails — the visitor
 *     still gets the verified answer text, verbatim.
 *  2. The "sources" shown under an assistant reply, so every answer points at
 *     the article it came from.
 */

/** Arabic is matched on its skeleton: no diacritics, unified alef/ya/ta-marbuta. */
export function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "") // harakat, dagger alef, tatweel
    .replace(/[\u0622\u0623\u0625\u0627]/g, "\u0627") // آ أ إ ا → ا
    .replace(/\u0649/g, "\u064A") // ى → ي
    .replace(/\u0629/g, "\u0647"); // ة → ه
}

const STOPWORDS = new Set([
  // Arabic function words
  "في", "من", "على", "الي", "عن", "مع", "هل", "ما", "ماذا", "كيف", "متي", "اين", "لماذا",
  "هو", "هي", "هما", "ان", "إن", "اذا", "لكن", "او", "أو", "ثم", "قد", "لا", "لم", "لن",
  "انا", "انت", "انتم", "نحن", "كل", "بعد", "قبل", "عند", "هنا", "هناك", "يوم", "الان",
  "هل", "اريد", "أريد", "ممكن", "لو", "لقد", "به", "لها", "له", "هذا", "هذه", "ذلك",
  // English function words
  "the", "a", "an", "is", "are", "am", "do", "does", "did", "how", "what", "when", "where",
  "why", "who", "i", "you", "my", "your", "we", "our", "to", "of", "in", "on", "for", "with",
  "and", "or", "it", "its", "this", "that", "can", "will", "would", "should", "if", "at",
  "be", "been", "was", "were", "have", "has", "get", "got", "me", "about", "from", "by",
]);

/** Light stemming so morphology does not break matching: Arabic definite article, English inflection. */
function stemToken(token: string): string {
  if (/[\u0600-\u06FF]/.test(token)) {
    return token.length > 3 && token.startsWith("\u0627\u0644") ? token.slice(2) : token; // ال التعريف
  }
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("ing")) return token.slice(0, -3);
  if (token.endsWith("es")) return token.slice(0, -2);
  if (token.endsWith("s") && !token.endsWith("ss")) return token.slice(0, -1);
  if (token.endsWith("e")) return token.slice(0, -1);
  return token;
}

export function tokenize(text: string): string[] {
  return normaliseText(text)
    .split(/[^\p{L}\p{N}#]+/u)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
    .map(stemToken);
}

export type ArticleMatch = {
  article: HelpArticle;
  score: number;
};

/**
 * Score one article against the message. Questions carry more weight than
 * answers, and both languages are always searched — a visitor writing Arabic
 * must still match an article they read in English and vice versa.
 */
export function scoreArticle(article: HelpArticle, messageTokens: string[]): number {
  if (messageTokens.length === 0) return 0;
  const questionTokens = new Set([
    ...tokenize(article.question.ar),
    ...tokenize(article.question.en),
  ]);
  const answerTokens = new Set([
    ...tokenize(article.answer.ar),
    ...tokenize(article.answer.en),
  ]);

  let score = 0;
  for (const token of messageTokens) {
    if (questionTokens.has(token)) score += 3;
    else if (answerTokens.has(token)) score += 1;
  }
  return score / Math.sqrt(messageTokens.length);
}

export function retrieveArticles(message: string, _locale: SupportedLocale, limit = 3): ArticleMatch[] {
  const tokens = tokenize(message);
  const matches = HELP_ARTICLES.map((article) => ({ article, score: scoreArticle(article, tokens) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
  return matches.slice(0, limit);
}
