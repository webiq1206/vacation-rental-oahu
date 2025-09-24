import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, ExpressCheckoutElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, Lock, Shield, Smartphone, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobilePaymentFormProps {
  onPaymentSuccess?: () => void;
  total: string;
  currency?: string;
}

export function MobilePaymentForm({ onPaymentSuccess, total, currency = "USD" }: MobilePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'express' | 'standard'>('express');
  const [expressPaymentReady, setExpressPaymentReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment.",
          variant: "destructive",
        });
      } else {
        onPaymentSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Payment Error", 
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExpressPayment = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Express payment failed.",
          variant: "destructive",
        });
      } else {
        onPaymentSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "Express payment failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const expressCheckoutOptions = {
    buttonType: 'pay' as const,
    buttonHeight: 48,
    buttonTheme: {
      theme: 'dark' as const
    },
    layout: 'horizontal' as const,
    paymentMethods: {
      applePay: 'always' as const,
      googlePay: 'always' as const,
      link: 'auto' as const,
    },
  };

  return (
    <div className="space-y-6" data-testid="mobile-payment-form" role="region" aria-label="Mobile payment form">
      {/* Screen reader announcements for payment status */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only" data-testid="payment-status-announcer">
        {isProcessing ? "Processing payment, please wait..." : ""}
      </div>
      {/* Express Payment Methods - Mobile First */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20" data-testid="express-checkout-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-accent-foreground">
                <Smartphone className="h-5 w-5 mr-2" aria-hidden="true" />
                Express Checkout
              </CardTitle>
              <p className="text-luxury-sm font-serif font-normal text-muted-foreground">
                Pay instantly with Apple Pay, Google Pay, or Link
              </p>
            </CardHeader>
            <CardContent data-testid="express-checkout-content">
              <div className="space-y-4" data-testid="express-checkout-wrapper">
                <ExpressCheckoutElement
                  options={expressCheckoutOptions}
                  onConfirm={handleExpressPayment}
                  onReady={() => setExpressPaymentReady(true)}
                  onLoadError={(error) => {
                    console.warn('Express checkout not available:', error);
                    setExpressPaymentReady(false);
                  }}
                  data-testid="express-checkout-element"
                />
                
                {!expressPaymentReady && (
                  <div className="text-center py-4" data-testid="express-checkout-loading" role="status" aria-live="polite">
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span className="text-luxury-sm font-serif font-normal">Loading express payment options...</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Or Separator - Only show if express payment is available */}
      <AnimatePresence>
        {isMobile && expressPaymentReady && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-4 py-2"
            data-testid="payment-method-separator"
            aria-label="Alternative payment methods separator"
          >
            <Separator className="flex-1" />
            <span className="text-luxury-sm font-serif font-normal text-muted-foreground bg-background px-3 py-1 rounded-full">
              or pay with card
            </span>
            <Separator className="flex-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Standard Payment Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: isMobile ? 0.1 : 0 }}
      >
        <Card className="luxury-card-border" data-testid="payment-details-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-success" aria-hidden="true" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6" data-testid="payment-form" aria-label="Secure payment form">
              <div className="mobile-payment-element" data-testid="payment-element-container">
                <PaymentElement 
                  options={{
                    layout: 'tabs',
                    paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
                    fields: {
                      billingDetails: {
                        name: 'auto',
                        email: 'auto',
                        phone: 'auto',
                        address: {
                          line1: 'auto',
                          line2: 'auto',
                          city: 'auto',
                          state: 'auto',
                          postalCode: 'auto',
                          country: 'auto',
                        },
                      },
                    },
                    terms: {
                      card: 'auto',
                    },
                  }}
                  data-testid="payment-element"
                />
              </div>

              <Button
                type="submit"
                variant="bronze"
                size="lg"
                className="w-full btn-bronze-enhanced font-serif font-normal tracking-luxury-tight py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] touch-target-optimal"
                disabled={!stripe || isProcessing}
                data-testid="mobile-pay-button"
                aria-label={isProcessing ? `Processing payment of $${total}` : `Pay $${total} securely`}
                aria-describedby="payment-security-info"
              >
                {isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center"
                  >
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Processing payment...
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center"
                  >
                    <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                    Pay ${total}
                  </motion.div>
                )}
              </Button>
            </form>

            {/* Security Info */}
            <div className="mt-4 flex items-center justify-center text-luxury-sm font-serif font-normal text-muted-foreground" id="payment-security-info">
              <Shield className="h-4 w-4 mr-1" aria-hidden="true" />
              <span>Secured by Stripe</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile-Optimized Security Features */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-success/10 border-success/20" data-testid="security-features-card">
            <CardContent className="pt-6" data-testid="security-features-content">
              <div className="space-y-3 text-luxury-sm font-serif font-normal">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-serif font-normal text-success/90">Bank-level security</p>
                    <p className="text-success/80">Your payment information is encrypted and secure.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-serif font-normal text-accent-foreground">Instant confirmation</p>
                    <p className="text-muted-foreground">Receive booking confirmation immediately after payment.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-serif font-normal text-primary/90">24/7 support</p>
                    <p className="text-primary/80">Our team is available to help with any payment issues.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}