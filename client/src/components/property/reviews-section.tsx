import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Star, CheckCircle, Search, Filter, ChevronLeft, ChevronRight, Shield, Award, Verified } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { motion, AnimatePresence } from "framer-motion";
import Autoplay from "embla-carousel-autoplay";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import type { GuestReview } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  reviewCounts: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

interface UnifiedReview {
  id: string;
  guest_name: string;
  guest_email?: string;
  location?: string;
  rating: number;
  review_date: Date;
  stay_start_date?: Date;
  stay_end_date?: Date;
  trip_type?: string;
  review_text?: string;
  would_recommend?: boolean;
  is_featured?: boolean;
  verified_guest?: boolean;
  reviewer_avatar_url?: string;
  source: "guest" | "airbnb";
  formattedDate: string;
  stayDuration?: number;
  trustScore: number;
}

function ReviewsSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterRating, setFilterRating] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [emblaApi, setEmblaApi] = useState<CarouselApi>();
  const [selectedReviewIndex, setSelectedReviewIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const reviewsPerPage = 6;
  
  const autoplayPlugin = useRef(Autoplay({ 
    delay: 4000, 
    stopOnInteraction: false, 
    stopOnMouseEnter: true,
    playOnInit: true 
  }));
  
  const wheelGesturesPlugin = useRef(WheelGesturesPlugin({
    forceWheelAxis: "x"
  }));

  // Fetch guest reviews (all reviews are stored in database)
  const { data: guestReviews, isLoading: guestReviewsLoading, error: guestReviewsError } = useQuery<GuestReview[]>({
    queryKey: ["/api/reviews/public"],
    retry: 3,
    staleTime: 5 * 60 * 1000
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<ReviewSummary>({
    queryKey: ["/api/reviews/summary"],
    retry: 3,
    staleTime: 5 * 60 * 1000
  });

  // Calculate trust score for reviews
  const calculateTrustScore = useCallback((factors: {
    verified: boolean;
    hasReviewText: boolean;
    longStay: boolean;
    highRating: boolean;
    wouldRecommend: boolean;
    isAirbnb?: boolean;
  }): number => {
    let score = 0;
    if (factors.verified) score += 30;
    if (factors.hasReviewText) score += 25;
    if (factors.longStay) score += 15;
    if (factors.highRating) score += 20;
    if (factors.wouldRecommend) score += 10;
    if (factors.isAirbnb) score += 10;
    return score;
  }, []);

  // Format guest reviews
  const reviews = useMemo<UnifiedReview[]>(() => {
    const allReviews: UnifiedReview[] = [];

    // Process guest reviews (all reviews are stored in database)
    if (guestReviews) {
      guestReviews.forEach(review => {
        const stayDuration = review.stay_start_date && review.stay_end_date 
          ? Math.ceil((new Date(review.stay_end_date).getTime() - new Date(review.stay_start_date).getTime()) / (1000 * 60 * 60 * 24))
          : undefined;

        allReviews.push({
          id: review.id,
          guest_name: review.guest_name,
          location: review.location || undefined,
          rating: review.rating,
          review_date: new Date(review.review_date),
          stay_start_date: review.stay_start_date ? new Date(review.stay_start_date) : undefined,
          stay_end_date: review.stay_end_date ? new Date(review.stay_end_date) : undefined,
          trip_type: review.trip_type || undefined,
          review_text: review.review_text || undefined,
          would_recommend: review.would_recommend ?? undefined,
          is_featured: review.is_featured ?? undefined,
          verified_guest: review.verified_guest ?? undefined,
          source: "guest",
          formattedDate: new Date(review.review_date).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
          }),
          stayDuration,
          trustScore: calculateTrustScore({
            verified: review.verified_guest || false,
            hasReviewText: !!review.review_text,
            longStay: stayDuration ? stayDuration >= 3 : false,
            highRating: review.rating >= 5,
            wouldRecommend: review.would_recommend || false
          })
        });
      });
    }

    return allReviews.sort((a, b) => {
      if (a.is_featured !== b.is_featured) {
        return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
      }
      if (a.trustScore !== b.trustScore) {
        return b.trustScore - a.trustScore;
      }
      return b.review_date.getTime() - a.review_date.getTime();
    });
  }, [guestReviews, calculateTrustScore]);

  // Review highlights
  const reviewHighlights = [
    "Breathtaking ocean views and private beach access",
    "Perfect for families with children - safe and entertaining", 
    "Amazing hosts with exceptional communication",
    "Fantastic water activities - canoes, kayaks, SUPs included",
    "Peaceful and relaxing atmosphere",
    "Exactly as advertised - accurate photos and description"
  ];

  // Featured reviews for carousel - exactly the 9 curated featured reviews
  const featuredReviews = useMemo(() => {
    return reviews
      .filter(review => review.is_featured)
      .slice(0, 9);
  }, [reviews]);

  const isLoading = guestReviewsLoading || summaryLoading;
  const hasError = guestReviewsError;

  // Fallback data
  const fallbackSummary: ReviewSummary = {
    averageRating: 4.8,
    totalReviews: 0,
    reviewCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };

  // Filter and sort reviews for lightbox modal
  const filteredAndSortedReviews = useMemo(() => {
    if (!reviews) return [];
    
    return reviews.filter(review => {
      const matchesSearch = searchQuery === "" || 
        review.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.review_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRating = filterRating === "all" || review.rating.toString() === filterRating;
      
      return matchesSearch && matchesRating;
    }).sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
        case "oldest":
          return new Date(a.review_date).getTime() - new Date(b.review_date).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
  }, [reviews, searchQuery, filterRating, sortBy]);

  // Pagination for lightbox
  const totalPages = Math.ceil(filteredAndSortedReviews.length / reviewsPerPage);
  const paginatedReviews = filteredAndSortedReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  // Lightbox navigation functions
  const handlePreviousReview = useCallback(() => {
    setSelectedReviewIndex(prev => 
      prev > 0 ? prev - 1 : filteredAndSortedReviews.length - 1
    );
  }, [filteredAndSortedReviews.length]);

  const handleNextReview = useCallback(() => {
    setSelectedReviewIndex(prev => 
      prev < filteredAndSortedReviews.length - 1 ? prev + 1 : 0
    );
  }, [filteredAndSortedReviews.length]);

  // Handle review click to open lightbox
  const handleReviewClick = useCallback((reviewId: string) => {
    const index = filteredAndSortedReviews.findIndex(review => review.id === reviewId);
    if (index !== -1) {
      setSelectedReviewIndex(index);
      setIsLightboxOpen(true);
    }
  }, [filteredAndSortedReviews]);

  // Reset search when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, filterRating]);

  // Render star rating
  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4", 
      lg: "h-5 w-5"
    };

    return Array.from({ length: 5 }, (_, i) => {
      const isFilled = i < Math.floor(rating);
      
      return (
        <Star 
          key={i} 
          fill={isFilled ? "currentColor" : "none"}
          className={`${sizeClasses[size]} transition-all duration-300 ${
            isFilled 
              ? 'text-yellow-500 drop-shadow-sm' 
              : 'text-muted-foreground/30 stroke-current'
          }`} 
        />
      );
    });
  };

  // Render trust badges
  const renderTrustBadge = (review: UnifiedReview) => {
    if (review.trustScore < 70) return null;

    return (
      <div className="flex items-center space-x-1">
        {review.verified_guest && (
          <Badge 
            variant="secondary" 
            className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 text-luxury-xs font-serif font-normal tracking-luxury-tight px-2 py-1 border border-emerald-200 dark:border-emerald-800"
            data-testid={`verified-badge-${review.id}`}
          >
            <Verified className="h-3 w-3 mr-1" />
            Verified Stay
          </Badge>
        )}
      </div>
    );
  };

  // Render avatar
  const renderAvatar = (review: UnifiedReview) => {
    const initials = review.guest_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    return (
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-yellow-500/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
          {review.reviewer_avatar_url ? (
            <AvatarImage 
              src={review.reviewer_avatar_url} 
              alt={`${review.guest_name}'s profile picture`}
              className="object-cover"
            />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-800 font-serif font-normal tracking-luxury-tight text-luxury-sm">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
        {review.verified_guest && (
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-white dark:border-muted">
            <Shield className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </motion.div>
    );
  };

  // Render single review card
  const renderReviewCard = (review: UnifiedReview, index: number, isClickable: boolean = true) => (
    <Card 
      className={cn(
        "h-80 shadow-lg border-yellow-500/20 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-500 ease-out hover:border-yellow-500/40 group",
        isClickable && "cursor-pointer hover:scale-[1.02]"
      )}
      onClick={isClickable ? () => handleReviewClick(review.id) : undefined}
      data-testid={`review-card-${review.id}`}
    >
      <CardContent className="pt-6 pb-6 relative overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4 flex-shrink-0">
          {renderAvatar(review)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-serif font-normal text-foreground truncate tracking-luxury-tight">
                {review.guest_name}
              </h4>
              {renderTrustBadge(review)}
            </div>
            {review.location && (
              <p className="text-luxury-sm font-serif text-muted-foreground truncate tracking-luxury-tight">
                {review.location}
              </p>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3 flex-shrink-0">
          <div className="flex">{renderStars(review.rating)}</div>
          <span className="text-luxury-sm font-serif font-normal text-foreground tracking-luxury-tight">
            {review.rating}/5
          </span>
          <span className="text-luxury-xs font-serif text-muted-foreground tracking-luxury-tight">
            {review.formattedDate}
          </span>
        </div>

        {/* Review Text */}
        {review.review_text && (
          <div className="flex-1 overflow-hidden mb-4">
            <p className="text-luxury-sm font-serif text-muted-foreground leading-relaxed line-clamp-4 tracking-luxury-tight">
              "{review.review_text}"
            </p>
          </div>
        )}

        {/* Trip details */}
        <div className="flex items-center justify-between text-xs text-muted-foreground flex-shrink-0 mt-auto">
          {review.trip_type && (
            <span className="px-2 py-1 bg-muted/50 rounded-md text-luxury-xs font-serif tracking-luxury-tight">
              {review.trip_type}
            </span>
          )}
          {review.stayDuration && (
            <span className="text-luxury-xs font-serif tracking-luxury-tight">
              {review.stayDuration} night{review.stayDuration !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <section 
        className="py-12 md:py-16 bg-background"
        aria-label="Guest reviews"
        role="region"
        aria-busy="true"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="flex space-x-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="flex-shrink-0 w-80 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (hasError && guestReviewsError) {
    console.warn('Reviews API error:', { guestReviewsError });
  }

  const summaryData = summary || fallbackSummary;
  const reviewsData = reviews || [];

  if ((!reviewsData || reviewsData.length === 0) && !isLoading) {
    return (
      <section 
        className="py-16 bg-background"
        aria-labelledby="reviews-heading-empty"
        role="region"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h2 
              id="reviews-heading-empty"
              className="text-luxury-3xl md:text-luxury-4xl font-serif font-normal text-foreground mb-8 tracking-luxury-tight"
            >
              Guest Reviews
            </h2>
            <div className="py-16 text-muted-foreground">
              <Star className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-luxury-xl mb-2">No reviews yet</p>
              <p>Be the first to share your experience!</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="py-12 md:py-16 bg-background"
      aria-labelledby="reviews-heading"
      role="region"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <ScrollReveal>
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12">
              <div>
                <h2 
                  id="reviews-heading"
                  className="text-luxury-3xl md:text-luxury-4xl font-serif font-normal text-foreground mb-4 md:mb-6 leading-tight tracking-luxury-tight"
                >
                  Guest Reviews
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <Star className="h-6 w-6 text-yellow-500 fill-current mr-1 drop-shadow-sm" />
                    <span className="text-luxury-2xl font-serif font-normal tracking-luxury-tight" data-testid="average-rating">
                      {summaryData.averageRating}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-lg">·</span>
                  <span className="text-muted-foreground text-lg" data-testid="total-reviews">
                    {summaryData.totalReviews} reviews
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="ml-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100 font-serif font-normal tracking-luxury-tight"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Superhost
                  </Badge>
                </div>
              </div>

              {/* Rating Breakdown */}
              <div className="mt-6 md:mt-0">
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = summaryData.reviewCounts[stars as keyof typeof summaryData.reviewCounts];
                    const percentage = summaryData.totalReviews > 0 ? Math.round((count / summaryData.totalReviews) * 100) : 0;
                    return (
                      <motion.div 
                        key={stars} 
                        className="flex items-center space-x-2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: stars * 0.1, duration: 0.3 }}
                      >
                        <span className="text-sm text-muted-foreground w-8">{stars}</span>
                        <div className="flex">{renderStars(stars)}</div>
                        <div 
                          className="w-24 h-2 bg-muted rounded-full overflow-hidden"
                          role="progressbar"
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <motion.div 
                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: stars * 0.1 + 0.3, duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {percentage}%
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </header>
          </ScrollReveal>

          {/* Enhanced Continuous Scroll Carousel - MOVED BEFORE "What guests love" */}
          <div className="relative mb-12 overflow-hidden">
            <ScrollReveal>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-luxury-xl font-serif font-normal text-foreground tracking-luxury-tight">Featured Reviews</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="see-all-reviews-button">
                      See All Reviews ({reviewsData.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle>All Reviews ({filteredAndSortedReviews.length})</DialogTitle>
                    </DialogHeader>
                    
                    {/* Search and Filter Controls */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search reviews..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                          data-testid="search-reviews-input"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recent">Most Recent</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="highest">Highest Rated</SelectItem>
                            <SelectItem value="lowest">Lowest Rated</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterRating} onValueChange={setFilterRating}>
                          <SelectTrigger className="w-24">
                            <Filter className="h-4 w-4" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="5">5 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="1">1 Star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Reviews Grid */}
                    <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                      {paginatedReviews.map((review, index) => (
                        <div key={review.id}>
                          {renderReviewCard(review, index, false)}
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </ScrollReveal>

            {/* Continuous Scrolling Carousel without arrows */}
            <Carousel
              className="w-full"
              plugins={[autoplayPlugin.current, wheelGesturesPlugin.current]}
              setApi={setEmblaApi}
              opts={{
                align: "start",
                loop: true,
                dragFree: true,
                containScroll: "trimSnaps",
                skipSnaps: false,
                duration: 25,
                dragThreshold: 10
              }}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {featuredReviews.map((review, index) => (
                  <CarouselItem 
                    key={review.id} 
                    className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 min-w-0"
                    style={{ flex: '0 0 auto', minWidth: '280px', maxWidth: '360px' }}
                    data-testid={`carousel-slide-${index}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      {renderReviewCard(review, index)}
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* What guests love about this place - MOVED AFTER carousel */}
          <div className="mb-12">
            <ScrollReveal>
              <h3 className="text-luxury-xl font-serif font-normal text-foreground mb-6 tracking-luxury-tight">What guests love about this place</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {reviewHighlights.map((highlight, index) => (
                  <motion.div 
                    key={index} 
                    className="flex items-start space-x-3 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-yellow-500/10 hover:border-yellow-500/20 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0 drop-shadow-sm" />
                    <span className="text-muted-foreground leading-relaxed">
                      {highlight}
                    </span>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for individual review viewing */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Review Details</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousReview}
                  disabled={filteredAndSortedReviews.length <= 1}
                  data-testid="previous-review-button"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedReviewIndex + 1} of {filteredAndSortedReviews.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextReview}
                  disabled={filteredAndSortedReviews.length <= 1}
                  data-testid="next-review-button"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {filteredAndSortedReviews[selectedReviewIndex] && (
            <div className="p-6">
              {renderReviewCard(filteredAndSortedReviews[selectedReviewIndex], selectedReviewIndex, false)}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default ReviewsSection;