import { formatCurrency } from "@/lib/pricing-utils";
import type { PricingBreakdown as PricingData } from "@/lib/pricing-utils";

interface PricingBreakdownProps {
  pricing: PricingData;
}

export function PricingBreakdown({ pricing }: PricingBreakdownProps) {
  // Combine tax-related items into a single "Taxes" line
  const processedBreakdown = pricing.breakdown.reduce((acc, item) => {
    const isTaxItem = item.label.includes('TAT') || 
                     item.label.includes('GET') || 
                     item.label.includes('County Tax');
    
    if (isTaxItem) {
      // Find existing taxes entry or create one
      const existingTaxIndex = acc.findIndex(accItem => accItem.label === 'Taxes');
      const taxAmount = isNaN(parseFloat(item.amount)) ? 0 : parseFloat(item.amount);
      
      if (existingTaxIndex >= 0) {
        // Add to existing taxes total
        const currentTotal = isNaN(parseFloat(acc[existingTaxIndex].amount)) ? 0 : parseFloat(acc[existingTaxIndex].amount);
        const newTotal = currentTotal + taxAmount;
        acc[existingTaxIndex].amount = isNaN(newTotal) ? '0.00' : newTotal.toFixed(2);
      } else {
        // Create new taxes entry
        acc.push({ label: 'Taxes', amount: isNaN(taxAmount) ? '0.00' : taxAmount.toFixed(2) });
      }
    } else {
      // Keep non-tax items as they are
      acc.push(item);
    }
    
    return acc;
  }, [] as Array<{ label: string; amount: string }>);

  return (
    <div className="space-y-3" data-testid="pricing-breakdown">
      {processedBreakdown.map((item, index) => (
        <div key={index} className="flex justify-between text-luxury-sm font-serif font-normal tracking-luxury-tight">
          <span className="text-muted-foreground" data-testid={`breakdown-label-${index}`}>
            {item.label}
          </span>
          <span data-testid={`breakdown-amount-${index}`}>
            {item.amount.startsWith('-') ? item.amount : formatCurrency(item.amount)}
          </span>
        </div>
      ))}
      
      <div className="flex justify-between font-serif font-normal text-luxury-base pt-3 border-t border-border">
        <span data-testid="total-label">Total</span>
        <span data-testid="total-amount">{formatCurrency(pricing.total)}</span>
      </div>

      {pricing.coupon && (
        <div className="text-luxury-xs font-serif font-normal text-secondary mt-2">
          ✓ Coupon "{pricing.coupon.code}" applied
        </div>
      )}
    </div>
  );
}
