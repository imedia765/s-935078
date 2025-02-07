const PRODUCTION_DOMAIN = 'pwaburton.co.uk';
const PRODUCTION_URL = `https://${PRODUCTION_DOMAIN}`;

export const getBaseUrl = (forceProduction: boolean = false): string => {
  // Always return production URL for auth-related operations (forceProduction = true)
  // Otherwise, use current domain for regular operations
  return forceProduction ? PRODUCTION_URL : (
    window.location.hostname === PRODUCTION_DOMAIN ? PRODUCTION_URL : window.location.origin
  );
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
