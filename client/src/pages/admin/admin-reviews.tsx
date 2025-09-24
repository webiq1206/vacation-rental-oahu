import { useState } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/lib/seo-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  Calendar, 
  User, 
  Mail,
  Shield,
  Clock,
  Filter,
  Download,
  AlertTriangle
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GuestReview } from "@shared/schema";

interface ReviewWithDetails extends GuestReview {
  formattedDate: string;
  timeAgo: string;
}

interface AdminActionData {
  id: string;
  action: "approve" | "reject" | "edit" | "delete" | "feature";
  notes?: string;
  editData?: Partial<GuestReview>;
}

export default function AdminReviews() {
  useSEO({
    title: "Admin Reviews",
    description: "Manage guest reviews and feedback",
    robots: "noindex, nofollow",
    canonical: `${window.location.origin}/admin/reviews`
  });

  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingReview, setEditingReview] = useState<GuestReview | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();

  // Fetch all reviews for admin
  const { data: allReviews, isLoading } = useQuery<ReviewWithDetails[]>({
    queryKey: ["/api/reviews"],
    select: (data: GuestReview[]) => data.map(review => ({
      ...review,
      formattedDate: new Date(review.submitted_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timeAgo: getTimeAgo(new Date(review.submitted_at))
    }))
  });

  // Fetch pending reviews  
  const { data: pendingReviews } = useQuery<ReviewWithDetails[]>({
    queryKey: ["/api/reviews"],
    select: (data: GuestReview[]) => data.filter(review => review.approval_status === "pending").map(review => ({
      ...review,
      formattedDate: new Date(review.submitted_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      timeAgo: getTimeAgo(new Date(review.submitted_at))
    }))
  });

  // Admin action mutations
  const approveReview = useMutation({
    mutationFn: (data: { id: string; notes?: string }) => 
      apiRequest("PUT", `/api/admin/reviews/${data.id}/approve`, { admin_notes: data.notes }),
    onSuccess: () => {
      toast({ title: "Review approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/summary"] });
      setAdminNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectReview = useMutation({
    mutationFn: (data: { id: string; reason: string }) => 
      apiRequest("PUT", `/api/admin/reviews/${data.id}/reject`, { reason: data.reason }),
    onSuccess: () => {
      toast({ title: "Review rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/summary"] });
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReview = useMutation({
    mutationFn: (data: { id: string; updates: Partial<GuestReview> }) => 
      apiRequest("PUT", `/api/admin/reviews/${data.id}`, data.updates),
    onSuccess: () => {
      toast({ title: "Review updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/summary"] });
      setEditingReview(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReview = useMutation({
    mutationFn: (data: { id: string; reason: string }) => 
      apiRequest("DELETE", `/api/admin/reviews/${data.id}`, { reason: data.reason }),
    onSuccess: () => {
      toast({ title: "Review deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFeatureReview = useMutation({
    mutationFn: (data: { id: string; featured: boolean }) => 
      apiRequest("PATCH", `/api/admin/reviews/${data.id}/feature`, { featured: data.featured }),
    onSuccess: () => {
      toast({ title: "Review feature status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/public"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/summary"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update feature status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReviews = allReviews?.filter(review => {
    if (filterStatus === "all") return true;
    return review.approval_status === filterStatus;
  }) || [];

  const handleBulkAction = (action: "approve" | "reject" | "delete") => {
    // Implement bulk actions
    toast({ title: `Bulk ${action} action would be implemented here` });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReviews(filteredReviews.map(r => r.id));
    } else {
      setSelectedReviews([]);
    }
  };

  const handleSelectReview = (reviewId: string, checked: boolean) => {
    if (checked) {
      setSelectedReviews([...selectedReviews, reviewId]);
    } else {
      setSelectedReviews(selectedReviews.filter(id => id !== reviewId));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 loading-skeleton-luxury" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 loading-skeleton-luxury" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Review Management</h1>
              <p className="text-muted-foreground">Moderate and manage guest reviews</p>
            </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Reviews
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingReviews?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {allReviews?.filter(r => r.approval_status === "approved").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {allReviews?.filter(r => r.approval_status === "rejected").length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <div>
                <p className="text-2xl font-bold">
                  {allReviews?.filter(r => r.is_featured).length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-4">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingReviews?.length || 0})</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <ReviewsList 
            reviews={filteredReviews}
            selectedReviews={selectedReviews}
            onSelectAll={handleSelectAll}
            onSelectReview={handleSelectReview}
            onApprove={(id, notes) => approveReview.mutate({ id, notes })}
            onReject={(id, reason) => rejectReview.mutate({ id, reason })}
            onEdit={setEditingReview}
            onDelete={(id, reason) => deleteReview.mutate({ id, reason })}
            onToggleFeature={(id, featured) => toggleFeatureReview.mutate({ id, featured })}
            renderStars={renderStars}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <ReviewsList 
            reviews={pendingReviews || []}
            selectedReviews={selectedReviews}
            onSelectAll={handleSelectAll}
            onSelectReview={handleSelectReview}
            onApprove={(id, notes) => approveReview.mutate({ id, notes })}
            onReject={(id, reason) => rejectReview.mutate({ id, reason })}
            onEdit={setEditingReview}
            onDelete={(id, reason) => deleteReview.mutate({ id, reason })}
            onToggleFeature={(id, featured) => toggleFeatureReview.mutate({ id, featured })}
            renderStars={renderStars}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <ReviewsList 
            reviews={filteredReviews.filter(r => r.approval_status === "approved")}
            selectedReviews={selectedReviews}
            onSelectAll={handleSelectAll}
            onSelectReview={handleSelectReview}
            onApprove={(id, notes) => approveReview.mutate({ id, notes })}
            onReject={(id, reason) => rejectReview.mutate({ id, reason })}
            onEdit={setEditingReview}
            onDelete={(id, reason) => deleteReview.mutate({ id, reason })}
            onToggleFeature={(id, featured) => toggleFeatureReview.mutate({ id, featured })}
            renderStars={renderStars}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <ReviewsList 
            reviews={filteredReviews.filter(r => r.approval_status === "rejected")}
            selectedReviews={selectedReviews}
            onSelectAll={handleSelectAll}
            onSelectReview={handleSelectReview}
            onApprove={(id, notes) => approveReview.mutate({ id, notes })}
            onReject={(id, reason) => rejectReview.mutate({ id, reason })}
            onEdit={setEditingReview}
            onDelete={(id, reason) => deleteReview.mutate({ id, reason })}
            onToggleFeature={(id, featured) => toggleFeatureReview.mutate({ id, featured })}
            renderStars={renderStars}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Bulk Actions Bar */}
      {selectedReviews.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 bg-background border border-border rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">{selectedReviews.length} review(s) selected</span>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleBulkAction("approve")}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction("reject")}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject All
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBulkAction("delete")}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete All
                </Button>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setSelectedReviews([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <ReviewEditModal
          review={editingReview}
          open={!!editingReview}
          onClose={() => setEditingReview(null)}
          onSave={(updates) => updateReview.mutate({ id: editingReview.id, updates })}
          isLoading={updateReview.isPending}
        />
      )}
        </div>
      </main>
    </div>
  );
}

// Reviews List Component
interface ReviewsListProps {
  reviews: ReviewWithDetails[];
  selectedReviews: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectReview: (id: string, checked: boolean) => void;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, reason: string) => void;
  onEdit: (review: GuestReview) => void;
  onDelete: (id: string, reason: string) => void;
  onToggleFeature: (id: string, featured: boolean) => void;
  renderStars: (rating: number) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

function ReviewsList({
  reviews,
  selectedReviews,
  onSelectAll,
  onSelectReview,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onToggleFeature,
  renderStars,
  getStatusBadge
}: ReviewsListProps) {
  const [quickApproveNotes, setQuickApproveNotes] = useState<Record<string, string>>({});
  const [quickRejectReason, setQuickRejectReason] = useState<Record<string, string>>({});

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No reviews found.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedReviews.length === reviews.length && reviews.length > 0}
              onCheckedChange={onSelectAll}
              data-testid="select-all-reviews"
            />
            <span className="text-sm font-medium">
              Select All ({reviews.length} reviews)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reviews */}
      {reviews.map((review) => (
        <Card key={review.id} className="relative" data-testid={`admin-review-${review.id}`}>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <Checkbox
                checked={selectedReviews.includes(review.id)}
                onCheckedChange={(checked) => onSelectReview(review.id, !!checked)}
                data-testid={`select-review-${review.id}`}
              />
              
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-ocean-400 flex items-center justify-center text-white font-semibold">
                      {review.guest_name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{review.guest_name}</p>
                        {review.verified_guest && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground space-x-2">
                        <Mail className="w-3 h-3" />
                        <span>{review.guest_email}</span>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        <span>{review.formattedDate}</span>
                        <span>•</span>
                        <span>{review.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(review.approval_status)}
                    {review.is_featured && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    {review.trip_type && (
                      <Badge variant="outline" className="text-xs">
                        {review.trip_type}
                      </Badge>
                    )}
                    {review.location && (
                      <span className="text-sm text-muted-foreground">{review.location}</span>
                    )}
                  </div>
                  
                  {review.review_text && (
                    <p className="text-muted-foreground leading-relaxed">{review.review_text}</p>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Stay: {new Date(review.stay_start_date).toLocaleDateString()} - {new Date(review.stay_end_date).toLocaleDateString()}</p>
                    <p>Would recommend: {review.would_recommend ? "Yes" : "No"}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                {review.admin_notes && (
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">Admin Notes:</p>
                    <p className="text-sm text-muted-foreground">{review.admin_notes}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  {review.approval_status === "pending" && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve Review</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>Are you sure you want to approve this review?</p>
                            <Textarea
                              placeholder="Add admin notes (optional)"
                              value={quickApproveNotes[review.id] || ""}
                              onChange={(e) => setQuickApproveNotes({
                                ...quickApproveNotes,
                                [review.id]: e.target.value
                              })}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => onApprove(review.id, quickApproveNotes[review.id])}
                                className="flex-1"
                              >
                                Approve Review
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Review</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>Please provide a reason for rejecting this review:</p>
                            <Textarea
                              placeholder="Reason for rejection (required)"
                              value={quickRejectReason[review.id] || ""}
                              onChange={(e) => setQuickRejectReason({
                                ...quickRejectReason,
                                [review.id]: e.target.value
                              })}
                              required
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => onReject(review.id, quickRejectReason[review.id])}
                                variant="destructive"
                                className="flex-1"
                                disabled={!quickRejectReason[review.id]?.trim()}
                              >
                                Reject Review
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onEdit(review)}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onToggleFeature(review.id, !review.is_featured)}
                  >
                    <Star className={`w-4 h-4 mr-1 ${review.is_featured ? 'fill-current' : ''}`} />
                    {review.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Review</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-800">This action cannot be undone</p>
                            <p className="text-sm text-red-600">The review will be permanently deleted from the system.</p>
                          </div>
                        </div>
                        <Input
                          placeholder="Reason for deletion (required)"
                          required
                        />
                        <div className="flex gap-2">
                          <Button variant="destructive" className="flex-1">
                            Delete Review
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Review Edit Modal Component
interface ReviewEditModalProps {
  review: GuestReview;
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<GuestReview>) => void;
  isLoading: boolean;
}

function ReviewEditModal({ review, open, onClose, onSave, isLoading }: ReviewEditModalProps) {
  const [editedReview, setEditedReview] = useState({
    guest_name: review.guest_name,
    location: review.location || "",
    rating: review.rating,
    review_text: review.review_text || "",
    trip_type: review.trip_type || ("Solo" as const),
    would_recommend: review.would_recommend,
  });

  const handleSave = () => {
    onSave(editedReview);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Review</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Guest Name</label>
              <Input
                value={editedReview.guest_name}
                onChange={(e) => setEditedReview({ ...editedReview, guest_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                value={editedReview.location}
                onChange={(e) => setEditedReview({ ...editedReview, location: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Rating</label>
            <Select 
              value={editedReview.rating.toString()} 
              onValueChange={(value) => setEditedReview({ ...editedReview, rating: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Star</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Review Text</label>
            <Textarea
              value={editedReview.review_text}
              onChange={(e) => setEditedReview({ ...editedReview, review_text: e.target.value })}
              rows={4}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Trip Type</label>
            <Select 
              value={editedReview.trip_type} 
              onValueChange={(value) => setEditedReview({ ...editedReview, trip_type: value as "Solo" | "Couple" | "Family" | "Group" | "Business" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Solo">Solo</SelectItem>
                <SelectItem value="Couple">Couple</SelectItem>
                <SelectItem value="Family">Family</SelectItem>
                <SelectItem value="Group">Group</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}