import { config } from './config';

/**
 * RapidAPI configuration
 */
export interface RapidAPIConfig {
  enabled: boolean;
  proxySecret: string;
  planMapping: Record<string, string>; // RapidAPI plan -> Internal tier
}

/**
 * RapidAPI plan to internal tier mapping
 */
export const RAPIDAPI_PLAN_MAPPING: Record<string, string> = {
  'free': 'FREE',
  'basic': 'STARTER',
  'pro': 'PRO',
  'enterprise': 'ENTERPRISE',
  'mega': 'ENTERPRISE',
  'ultra': 'ENTERPRISE',
};

/**
 * Get RapidAPI configuration
 */
export const getRapidAPIConfig = (): RapidAPIConfig => {
  return {
    enabled: process.env.RAPIDAPI_ENABLED === 'true',
    proxySecret: process.env.RAPIDAPI_PROXY_SECRET || '',
    planMapping: RAPIDAPI_PLAN_MAPPING,
  };
};

/**
 * Check if RapidAPI is enabled
 */
export const isRapidAPIEnabled = (): boolean => {
  return getRapidAPIConfig().enabled;
};

/**
 * Map RapidAPI plan to internal tier
 */
export const mapRapidAPIPlanToTier = (rapidapiPlan: string): string => {
  const mapping = getRapidAPIConfig().planMapping;
  const normalizedPlan = rapidapiPlan.toLowerCase();
  return mapping[normalizedPlan] || 'FREE';
};
