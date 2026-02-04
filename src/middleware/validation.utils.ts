/**
 * Sanitization utility functions to prevent injection attacks
 */

/**
 * Sanitizes input by removing potentially dangerous characters
 * and normalizing whitespace
 */
export const sanitize = (value: string): string => {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove null bytes
  let sanitized = value.replace(/\0/g, '');
  
  // Normalize whitespace (replace multiple spaces/tabs with single space)
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
};

/**
 * Sanitizes HTML to prevent XSS attacks
 */
export const sanitizeHtml = (value: string): string => {
  if (typeof value !== 'string') {
    return value;
  }

  // Escape HTML entities
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates and sanitizes language code
 */
export const sanitizeLanguageCode = (value: string): string => {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Convert to lowercase and remove non-alphabetic characters
  return value.toLowerCase().replace(/[^a-z]/g, '').substring(0, 2);
};
