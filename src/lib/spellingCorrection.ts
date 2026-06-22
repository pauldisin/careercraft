/**
 * Centralized utility for auto-correcting common typos and spelling errors in documents.
 * This is designed to polish text and resume content before generation or export.
 */

interface CorrectionRule {
  pattern: RegExp;
  replacement: string;
  description?: string;
}

/**
 * Clean and configurable dictionary of typo corrections.
 * To add new rules or corrections, simply insert them into this array.
 */
const CORRECTION_RULES: CorrectionRule[] = [
  // Specific healthcare systems / company typos
  {
    pattern: /\bClician\b/g,
    replacement: "Clinician",
    description: "Capitalized 'Clician' typo to 'Clinician'"
  },
  {
    pattern: /\bclician\b/g,
    replacement: "clinician",
    description: "Lowercase 'clician' typo to 'clinician'"
  },
  {
    pattern: /BOUGAINVILLE HEALTH DEPARMENT/g,
    replacement: "BOUGAINVILLE HEALTH DEPARTMENT",
    description: "Fix common specific health department organizational typo"
  },
  
  // General high-frequency professional typos
  {
    pattern: /\bteh\b/g,
    replacement: "the",
    description: "Common 'teh' stroke error"
  },
  {
    pattern: /\bTeh\b/g,
    replacement: "The",
    description: "Common capitalized 'Teh' stroke error"
  },
  {
    pattern: /\breiceve\b/g,
    replacement: "receive",
    description: "'i before e' typo in receive"
  },
  {
    pattern: /\bseperate\b/g,
    replacement: "separate",
    description: "Common spelling mistake 'seperate'"
  },
  {
    pattern: /\bposisition\b/g,
    replacement: "position",
    description: "Common letter duplication in 'position'"
  },
  {
    pattern: /\bmanagment\b/g,
    replacement: "management",
    description: "Missing 'e' in 'management'"
  },
  {
    pattern: /\bresponsibilities\b/g,
    replacement: "responsibilities",
    description: "Spelling corrections"
  }
];

/**
 * Apply all centralized spelling correction and typo rules to the input text.
 * @param text The markdown or raw text body to run typo corrections on.
 */
export function correctSpellingTypos(text: string): string {
  if (!text) return text;
  
  let processed = text;
  for (const rule of CORRECTION_RULES) {
    processed = processed.replace(rule.pattern, rule.replacement);
  }
  
  return processed;
}
