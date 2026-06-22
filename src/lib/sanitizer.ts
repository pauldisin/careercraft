/**
 * Utility for sanitizing and normalizing user-provided text inputs 
 * before they are passed to AI models. This acts as an additional layer 
 * of defense against prompt injection, malicious commands, and script execution,
 * while ensuring that normal character sets, formatting, and markdown are preserved.
 */

export function sanitizePromptInput(text: string): string {
  if (!text) return "";

  // 1. Unicode Normalization to ensure consistent UTF-8 representation
  let sanitized = text.normalize("NFC");

  // 2. Remove null bytes which can disrupt parsing or execute buffer tricks
  sanitized = sanitized.replace(/\0/g, "");

  // 3. Prevent XSS/HTML Script injection from entering prompt contexts
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "[script removed]");
  sanitized = sanitized.replace(/javascript:/gi, "[removed]");

  // 4. Clean out known structural injection tags and system directive spoofing
  const injectionPatterns = [
    /<\/?system>/gi,
    /<\/?instruction>/gi,
    /<\/?assistant>/gi,
    /<\/?user>/gi,
    /<\/?prompt>/gi,
    /\bignore\s+all\s+previous\s+instructions\b/gi,
    /\bignore\s+above\s+instructions\b/gi,
    /\bignore\s+the\s+above\s+instructions\b/gi,
    /\bignore\s+below\s+instructions\b/gi,
    /\bsystem\s+instruction:/gi,
    /\bsystem\s+directive:/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, "[removed]");
  }

  return sanitized.trim();
}

/**
 * Escapes HTML characters to prevent XSS and HTML injection vulnerabilities
 * when interpolating user-controlled values into HTML emails or templates.
 */
export function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

