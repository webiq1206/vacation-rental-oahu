import { useState } from "react";
import { Info } from "lucide-react";
import { formatCurrency, calculateTotalBeforeTaxes } from "@/lib/pricing-utils";
import type { PricingBreakdown as PricingData } from "@/lib/pricing-utils";
import { PricingBreakdown } from "./pricing-breakdown";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface PricingBreakdownLinkProps {
  pricing: PricingData;
}

export function PricingBreakdownLink({ pricing }: PricingBreakdownLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalBeforeTaxes = calculateTotalBeforeTaxes(pricing);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-luxury-sm font-serif font-normal text-muted-foreground underline hover:text-foreground transition-colors"
          data-testid="pricing-breakdown-link"
          aria-label="View detailed pricing breakdown"
        >
          <span data-testid="total-before-taxes-text">
            Total before taxes: {formatCurrency(totalBeforeTaxes)}
          </span>
          <Info className="h-3 w-3" data-testid="pricing-breakdown-icon" aria-hidden="true" />
        </button>
      </SheetTrigger>
      
      <SheetContent 
        side="bottom" 
        className="h-fit max-h-[80vh] overflow-y-auto"
        data-testid="pricing-breakdown-sheet"
      >
        <SheetHeader className="pb-4">
          <SheetTitle data-testid="sheet-title">Price details</SheetTitle>
        </SheetHeader>
        
        <div className="pb-6">
          <PricingBreakdown pricing={pricing} />
        </div>
      </SheetContent>
    </Sheet>
  );
}