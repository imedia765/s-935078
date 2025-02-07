
const PRODUCTION_DOMAIN = 'pwaburton.co.uk';
const PRODUCTION_URL = `https://${PRODUCTION_DOMAIN}`;

export const getBaseUrl = (): string => {
  // Simple check: if we're in production domain, use HTTPS, otherwise use current origin
  return window.location.hostname === PRODUCTION_DOMAIN ? PRODUCTION_URL : window.location.origin;
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
