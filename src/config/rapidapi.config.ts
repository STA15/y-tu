import { ApiKeyTier } from '../models/apiKey.model';

/**
 * RapidAPI configuration
 */
interface RapidAPIConfig {
  enabled: boolean;
  proxySecret?: string;
}

/**
 * Get RapidAPI configuration from environment variables
 */
export const getRapidAPIConfig = (): RapidAPIConfig => {
  return {
    enabled: process.env.RAPIDAPI_ENABLED === 'true',
    proxySecret: process.env.RAPIDAPI_PROXY_SECRET
  };
};

/**
 * Check if RapidAPI integration is enabled
 */
export const isRapidAPIEnabled = (): boolean => {
  return getRapidAPIConfig().enabled;
};

/**
 * Map RapidAPI plan names to internal tier names
 * 
 * RapidAPI Pricing Structure:
 * - BASIC: $0/month, 100 requests/day
 * - PRO: $19/month, 1,000 requests/day  
 * - ULTRA: $49/month, 10,000 requests/day
 * - MEGA: $149/month, 100,000 requests/day
 * 
 * Internal Tier Mapping:
 * - FREE: 100 requests/day
 * - STARTER: 1,000 requests/day
 * - PRO: 10,000 requests/day
 * - ENTERPRISE: Unlimited
 */
export const mapRapidAPIPlanToTier = (plan: string): ApiKeyTier => {
  const planLower = plan.toLowerCase();
  
  // BASIC (FREE) on RapidAPI → FREE tier in code
  if (planLower.includes('basic') || planLower.includes('free') || planLower === '') {
    return ApiKeyTier.FREE;
  }
  
  // PRO ($19, 1K/day) on RapidAPI → STARTER tier in code
  if (planLower.includes('pro')) {
    return ApiKeyTier.STARTER;
  }
  
  // ULTRA ($49, 10K/day) on RapidAPI → PRO tier in code
  if (planLower.includes('ultra')) {
    return ApiKeyTier.PRO;
  }
  
  // MEGA ($149, 100K/day) on RapidAPI → ENTERPRISE tier in code
  if (planLower.includes('mega')) {
    return ApiKeyTier.ENTERPRISE;
  }
  
  // Default to FREE tier if plan is unknown
  return ApiKeyTier.FREE;
};