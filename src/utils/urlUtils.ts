
const PRODUCTION_DOMAIN = 'pwaburton.co.uk';
const PRODUCTION_URL = `https://${PRODUCTION_DOMAIN}`;
const WWW_PRODUCTION_DOMAIN = `www.${PRODUCTION_DOMAIN}`;

export const getBaseUrl = (forceProduction: boolean = false): string => {
  // Always return production URL for auth-related operations (forceProduction = true)
  // And always return non-www version
  if (forceProduction) {
    return PRODUCTION_URL;
  }

  const currentHostname = window.location.hostname;
  if (currentHostname === WWW_PRODUCTION_DOMAIN) {
    return PRODUCTION_URL;
  }

  return currentHostname === PRODUCTION_DOMAIN ? PRODUCTION_URL : window.location.origin;
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
    // If we're on www.pwaburton.co.uk, redirect to pwaburton.co.uk
    if (urlObj.hostname === WWW_PRODUCTION_DOMAIN) {
      urlObj.hostname = PRODUCTION_DOMAIN;
      return urlObj.toString();
    }
    return url;
  } catch {
    return url;
  }
};

