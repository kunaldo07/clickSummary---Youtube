// Pricing configuration by country/region
export const PRICING_BY_COUNTRY = {
  // India
  IN: {
    currency: '₹',
    currencyCode: 'INR',
    monthly: 800,
    discountedMonthly: 400,
    hourlyValue: 500,
    monthlyValue: 40000,
    roi: '50x',
    freeValue: {
      summaries: 150,
      chat: 100
    },
    premiumValue: {
      summaries: 2000,
      chat: 1500,
      formats: 500,
      export: 300,
      priority: 400,
      custom: 300
    }
  },
  
  // United States
  US: {
    currency: '$',
    currencyCode: 'USD',
    monthly: 10,
    discountedMonthly: 5,
    hourlyValue: 25,
    monthlyValue: 2000,
    roi: '200x',
    freeValue: {
      summaries: 5,
      chat: 3
    },
    premiumValue: {
      summaries: 50,
      chat: 40,
      formats: 15,
      export: 10,
      priority: 20,
      custom: 10
    }
  },
  
  // United Kingdom
  GB: {
    currency: '£',
    currencyCode: 'GBP',
    monthly: 8,
    discountedMonthly: 4,
    hourlyValue: 20,
    monthlyValue: 1600,
    roi: '200x',
    freeValue: {
      summaries: 4,
      chat: 2
    },
    premiumValue: {
      summaries: 40,
      chat: 30,
      formats: 12,
      export: 8,
      priority: 15,
      custom: 8
    }
  },
  
  // European Union (Euro zone)
  EU: {
    currency: '€',
    currencyCode: 'EUR',
    monthly: 9,
    discountedMonthly: 4.5,
    hourlyValue: 22,
    monthlyValue: 1760,
    roi: '195x',
    freeValue: {
      summaries: 4,
      chat: 2
    },
    premiumValue: {
      summaries: 45,
      chat: 35,
      formats: 13,
      export: 9,
      priority: 17,
      custom: 9
    }
  },
  
  // Canada
  CA: {
    currency: 'C$',
    currencyCode: 'CAD',
    monthly: 13,
    discountedMonthly: 6.5,
    hourlyValue: 30,
    monthlyValue: 2400,
    roi: '185x',
    freeValue: {
      summaries: 5,
      chat: 3
    },
    premiumValue: {
      summaries: 50,
      chat: 40,
      formats: 15,
      export: 10,
      priority: 20,
      custom: 10
    }
  },
  
  // Australia
  AU: {
    currency: 'A$',
    currencyCode: 'AUD',
    monthly: 15,
    discountedMonthly: 7.5,
    hourlyValue: 35,
    monthlyValue: 2800,
    roi: '187x',
    freeValue: {
      summaries: 6,
      chat: 3
    },
    premiumValue: {
      summaries: 55,
      chat: 45,
      formats: 17,
      export: 12,
      priority: 22,
      custom: 12
    }
  },
  
  // Singapore
  SG: {
    currency: 'S$',
    currencyCode: 'SGD',
    monthly: 13,
    discountedMonthly: 6.5,
    hourlyValue: 30,
    monthlyValue: 2400,
    roi: '185x',
    freeValue: {
      summaries: 5,
      chat: 3
    },
    premiumValue: {
      summaries: 50,
      chat: 40,
      formats: 15,
      export: 10,
      priority: 20,
      custom: 10
    }
  },
  
  // Brazil
  BR: {
    currency: 'R$',
    currencyCode: 'BRL',
    monthly: 50,
    discountedMonthly: 25,
    hourlyValue: 100,
    monthlyValue: 8000,
    roi: '160x',
    freeValue: {
      summaries: 10,
      chat: 5
    },
    premiumValue: {
      summaries: 100,
      chat: 80,
      formats: 25,
      export: 15,
      priority: 30,
      custom: 15
    }
  },
  
  // Default (fallback to USD)
  DEFAULT: {
    currency: '$',
    currencyCode: 'USD',
    monthly: 10,
    discountedMonthly: 5,
    hourlyValue: 25,
    monthlyValue: 2000,
    roi: '200x',
    freeValue: {
      summaries: 5,
      chat: 3
    },
    premiumValue: {
      summaries: 50,
      chat: 40,
      formats: 15,
      export: 10,
      priority: 20,
      custom: 10
    }
  }
};

// Euro zone countries
const EURO_COUNTRIES = [
  'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT',
  'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'
];

/**
 * Detect user's country using multiple methods
 * @returns {Promise<string>} Country code (ISO 3166-1 alpha-2)
 */
export async function detectUserCountry() {
  try {
    // Method 1: Try timezone-based detection first (fast, no API call)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneCountryMap = {
      'Asia/Kolkata': 'IN',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'Europe/London': 'GB',
      'Europe/Paris': 'FR',
      'Europe/Berlin': 'DE',
      'America/Toronto': 'CA',
      'Australia/Sydney': 'AU',
      'Asia/Singapore': 'SG',
      'America/Sao_Paulo': 'BR'
    };
    
    if (timezoneCountryMap[timezone]) {
      return timezoneCountryMap[timezone];
    }
    
    // Method 2: Use IP-based geolocation API (free tier)
    const response = await fetch('https://ipapi.co/json/', {
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.country_code || 'DEFAULT';
    }
    
    // Method 3: Fallback to browser language
    const language = navigator.language || navigator.userLanguage;
    const langCountryMap = {
      'en-US': 'US',
      'en-GB': 'GB',
      'en-CA': 'CA',
      'en-AU': 'AU',
      'hi-IN': 'IN',
      'pt-BR': 'BR',
      'fr-FR': 'FR',
      'de-DE': 'DE'
    };
    
    if (langCountryMap[language]) {
      return langCountryMap[language];
    }
    
    return 'DEFAULT';
  } catch (error) {
    console.error('Error detecting country:', error);
    return 'DEFAULT';
  }
}

/**
 * Get pricing configuration for a specific country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {object} Pricing configuration
 */
export function getPricingForCountry(countryCode) {
  // Check if country uses Euro
  if (EURO_COUNTRIES.includes(countryCode)) {
    return PRICING_BY_COUNTRY.EU;
  }
  
  // Return country-specific pricing or default
  return PRICING_BY_COUNTRY[countryCode] || PRICING_BY_COUNTRY.DEFAULT;
}

/**
 * Format price with currency symbol
 * @param {number} amount - Price amount
 * @param {string} currency - Currency symbol
 * @returns {string} Formatted price
 */
export function formatPrice(amount, currency) {
  // Handle decimal places for different currencies
  const hasDecimals = amount % 1 !== 0;
  const formatted = hasDecimals ? amount.toFixed(2) : amount;
  
  return `${currency}${formatted}`;
}
