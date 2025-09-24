import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useSEO } from "@/lib/seo-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Image, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload,
  Star,
  MapPin,
  Users,
  Bed,
  Bath
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  address: z.string().min(1, "Address is required"),
  max_guests: z.string().min(1, "Max guests is required"),
  bedrooms: z.string().min(1, "Bedrooms is required"),
  bathrooms: z.string().min(1, "Bathrooms is required"),
  check_in_time: z.string().min(1, "Check-in time is required"),
  check_out_time: z.string().min(1, "Check-out time is required"),
});

const photoSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  alt: z.string().min(1, "Alt text is required"),
  sort_order: z.string().optional(),
  is_featured: z.boolean().optional(),
});

type PropertyForm = z.infer<typeof propertySchema>;
type PhotoForm = z.infer<typeof photoSchema>;

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  check_in_time: string;
  check_out_time: string;
  rating: string;
  review_count: number;
}

interface Photo {
  id: string;
  url: string;
  alt: string;
  sort_order: number;
  is_featured: boolean;
}

export default function AdminContent() {
  useSEO({
    title: "Admin Content",
    description: "Manage property content and media",
    robots: "noindex, nofollow",
    canonical: `${window.location.origin}/admin/content`
  });

  const { toast } = useToast();
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

  const { data: property, isLoading: propertyLoading } = useQuery<Property>({
    queryKey: ["/api/property/public"],
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  const { data: amenities = [], isLoading: amenitiesLoading } = useQuery({
    queryKey: ["/api/amenities"],
  });

  const propertyForm = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      title: property?.title || "",
      description: property?.description || "",
      address: property?.address || "",
      max_guests: property?.max_guests?.toString() || "",
      bedrooms: property?.bedrooms?.toString() || "",
      bathrooms: property?.bathrooms?.toString() || "",
      check_in_time: property?.check_in_time || "",
      check_out_time: property?.check_out_time || "",
    },
  });

  const photoForm = useForm<PhotoForm>({
    resolver: zodResolver(photoSchema),
    defaultValues: {
      url: "",
      alt: "",
      sort_order: "0",
      is_featured: false,
    },
  });

  // Reset property form when property data loads
  useState(() => {
    if (property) {
      propertyForm.reset({
        title: property.title,
        description: property.description,
        address: property.address,
        max_guests: property.max_guests.toString(),
        bedrooms: property.bedrooms.toString(),
        bathrooms: property.bathrooms.toString(),
        check_in_time: property.check_in_time,
        check_out_time: property.check_out_time,
      });
    }
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: PropertyForm) => {
      // This would be implemented with the actual API
      const response = await apiRequest("PUT", "/api/admin/property", {
        ...data,
        max_guests: parseInt(data.max_guests),
        bedrooms: parseInt(data.bedrooms),
        bathrooms: parseInt(data.bathrooms),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/property"] });
      toast({
        title: "Property updated",
        description: "The property information has been updated successfully.",
      });
      setIsPropertyDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update property",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addPhotoMutation = useMutation({
    mutationFn: async (data: PhotoForm) => {
      const response = await apiRequest("POST", "/api/admin/photos", {
        ...data,
        sort_order: parseInt(data.sort_order || "0"),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Photo added",
        description: "The photo has been added to the gallery.",
      });
      setIsPhotoDialogOpen(false);
      setEditingPhoto(null);
      photoForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/photos/${photoId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Photo deleted",
        description: "The photo has been removed from the gallery.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onPropertySubmit = (data: PropertyForm) => {
    updatePropertyMutation.mutate(data);
  };

  const onPhotoSubmit = (data: PhotoForm) => {
    addPhotoMutation.mutate(data);
  };

  const openPhotoDialog = (photo?: Photo) => {
    if (photo) {
      setEditingPhoto(photo);
      photoForm.reset({
        url: photo.url,
        alt: photo.alt,
        sort_order: photo.sort_order.toString(),
        is_featured: photo.is_featured,
      });
    } else {
      setEditingPhoto(null);
      photoForm.reset();
    }
    setIsPhotoDialogOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Content</h1>
          <p className="text-muted-foreground">
            Manage property details, photos, and gallery
          </p>
        </div>

        <Tabs defaultValue="property" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="property">Property Details</TabsTrigger>
            <TabsTrigger value="gallery">Photo Gallery</TabsTrigger>
          </TabsList>

          {/* Property Details Tab */}
          <TabsContent value="property" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Property Information
                  </CardTitle>
                </div>
                <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-bronze text-white">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Property Details</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={propertyForm.handleSubmit(onPropertySubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Property Title</Label>
                        <Input
                          id="title"
                          {...propertyForm.register("title")}
                          data-testid="input-title"
                        />
                        {propertyForm.formState.errors.title && (
                          <p className="text-sm text-destructive">
                            {propertyForm.formState.errors.title.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          rows={4}
                          {...propertyForm.register("description")}
                          data-testid="input-description"
                        />
                        {propertyForm.formState.errors.description && (
                          <p className="text-sm text-destructive">
                            {propertyForm.formState.errors.description.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          {...propertyForm.register("address")}
                          data-testid="input-address"
                        />
                        {propertyForm.formState.errors.address && (
                          <p className="text-sm text-destructive">
                            {propertyForm.formState.errors.address.message}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="max_guests">Max Guests</Label>
                          <Input
                            id="max_guests"
                            type="number"
                            {...propertyForm.register("max_guests")}
                            data-testid="input-max-guests"
                          />
                          {propertyForm.formState.errors.max_guests && (
                            <p className="text-sm text-destructive">
                              {propertyForm.formState.errors.max_guests.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bedrooms">Bedrooms</Label>
                          <Input
                            id="bedrooms"
                            type="number"
                            {...propertyForm.register("bedrooms")}
                            data-testid="input-bedrooms"
                          />
                          {propertyForm.formState.errors.bedrooms && (
                            <p className="text-sm text-destructive">
                              {propertyForm.formState.errors.bedrooms.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bathrooms">Bathrooms</Label>
                          <Input
                            id="bathrooms"
                            type="number"
                            {...propertyForm.register("bathrooms")}
                            data-testid="input-bathrooms"
                          />
                          {propertyForm.formState.errors.bathrooms && (
                            <p className="text-sm text-destructive">
                              {propertyForm.formState.errors.bathrooms.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="check_in_time">Check-in Time</Label>
                          <Input
                            id="check_in_time"
                            type="text"
                            placeholder="e.g., 3:00 PM"
                            {...propertyForm.register("check_in_time")}
                            data-testid="input-check-in-time"
                          />
                          {propertyForm.formState.errors.check_in_time && (
                            <p className="text-sm text-destructive">
                              {propertyForm.formState.errors.check_in_time.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="check_out_time">Check-out Time</Label>
                          <Input
                            id="check_out_time"
                            type="text"
                            placeholder="e.g., 10:00 AM"
                            {...propertyForm.register("check_out_time")}
                            data-testid="input-check-out-time"
                          />
                          {propertyForm.formState.errors.check_out_time && (
                            <p className="text-sm text-destructive">
                              {propertyForm.formState.errors.check_out_time.message}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={updatePropertyMutation.isPending}
                        data-testid="submit-property"
                      >
                        {updatePropertyMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {propertyLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse bg-muted h-4 rounded" />
                    <div className="animate-pulse bg-muted h-20 rounded" />
                    <div className="grid grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-muted h-12 rounded" />
                      ))}
                    </div>
                  </div>
                ) : property ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">{property.title}</h2>
                      <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{property.address}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                          <span>{property.rating} ({property.review_count} reviews)</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <Users className="h-6 w-6 mx-auto mb-2 text-coral-500" />
                        <div className="font-semibold">{property.max_guests}</div>
                        <div className="text-sm text-muted-foreground">Guests</div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <Bed className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                        <div className="font-semibold">{property.bedrooms}</div>
                        <div className="text-sm text-muted-foreground">Bedrooms</div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <Bath className="h-6 w-6 mx-auto mb-2 text-ocean-500" />
                        <div className="font-semibold">{property.bathrooms}</div>
                        <div className="text-sm text-muted-foreground">Bathrooms</div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Check-in / Check-out</div>
                        <div className="font-semibold">{property.check_in_time} / {property.check_out_time}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No property information found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Photo Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    Photo Gallery
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage property photos and gallery order
                  </p>
                </div>
                <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="emerald-gradient text-white"
                      onClick={() => openPhotoDialog()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Photo
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingPhoto ? "Edit Photo" : "Add Photo"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={photoForm.handleSubmit(onPhotoSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="url">Photo URL</Label>
                        <Input
                          id="url"
                          type="url"
                          placeholder="https://example.com/photo.jpg"
                          {...photoForm.register("url")}
                          data-testid="input-photo-url"
                        />
                        {photoForm.formState.errors.url && (
                          <p className="text-sm text-destructive">
                            {photoForm.formState.errors.url.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alt">Alt Text</Label>
                        <Input
                          id="alt"
                          placeholder="Description of the photo"
                          {...photoForm.register("alt")}
                          data-testid="input-photo-alt"
                        />
                        {photoForm.formState.errors.alt && (
                          <p className="text-sm text-destructive">
                            {photoForm.formState.errors.alt.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sort_order">Sort Order</Label>
                        <Input
                          id="sort_order"
                          type="number"
                          placeholder="0"
                          {...photoForm.register("sort_order")}
                          data-testid="input-sort-order"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is_featured"
                          {...photoForm.register("is_featured")}
                          className="rounded"
                          data-testid="checkbox-featured"
                        />
                        <Label htmlFor="is_featured">Featured Photo</Label>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={addPhotoMutation.isPending}
                        data-testid="submit-photo"
                      >
                        {addPhotoMutation.isPending 
                          ? "Saving..." 
                          : editingPhoto ? "Update Photo" : "Add Photo"
                        }
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {photosLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-muted rounded-lg h-48" />
                    ))}
                  </div>
                ) : photos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                          <img
                            src={photo.url}
                            alt={photo.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openPhotoDialog(photo)}
                              data-testid={`edit-photo-${photo.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deletePhotoMutation.mutate(photo.id)}
                              disabled={deletePhotoMutation.isPending}
                              data-testid={`delete-photo-${photo.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{photo.alt}</span>
                            {photo.is_featured && (
                              <Badge variant="secondary" className="bg-coral-100 text-coral-800">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">Order: {photo.sort_order}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Image className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No photos added yet</h3>
                    <p className="text-sm mb-6">Start building your property gallery by adding photos</p>
                    <Button onClick={() => openPhotoDialog()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Add First Photo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
