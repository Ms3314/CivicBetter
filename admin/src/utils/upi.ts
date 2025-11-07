/**
 * UPI Deep Link Generator
 * Supports multiple UPI providers: Google Pay, PhonePe, Paytm, BHIM, etc.
 */

export type UPIProvider = 'googlepay' | 'phonepe' | 'paytm' | 'bhim' | 'generic';

export interface UPIPaymentParams {
  upiId: string; // e.g., 9876543210@paytm, username@oksbi
  name: string; // Worker name
  amount: number; // Amount in rupees
  currency?: string; // Default: INR
  transactionNote?: string; // Optional note
}

/**
 * Generate generic UPI payment link (works with all UPI apps)
 */
export function generateUPILink(params: UPIPaymentParams): string {
  const { upiId, name, amount, currency = 'INR', transactionNote } = params;
  
  const note = transactionNote || `Payment for ${name}`;
  
  // Standard UPI deep link format
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(note)}`;
  
  return upiLink;
}

/**
 * Generate provider-specific UPI links
 */
export function generateProviderUPILink(
  params: UPIPaymentParams,
  provider: UPIProvider
): string {
  const { upiId, name, amount, currency = 'INR', transactionNote } = params;
  const note = transactionNote || `Payment for ${name}`;

  switch (provider) {
    case 'googlepay':
      // Google Pay deep link
      return `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(note)}`;
    
    case 'phonepe':
      // PhonePe deep link
      return `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(note)}`;
    
    case 'paytm':
      // Paytm deep link
      return `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(note)}`;
    
    case 'bhim':
      // BHIM UPI deep link
      return `bhim://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(note)}`;
    
    case 'generic':
    default:
      // Generic UPI link (works with all apps)
      return generateUPILink(params);
  }
}

/**
 * Get all provider links for a payment
 * Useful for showing multiple payment options
 */
export function getAllProviderLinks(params: UPIPaymentParams): Record<UPIProvider, string> {
  return {
    generic: generateUPILink(params),
    googlepay: generateProviderUPILink(params, 'googlepay'),
    phonepe: generateProviderUPILink(params, 'phonepe'),
    paytm: generateProviderUPILink(params, 'paytm'),
    bhim: generateProviderUPILink(params, 'bhim'),
  };
}

/**
 * Validate UPI ID format
 */
export function validateUPIId(upiId: string): boolean {
  // UPI ID format: username@provider
  // Examples: 9876543210@paytm, username@oksbi, name@ybl
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(upiId);
}

/**
 * Extract provider from UPI ID
 */
export function getProviderFromUPIId(upiId: string): string | null {
  const parts = upiId.split('@');
  if (parts.length !== 2) return null;
  
  const provider = parts[1].toLowerCase();
  
  // Map common provider codes
  const providerMap: Record<string, string> = {
    'paytm': 'Paytm',
    'ybl': 'PhonePe',
    'oksbi': 'SBI Pay',
    'okaxis': 'Axis Pay',
    'okhdfcbank': 'HDFC Pay',
    'okicici': 'ICICI Pay',
    'upi': 'Generic UPI',
  };
  
  return providerMap[provider] || provider.toUpperCase();
}

