// Common email domain typos and their corrections
const COMMON_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com',
  'outloook.com': 'outlook.com',
  'icoud.com': 'icloud.com',
  'iclod.com': 'icloud.com',
  'iclould.com': 'icloud.com',
  'gmaill.net': 'gmail.com',
  'yhaoo.com': 'yahoo.com',
  'hotmaiil.com': 'hotmail.com',
};

const VALID_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'mail.com',
  'live.com',
  'msn.com',
  'me.com',
  'mac.com',
  'yandex.com',
];

// Strict RFC-5322 simplified regex for email validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export type EmailValidationResult = {
  valid: boolean;
  suggestion: string | null;
  error: string | null;
};

export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, suggestion: null, error: 'Email address is required.' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, suggestion: null, error: 'Please enter a valid email address.' };
  }

  const [localPart, domain] = trimmed.split('@');

  if (localPart.length < 1) {
    return { valid: false, suggestion: null, error: 'Please enter a valid email address.' };
  }

  if (domain.length < 3 || !domain.includes('.')) {
    return { valid: false, suggestion: null, error: 'Please enter a valid email address.' };
  }

  // Check for common typos
  const correctedDomain = COMMON_TYPOS[domain];
  if (correctedDomain) {
    const suggested = `${localPart}@${correctedDomain}`;
    return {
      valid: false,
      suggestion: suggested,
      error: `Did you mean ${suggested}?`,
    };
  }

  // Check if domain is suspiciously close to a known valid domain (Levenshtein distance)
  if (!VALID_DOMAINS.includes(domain)) {
    const closest = findClosestDomain(domain);
    if (closest) {
      const suggested = `${localPart}@${closest}`;
      return {
        valid: false,
        suggestion: suggested,
        error: `Did you mean ${suggested}?`,
      };
    }
  }

  return { valid: true, suggestion: null, error: null };
}

function findClosestDomain(domain: string): string | null {
  let minDistance = Infinity;
  let closest: string | null = null;

  for (const valid of VALID_DOMAINS) {
    const distance = levenshtein(domain, valid);
    if (distance < minDistance && distance <= 2) {
      minDistance = distance;
      closest = valid;
    }
  }

  return closest;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
