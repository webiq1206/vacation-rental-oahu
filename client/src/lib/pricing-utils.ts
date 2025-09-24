export interface PricingBreakdown {
  nights: number;
  nightlyRate: string;
  subtotal: string;
  cleaningFee: string;
  serviceFee: string;
  taxes: string;
  discount: string;
  total: string;
  breakdown: Array<{
    label: string;
    amount: string;
  }>;
  coupon?: {
    code: string;
    type: string;
    value: string;
  };
}

export function formatCurrency(amount: string | number): string {
  // Handle null, undefined, or empty string cases
  if (amount === null || amount === undefined || amount === '') {
    return '$0.00';
  }
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check for NaN or invalid numbers and return fallback
  if (isNaN(num) || !isFinite(num)) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function calculateTotalAmount(pricing: PricingBreakdown): string {
  const subtotal = isNaN(parseFloat(pricing.subtotal)) ? 0 : parseFloat(pricing.subtotal);
  const cleaning = isNaN(parseFloat(pricing.cleaningFee)) ? 0 : parseFloat(pricing.cleaningFee);
  const taxes = isNaN(parseFloat(pricing.taxes)) ? 0 : parseFloat(pricing.taxes);
  const discount = isNaN(parseFloat(pricing.discount)) ? 0 : parseFloat(pricing.discount);
  
  const total = subtotal + cleaning + taxes - discount;
  return isNaN(total) ? '0.00' : total.toFixed(2);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function calculateTotalBeforeTaxes(pricing: PricingBreakdown): string {
  const mainTotal = isNaN(parseFloat(pricing.total)) ? 0 : parseFloat(pricing.total);
  
  // Find all tax-related items in the breakdown
  const taxAmount = pricing.breakdown.reduce((acc, item) => {
    const isTaxItem = item.label.includes('TAT') || 
                     item.label.includes('GET') || 
                     item.label.includes('County Tax');
    
    if (isTaxItem) {
      const amount = isNaN(parseFloat(item.amount)) ? 0 : parseFloat(item.amount);
      return acc + amount;
    }
    return acc;
  }, 0);
  
  const totalBeforeTaxes = mainTotal - taxAmount;
  return isNaN(totalBeforeTaxes) ? '0.00' : totalBeforeTaxes.toFixed(2);
}
