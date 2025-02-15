const PRODUCTION_DOMAIN = 'www.pwaburton.co.uk';
const PRODUCTION_URL = `https://${PRODUCTION_DOMAIN}`;

export const getBaseUrl = (forceProduction: boolean = false): string => {
  // Always return production URL for auth-related operations (forceProduction = true)
  if (forceProduction) {
    return PRODUCTION_URL;
  }

  return window.location.hostname === PRODUCTION_DOMAIN ? 
    PRODUCTION_URL : window.location.origin;
};

export const isValidDomain = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname;
    return hostname === PRODUCTION_DOMAIN || 
           hostname === 'localhost' || 
           hostname.endsWith('.localhost');
  } catch {
    return false;
  }
};

export const normalizeProductionUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Keep www.pwaburton.co.uk as is since it's our production domain
    if (urlObj.hostname === PRODUCTION_DOMAIN) {
      return url;
    }
    // If we're on a non-production domain, keep it as is
    return url;
  } catch {
    return url;
  }
};
