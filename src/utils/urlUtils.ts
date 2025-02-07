
const PRODUCTION_DOMAIN = 'pwaburton.co.uk';

export const getBaseUrl = (): string => {
  // Priority:
  // 1. Environment variable (if set)
  // 2. Production domain check
  // 3. Current window location
  return import.meta.env.VITE_APP_URL || 
         (window.location.hostname === PRODUCTION_DOMAIN ? `https://${PRODUCTION_DOMAIN}` : 
         window.location.origin);
};

export const isValidDomain = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname;
    return hostname === PRODUCTION_DOMAIN || 
           hostname === 'localhost' || 
           hostname.endsWith('.localhost') ||
           hostname.includes('.lovable.dev');
  } catch {
    return false;
  }
};
