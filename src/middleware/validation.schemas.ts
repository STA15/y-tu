import { body, ValidationChain } from 'express-validator';
import { sanitize } from './validation.utils';

/**
 * ISO 639-1 language codes (2-letter codes)
 * Common language codes for validation
 */
const ISO_639_1_CODES = [
  'aa', 'ab', 'ae', 'af', 'ak', 'am', 'an', 'ar', 'as', 'av', 'ay', 'az',
  'ba', 'be', 'bg', 'bh', 'bi', 'bm', 'bn', 'bo', 'br', 'bs',
  'ca', 'ce', 'ch', 'co', 'cr', 'cs', 'cu', 'cv', 'cy',
  'da', 'de', 'dv', 'dz',
  'ee', 'el', 'en', 'eo', 'es', 'et', 'eu',
  'fa', 'ff', 'fi', 'fj', 'fo', 'fr', 'fy',
  'ga', 'gd', 'gl', 'gn', 'gu', 'gv',
  'ha', 'he', 'hi', 'ho', 'hr', 'ht', 'hu', 'hy', 'hz',
  'ia', 'id', 'ie', 'ig', 'ii', 'ik', 'io', 'is', 'it', 'iu',
  'ja', 'jv',
  'ka', 'kg', 'ki', 'kj', 'kk', 'kl', 'km', 'kn', 'ko', 'kr', 'ks', 'ku', 'kv', 'kw', 'ky',
  'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv',
  'mg', 'mh', 'mi', 'mk', 'ml', 'mn', 'mr', 'ms', 'mt', 'my',
  'na', 'nb', 'nd', 'ne', 'ng', 'nl', 'nn', 'no', 'nr', 'nv', 'ny',
  'oc', 'oj', 'om', 'or', 'os',
  'pa', 'pi', 'pl', 'ps', 'pt',
  'qu',
  'rm', 'rn', 'ro', 'ru', 'rw',
  'sa', 'sc', 'sd', 'se', 'sg', 'si', 'sk', 'sl', 'sm', 'sn', 'so', 'sq', 'sr', 'ss', 'st', 'su', 'sv', 'sw',
  'ta', 'te', 'tg', 'th', 'ti', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty',
  'ug', 'uk', 'ur', 'uz',
  've', 'vi', 'vo',
  'wa', 'wo',
  'xh',
  'yi', 'yo',
  'za', 'zh', 'zu'
];

/**
 * Validates ISO 639-1 language code (2-letter code)
 */
export const validateLanguageCode = (fieldName: string = 'language'): ValidationChain => {
  return body(fieldName)
    .optional()
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .toLowerCase()
    .isLength({ min: 2, max: 2 })
    .withMessage(`${fieldName} must be a 2-letter ISO 639-1 code`)
    .isIn(ISO_639_1_CODES)
    .withMessage(`${fieldName} must be a valid ISO 639-1 language code`)
    .customSanitizer(sanitize);
};

/**
 * Validates required ISO 639-1 language code
 */
export const validateRequiredLanguageCode = (fieldName: string = 'language'): ValidationChain => {
  return body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .toLowerCase()
    .isLength({ min: 2, max: 2 })
    .withMessage(`${fieldName} must be a 2-letter ISO 639-1 code`)
    .isIn(ISO_639_1_CODES)
    .withMessage(`${fieldName} must be a valid ISO 639-1 language code`)
    .customSanitizer(sanitize);
};

/**
 * Validates text field (required, string, max 5000 chars)
 */
export const validateText = (fieldName: string = 'text', maxLength: number = 5000): ValidationChain => {
  return body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${fieldName} must be between 1 and ${maxLength} characters`)
    .customSanitizer(sanitize);
};

/**
 * Validates optional text field (string, max length)
 */
export const validateOptionalText = (fieldName: string = 'text', maxLength: number = 5000): ValidationChain => {
  return body(fieldName)
    .optional()
    .isString()
    .withMessage(`${fieldName} must be a string`)
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`${fieldName} must be between 1 and ${maxLength} characters`)
    .customSanitizer(sanitize);
};

/**
 * Validates tone field
 */
export const validateTone = (): ValidationChain => {
  return body('tone')
    .optional()
    .isString()
    .withMessage('Tone must be a string')
    .trim()
    .toLowerCase()
    .isIn(['professional', 'casual', 'friendly', 'formal', 'creative'])
    .withMessage('Tone must be one of: professional, casual, friendly, formal, creative')
    .customSanitizer(sanitize);
};

/**
 * Validates context field (optional, max 10000 chars)
 */
export const validateContext = (): ValidationChain => {
  return body('context')
    .optional()
    .isString()
    .withMessage('Context must be a string')
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Context must not exceed 10000 characters')
    .customSanitizer(sanitize);
};

/**
 * Validates options object for process endpoint
 */
export const validateProcessOptions = (): ValidationChain[] => {
  return [
    body('options')
      .optional()
      .isObject()
      .withMessage('Options must be an object'),
    body('options.analyzeTone')
      .optional()
      .isBoolean()
      .withMessage('options.analyzeTone must be a boolean'),
    body('options.translate')
      .optional()
      .isBoolean()
      .withMessage('options.translate must be a boolean'),
    body('options.generateResponse')
      .optional()
      .isBoolean()
      .withMessage('options.generateResponse must be a boolean')
  ];
};

/**
 * Validation schema for POST /translate
 */
export const translateValidationSchema = (): ValidationChain[] => {
  return [
    validateText('text', 5000),
    validateRequiredLanguageCode('targetLanguage'),
    validateLanguageCode('sourceLanguage')
  ];
};

/**
 * Validation schema for POST /analyze-tone
 */
export const analyzeToneValidationSchema = (): ValidationChain[] => {
  return [
    validateText('text', 5000),
    validateLanguageCode('language'),
    body('context')
      .optional()
      .isString()
      .withMessage('Context must be a string')
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Context must not exceed 1000 characters')
      .customSanitizer(sanitize)
  ];
};

/**
 * Validation schema for POST /generate-response
 */
export const generateResponseValidationSchema = (): ValidationChain[] => {
  return [
    validateText('originalText', 5000),
    validateContext(),
    validateTone(),
    validateLanguageCode('language')
  ];
};

/**
 * Validation schema for POST /process
 */
export const processValidationSchema = (): ValidationChain[] => {
  return [
    validateText('text', 5000),
    validateLanguageCode('sourceLanguage'),
    validateLanguageCode('targetLanguage'),
    validateContext(),
    ...validateProcessOptions()
  ];
};
