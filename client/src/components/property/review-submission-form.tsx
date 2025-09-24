import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, AlertCircle, MessageSquare, Calendar, User, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertGuestReviewSchema } from "@shared/schema";
import { z } from "zod";

const reviewFormSchema = insertGuestReviewSchema.extend({
  review_text: z.string().max(500, "Review must be 500 characters or less").optional(),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

interface ReviewSubmissionFormProps {
  trigger?: React.ReactNode;
}

export function ReviewSubmissionForm({ trigger }: ReviewSubmissionFormProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{eligible: boolean; verified: boolean} | null>(null);
  const { toast } = useToast();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      guest_name: "",
      guest_email: "",
      location: "",
      rating: 0,
      stay_start_date: "",
      stay_end_date: "",
      trip_type: undefined,
      review_text: "",
      would_recommend: true,
    },
  });

  const watchedText = form.watch("review_text");
  const characterCount = watchedText?.length || 0;

  // Verification mutation
  const verifyEligibility = useMutation({
    mutationFn: async (data: { email: string; start_date: string; end_date: string }) => {
      const params = new URLSearchParams({
        email: data.email,
        start_date: data.start_date,
        end_date: data.end_date,
      });
      const response = await fetch(`/api/reviews/verify?${params}`);
      if (!response.ok) throw new Error("Failed to verify eligibility");
      return response.json();
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      setIsVerifying(false);
      if (data.eligible) {
        setStep(2);
        toast({
          title: "Verification successful!",
          description: data.verified 
            ? "We found your booking and verified your stay." 
            : "We found a booking with your email. You can proceed with your review.",
        });
      } else {
        toast({
          title: "Unable to verify stay",
          description: "We couldn't find a booking matching your email and dates. Please check your information.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setIsVerifying(false);
      toast({
        title: "Verification failed",
        description: "There was an error verifying your stay. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Review submission mutation
  const submitReview = useMutation({
    mutationFn: (data: ReviewFormData) => apiRequest("POST", "/api/reviews/submit", data),
    onSuccess: (data) => {
      toast({
        title: "Review submitted successfully!",
        description: "Thank you for your feedback! Your review will be published after approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/summary"] });
      setOpen(false);
      setStep(1);
      form.reset();
      setRating(0);
      setVerificationResult(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit review",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleVerification = async () => {
    const email = form.getValues("guest_email");
    const startDate = form.getValues("stay_start_date");
    const endDate = form.getValues("stay_end_date");

    if (!email || !startDate || !endDate) {
      toast({
        title: "Missing information",
        description: "Please fill in your email and stay dates.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    verifyEligibility.mutate({
      email,
      start_date: startDate,
      end_date: endDate,
    });
  };

  const onSubmit = (data: ReviewFormData) => {
    const reviewData = {
      ...data,
      rating,
    };
    submitReview.mutate(reviewData);
  };

  const renderStars = (currentRating: number, interactive = false, size = "w-8 h-8") => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isActive = starValue <= (interactive ? (hoveredRating || rating) : currentRating);
      
      return (
        <Star
          key={i}
          className={`${size} cursor-${interactive ? 'pointer' : 'default'} transition-colors ${
            isActive ? 'text-yellow-400 fill-current' : 'text-muted-foreground/50'
          }`}
          onClick={interactive ? () => {
            setRating(starValue);
            form.setValue("rating", starValue);
          } : undefined}
          onMouseEnter={interactive ? () => setHoveredRating(starValue) : undefined}
          onMouseLeave={interactive ? () => setHoveredRating(0) : undefined}
          data-testid={`rating-star-${starValue}`}
        />
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            className="btn-bronze text-white font-semibold py-3 px-8 rounded-lg"
            data-testid="submit-review-trigger"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Write a Review
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-coral-500" />
            Share Your Experience
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-coral-500' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                step >= 1 ? 'border-coral-500 bg-coral-500 text-white' : 'border-muted-foreground/30'
              }`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="text-sm font-medium">Verification</span>
            </div>
            
            <div className={`flex-1 h-px ${step > 1 ? 'bg-coral-500' : 'bg-muted-foreground/30'}`} />
            
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-coral-500' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                step >= 2 ? 'border-coral-500 bg-coral-500 text-white' : 'border-muted-foreground/30'
              }`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="text-sm font-medium">Your Review</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center text-muted-foreground">
                    <p>First, let's verify that you stayed with us. This helps ensure authentic reviews.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="guest_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Your Name
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter your full name" 
                              {...field} 
                              data-testid="input-guest-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="guest_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Enter your email" 
                              {...field} 
                              data-testid="input-guest-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stay_start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Check-in Date
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              data-testid="input-checkin-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stay_end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Check-out Date
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              data-testid="input-checkout-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Location (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="City, State/Country" 
                            {...field} 
                            data-testid="input-location"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    onClick={handleVerification}
                    disabled={isVerifying}
                    className="w-full btn-bronze text-white"
                    data-testid="verify-eligibility-button"
                  >
                    {isVerifying ? "Verifying..." : "Verify My Stay"}
                  </Button>

                  {verificationResult && !verificationResult.eligible && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Unable to verify your stay</p>
                        <p className="text-sm text-red-600 mt-1">
                          We couldn't find a booking matching your email and dates. Please double-check your information or contact us for assistance.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {verificationResult && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Stay verified!</p>
                        <p className="text-sm text-green-600 mt-1">
                          {verificationResult.verified 
                            ? "We found your booking and verified your stay dates."
                            : "We found a booking with your email."
                          }
                        </p>
                        {verificationResult.verified && (
                          <Badge variant="secondary" className="mt-2 bg-green-100 text-green-800">
                            Verified Guest
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <FormLabel className="text-lg font-semibold">How would you rate your stay?</FormLabel>
                    <div className="flex justify-center">
                      <div className="flex space-x-2">
                        {renderStars(rating, true)}
                      </div>
                    </div>
                    {rating > 0 && (
                      <p className="text-center text-sm text-muted-foreground">
                        {rating === 1 && "Poor"}
                        {rating === 2 && "Fair"}
                        {rating === 3 && "Good"}
                        {rating === 4 && "Very Good"}
                        {rating === 5 && "Excellent"}
                      </p>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="trip_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trip Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-trip-type">
                              <SelectValue placeholder="Select your trip type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Solo">Solo</SelectItem>
                            <SelectItem value="Couple">Couple</SelectItem>
                            <SelectItem value="Family">Family</SelectItem>
                            <SelectItem value="Group">Group</SelectItem>
                            <SelectItem value="Business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="review_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tell us about your experience (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share details about your stay, what you loved, or suggestions for improvement..."
                            className="min-h-[120px] resize-none"
                            maxLength={500}
                            {...field}
                            data-testid="textarea-review-text"
                          />
                        </FormControl>
                        <div className="flex justify-between items-center">
                          <FormMessage />
                          <span className={`text-sm ${characterCount > 450 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                            {characterCount}/500
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="would_recommend"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Would you recommend this place to others?</FormLabel>
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant={field.value === true ? "default" : "outline"}
                            onClick={() => field.onChange(true)}
                            className="flex-1"
                            data-testid="recommend-yes"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Yes, I'd recommend it
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === false ? "default" : "outline"}
                            onClick={() => field.onChange(false)}
                            className="flex-1"
                            data-testid="recommend-no"
                          >
                            No, I wouldn't recommend it
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1"
                      data-testid="back-to-verification"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={rating === 0 || submitReview.isPending}
                      className="flex-1 emerald-gradient text-white"
                      data-testid="submit-review-button"
                    >
                      {submitReview.isPending ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}