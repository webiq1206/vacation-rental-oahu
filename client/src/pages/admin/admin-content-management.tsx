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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  Bath,
  Wifi,
  Car,
  Coffee,
  Waves,
  Phone,
  ExternalLink,
  Clock,
  DollarSign,
  Tag,
  Globe,
  Mountain,
  X,
  Eye,
  UtensilsCrossed,
  ShoppingBag,
  Plane
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  general_location: z.string().min(1, "Location is required"),
  max_guests: z.string().min(1, "Max guests is required"),
  bedrooms: z.string().min(1, "Bedrooms is required"),
  bathrooms: z.string().min(1, "Bathrooms is required"),
  check_in_time: z.string().min(1, "Check-in time is required"),
  check_out_time: z.string().min(1, "Check-out time is required"),
});

const amenitySchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().min(1, "Icon is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  featured: z.boolean().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sort_order: z.string().optional(),
});

const photoSchema = z.object({
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  alt: z.string().min(1, "Alt text is required"),
  sort_order: z.string().optional(),
  is_featured: z.boolean().optional(),
});

const attractionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  detailed_description: z.string().optional(),
  distance: z.string().optional(),
  lat: z.string().min(1, "Latitude is required"),
  lng: z.string().min(1, "Longitude is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
  category: z.enum(["attraction", "restaurant", "beach", "entertainment", "shopping", "transportation"]),
  image_url: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  gallery_images: z.string().optional(),
  website_url: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  hours: z.string().optional(),
  rating: z.string().optional(),
  reviews_count: z.string().optional(),
  tags: z.string().optional(),
  ticket_price: z.string().optional(),
  sort_order: z.string().optional(),
  active: z.boolean().optional(),
});

type PropertyForm = z.infer<typeof propertySchema>;
type AmenityForm = z.infer<typeof amenitySchema>;
type PhotoForm = z.infer<typeof photoSchema>;
type CategoryForm = z.infer<typeof categorySchema>;
type AttractionForm = z.infer<typeof attractionSchema>;

interface Property {
  id: string;
  title: string;
  description: string;
  general_location: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  check_in_time: string;
  check_out_time: string;
  rating: string;
  review_count: number;
}

interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string;
  description?: string;
  featured?: boolean;
}

interface Photo {
  id: string;
  url: string;
  alt: string;
  sort_order: number;
  is_featured: boolean;
}

interface AmenityCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
}

interface NearbyAttraction {
  id: string;
  name: string;
  description?: string;
  detailed_description?: string;
  distance?: string;
  lat: string;
  lng: string;
  icon: string;
  color: string;
  category: string;
  image_url?: string;
  gallery_images?: string[];
  website_url?: string;
  phone_number?: string;
  address?: string;
  hours?: string;
  rating?: string;
  reviews_count?: number;
  tags?: string[];
  ticket_price?: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

export default function AdminContentManagement() {
  useSEO({
    title: "Admin Content Management",
    description: "Comprehensive property content and media management",
    robots: "noindex, nofollow",
    canonical: `${window.location.origin}/admin/content-management`
  });

  const { toast } = useToast();
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isAmenityDialogOpen, setIsAmenityDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editingCategory, setEditingCategory] = useState<AmenityCategory | null>(null);
  const [isAttractionDialogOpen, setIsAttractionDialogOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<NearbyAttraction | null>(null);
  const [attractionGalleryImages, setAttractionGalleryImages] = useState<string[]>([]);
  const [attractionTags, setAttractionTags] = useState<string[]>([]);
  const [newGalleryImage, setNewGalleryImage] = useState("");
  const [newTag, setNewTag] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const { data: property, isLoading: propertyLoading } = useQuery<Property>({
    queryKey: ["/api/property"],
  });

  const { data: amenities = [], isLoading: amenitiesLoading } = useQuery<Amenity[]>({
    queryKey: ["/api/amenities"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<AmenityCategory[]>({
    queryKey: ["/api/amenity-categories"],
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  const { data: attractions = [], isLoading: attractionsLoading } = useQuery<NearbyAttraction[]>({
    queryKey: ["/api/nearby-attractions"],
  });

  const propertyForm = useForm<PropertyForm>({
    resolver: zodResolver(propertySchema),
    defaultValues: property ? {
      title: property.title,
      description: property.description,
      general_location: property.general_location,
      max_guests: property.max_guests.toString(),
      bedrooms: property.bedrooms.toString(),
      bathrooms: property.bathrooms.toString(),
      check_in_time: property.check_in_time,
      check_out_time: property.check_out_time,
    } : {},
  });

  const amenityForm = useForm<AmenityForm>({
    resolver: zodResolver(amenitySchema),
    defaultValues: {
      name: "",
      icon: "wifi",
      category: "",
      description: "",
      featured: false,
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

  const categoryForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
      color: "",
      sort_order: "0",
    },
  });

  const attractionForm = useForm<AttractionForm>({
    resolver: zodResolver(attractionSchema),
    defaultValues: {
      name: "",
      description: "",
      detailed_description: "",
      distance: "",
      lat: "",
      lng: "",
      icon: "map-pin",
      color: "#3B82F6",
      category: "attraction",
      image_url: "",
      gallery_images: "",
      website_url: "",
      phone_number: "",
      address: "",
      hours: "",
      rating: "",
      reviews_count: "",
      tags: "",
      ticket_price: "",
      sort_order: "0",
      active: true,
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: PropertyForm) => {
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

  const addAmenityMutation = useMutation({
    mutationFn: async (data: AmenityForm) => {
      const response = await apiRequest("POST", "/api/admin/amenities", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      toast({
        title: "Amenity added",
        description: "The amenity has been added to the property.",
      });
      setIsAmenityDialogOpen(false);
      setEditingAmenity(null);
      amenityForm.reset();
    },
  });

  const deleteAmenityMutation = useMutation({
    mutationFn: async (amenityId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/amenities/${amenityId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      toast({
        title: "Amenity deleted",
        description: "The amenity has been removed from the property.",
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
      setSelectedFile(null);
      setFilePreview(null);
      setUploadMode("url");
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (data: { file: File; alt: string; sort_order: number; is_featured: boolean }) => {
      const formData = new FormData();
      formData.append("image", data.file);
      formData.append("alt", data.alt);
      formData.append("sort_order", data.sort_order.toString());
      formData.append("is_featured", data.is_featured.toString());

      const response = await fetch("/api/admin/photos/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        // Parse the error response to get the detailed message
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Photo uploaded",
        description: "The photo has been uploaded successfully.",
      });
      setIsPhotoDialogOpen(false);
      setEditingPhoto(null);
      photoForm.reset();
      setSelectedFile(null);
      setFilePreview(null);
      setUploadMode("url");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
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
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const response = await apiRequest("POST", "/api/admin/amenity-categories", {
        ...data,
        sort_order: parseInt(data.sort_order || "0"),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenity-categories"] });
      toast({
        title: "Category added",
        description: "The amenity category has been added successfully.",
      });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryForm & { id: string }) => {
      const response = await apiRequest("PUT", `/api/admin/amenity-categories/${data.id}`, {
        ...data,
        sort_order: parseInt(data.sort_order || "0"),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenity-categories"] });
      toast({
        title: "Category updated",
        description: "The amenity category has been updated successfully.",
      });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/amenity-categories/${categoryId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/amenity-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/amenities"] });
      toast({
        title: "Category deleted",
        description: "The amenity category has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addAttractionMutation = useMutation({
    mutationFn: async (data: AttractionForm) => {
      const response = await apiRequest("POST", "/api/admin/nearby-attractions", {
        ...data,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng),
        sort_order: parseInt(data.sort_order || "0"),
        rating: data.rating ? parseFloat(data.rating) : null,
        reviews_count: data.reviews_count ? parseInt(data.reviews_count) : null,
        gallery_images: attractionGalleryImages,
        tags: attractionTags,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nearby-attractions"] });
      toast({
        title: "Attraction added",
        description: "The attraction has been added successfully.",
      });
      setIsAttractionDialogOpen(false);
      setEditingAttraction(null);
      attractionForm.reset();
      setAttractionGalleryImages([]);
      setAttractionTags([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add attraction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAttractionMutation = useMutation({
    mutationFn: async (data: AttractionForm & { id: string }) => {
      const response = await apiRequest("PUT", `/api/admin/nearby-attractions/${data.id}`, {
        ...data,
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng),
        sort_order: parseInt(data.sort_order || "0"),
        rating: data.rating ? parseFloat(data.rating) : null,
        reviews_count: data.reviews_count ? parseInt(data.reviews_count) : null,
        gallery_images: attractionGalleryImages,
        tags: attractionTags,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nearby-attractions"] });
      toast({
        title: "Attraction updated",
        description: "The attraction has been updated successfully.",
      });
      setIsAttractionDialogOpen(false);
      setEditingAttraction(null);
      attractionForm.reset();
      setAttractionGalleryImages([]);
      setAttractionTags([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update attraction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAttractionMutation = useMutation({
    mutationFn: async (attractionId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/nearby-attractions/${attractionId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nearby-attractions"] });
      toast({
        title: "Attraction deleted",
        description: "The attraction has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete attraction",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openAmenityDialog = (amenity?: Amenity) => {
    if (amenity) {
      setEditingAmenity(amenity);
      amenityForm.reset({
        name: amenity.name,
        icon: amenity.icon,
        category: amenity.category,
        description: amenity.description || "",
        featured: amenity.featured || false,
      });
    } else {
      setEditingAmenity(null);
      amenityForm.reset();
    }
    setIsAmenityDialogOpen(true);
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
    setSelectedFile(null);
    setFilePreview(null);
    setUploadMode("url");
    setIsPhotoDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSubmit = async (data: PhotoForm) => {
    // Validate based on upload mode
    if (uploadMode === "file") {
      if (!selectedFile) {
        toast({
          title: "Missing file",
          description: "Please select an image file to upload",
          variant: "destructive",
        });
        return;
      }
      
      // Use file upload mutation
      uploadFileMutation.mutate({
        file: selectedFile,
        alt: data.alt,
        sort_order: parseInt(data.sort_order || "0"),
        is_featured: data.is_featured || false,
      });
    } else if (uploadMode === "url") {
      if (!data.url || data.url.trim() === "") {
        toast({
          title: "Missing URL",
          description: "Please enter a valid image URL",
          variant: "destructive",
        });
        return;
      }
      
      // Use URL-based mutation
      addPhotoMutation.mutate(data);
    }
  };

  const openCategoryDialog = (category?: AmenityCategory) => {
    if (category) {
      setEditingCategory(category);
      categoryForm.reset({
        name: category.name,
        description: category.description || "",
        icon: category.icon || "",
        color: category.color || "",
        sort_order: category.sort_order.toString(),
      });
    } else {
      setEditingCategory(null);
      categoryForm.reset();
    }
    setIsCategoryDialogOpen(true);
  };

  const handleCategorySubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ ...data, id: editingCategory.id });
    } else {
      addCategoryMutation.mutate(data);
    }
  };

  const openAttractionDialog = (attraction?: NearbyAttraction) => {
    if (attraction) {
      setEditingAttraction(attraction);
      setAttractionGalleryImages(attraction.gallery_images || []);
      setAttractionTags(attraction.tags || []);
      attractionForm.reset({
        name: attraction.name,
        description: attraction.description || "",
        detailed_description: attraction.detailed_description || "",
        distance: attraction.distance || "",
        lat: attraction.lat,
        lng: attraction.lng,
        icon: attraction.icon,
        color: attraction.color,
        category: attraction.category as "attraction" | "restaurant" | "beach" | "entertainment" | "shopping" | "transportation",
        image_url: attraction.image_url || "",
        website_url: attraction.website_url || "",
        phone_number: attraction.phone_number || "",
        address: attraction.address || "",
        hours: attraction.hours || "",
        rating: attraction.rating?.toString() || "",
        reviews_count: attraction.reviews_count?.toString() || "",
        ticket_price: attraction.ticket_price || "",
        sort_order: attraction.sort_order.toString(),
        active: attraction.active,
        gallery_images: "",
        tags: "",
      });
    } else {
      setEditingAttraction(null);
      setAttractionGalleryImages([]);
      setAttractionTags([]);
      attractionForm.reset();
    }
    setIsAttractionDialogOpen(true);
  };

  const handleAttractionSubmit = (data: AttractionForm) => {
    if (editingAttraction) {
      updateAttractionMutation.mutate({ ...data, id: editingAttraction.id });
    } else {
      addAttractionMutation.mutate(data);
    }
  };

  const addGalleryImage = () => {
    if (newGalleryImage.trim() && !attractionGalleryImages.includes(newGalleryImage.trim())) {
      setAttractionGalleryImages([...attractionGalleryImages, newGalleryImage.trim()]);
      setNewGalleryImage("");
    }
  };

  const removeGalleryImage = (index: number) => {
    setAttractionGalleryImages(attractionGalleryImages.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !attractionTags.includes(newTag.trim())) {
      setAttractionTags([...attractionTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setAttractionTags(attractionTags.filter((_, i) => i !== index));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'attraction':
        return <Mountain className="h-4 w-4" />;
      case 'restaurant':
        return <UtensilsCrossed className="h-4 w-4" />;
      case 'beach':
        return <Waves className="h-4 w-4" />;
      case 'transportation':
        return <Plane className="h-4 w-4" />;
      case 'shopping':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const iconOptions = [
    { value: "wifi", label: "WiFi" },
    { value: "car", label: "Car" },
    { value: "coffee", label: "Coffee" },
    { value: "waves", label: "Waves" },
    { value: "bed", label: "Bed" },
    { value: "bath", label: "Bath" },
    { value: "users", label: "Users" },
    { value: "star", label: "Star" },
  ];

  const attractionIconOptions = [
    { value: "map-pin", label: "Map Pin" },
    { value: "mountain", label: "Mountain" },
    { value: "utensils-crossed", label: "Restaurant" },
    { value: "waves", label: "Beach" },
    { value: "plane", label: "Transportation" },
    { value: "shopping-bag", label: "Shopping" },
    { value: "star", label: "Entertainment" },
  ];

  const categoryOptions = [
    { value: "attraction", label: "Attraction" },
    { value: "restaurant", label: "Restaurant" },
    { value: "beach", label: "Beach" },
    { value: "entertainment", label: "Entertainment" },
    { value: "shopping", label: "Shopping" },
    { value: "transportation", label: "Transportation" },
  ];


  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
          <p className="text-muted-foreground">
            Manage all property content, amenities, and media
          </p>
        </div>

        <Tabs defaultValue="property" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="property">Property Details</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="attractions">Attractions</TabsTrigger>
            <TabsTrigger value="gallery">Photo Gallery</TabsTrigger>
          </TabsList>

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
                    <Button className="btn-bronze text-white" data-testid="edit-property-button">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Property Details</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={propertyForm.handleSubmit((data) => updatePropertyMutation.mutate(data))} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Property Title</Label>
                        <Input
                          id="title"
                          {...propertyForm.register("title")}
                          data-testid="input-title"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          rows={4}
                          {...propertyForm.register("description")}
                          data-testid="input-description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="general_location">Location</Label>
                        <Input
                          id="general_location"
                          {...propertyForm.register("general_location")}
                          data-testid="input-location"
                        />
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
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bedrooms">Bedrooms</Label>
                          <Input
                            id="bedrooms"
                            type="number"
                            {...propertyForm.register("bedrooms")}
                            data-testid="input-bedrooms"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bathrooms">Bathrooms</Label>
                          <Input
                            id="bathrooms"
                            type="number"
                            {...propertyForm.register("bathrooms")}
                            data-testid="input-bathrooms"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="check_in_time">Check-in Time</Label>
                          <Input
                            id="check_in_time"
                            type="time"
                            {...propertyForm.register("check_in_time")}
                            data-testid="input-check-in-time"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="check_out_time">Check-out Time</Label>
                          <Input
                            id="check_out_time"
                            type="time"
                            {...propertyForm.register("check_out_time")}
                            data-testid="input-check-out-time"
                          />
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
                  </div>
                ) : property ? (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-2">{property.title}</h2>
                      <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{property.general_location}</span>
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

          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Categories Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage amenity categories - complete control over categorization
                  </p>
                </div>
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="emerald-gradient text-white"
                      onClick={() => openCategoryDialog()}
                      data-testid="add-category-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? "Edit Category" : "Add Category"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="category_name">Name *</Label>
                        <Input
                          id="category_name"
                          {...categoryForm.register("name")}
                          data-testid="input-category-name"
                          placeholder="e.g., Kitchen & Dining"
                        />
                        {categoryForm.formState.errors.name && (
                          <p className="text-sm text-red-500">
                            {categoryForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category_description">Description</Label>
                        <Textarea
                          id="category_description"
                          {...categoryForm.register("description")}
                          data-testid="input-category-description"
                          placeholder="Optional description for this category"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category_icon">Icon</Label>
                          <Input
                            id="category_icon"
                            {...categoryForm.register("icon")}
                            data-testid="input-category-icon"
                            placeholder="e.g., utensils, wifi"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category_color">Color</Label>
                          <Input
                            id="category_color"
                            {...categoryForm.register("color")}
                            data-testid="input-category-color"
                            placeholder="e.g., #ff5733, blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category_sort_order">Sort Order</Label>
                        <Input
                          id="category_sort_order"
                          type="number"
                          {...categoryForm.register("sort_order")}
                          data-testid="input-category-sort-order"
                          placeholder="0"
                        />
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
                        data-testid="submit-category"
                      >
                        {addCategoryMutation.isPending || updateCategoryMutation.isPending 
                          ? "Saving..." 
                          : editingCategory 
                            ? "Update Category" 
                            : "Add Category"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse bg-muted h-4 rounded" />
                    <div className="animate-pulse bg-muted h-20 rounded" />
                  </div>
                ) : categories.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{category.name}</h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                              {category.icon && <span>Icon: {category.icon}</span>}
                              {category.color && <span>Color: {category.color}</span>}
                              <span>Sort: {category.sort_order}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openCategoryDialog(category)}
                              data-testid={`edit-category-${category.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete the category "${category.name}"? This will affect existing amenities using this category.`)) {
                                  deleteCategoryMutation.mutate(category.id);
                                }
                              }}
                              data-testid={`delete-category-${category.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No categories found</p>
                    <p className="text-sm mt-1">Add your first amenity category to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="amenities" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Amenities Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage property amenities and features
                  </p>
                </div>
                <Dialog open={isAmenityDialogOpen} onOpenChange={setIsAmenityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="emerald-gradient text-white"
                      onClick={() => openAmenityDialog()}
                      data-testid="add-amenity-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Amenity
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingAmenity ? "Edit Amenity" : "Add Amenity"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={amenityForm.handleSubmit((data) => addAmenityMutation.mutate(data))} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amenity_name">Name</Label>
                        <Input
                          id="amenity_name"
                          {...amenityForm.register("name")}
                          data-testid="input-amenity-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amenity_icon">Icon</Label>
                        <Select
                          value={amenityForm.watch("icon")}
                          onValueChange={(value) => amenityForm.setValue("icon", value)}
                        >
                          <SelectTrigger data-testid="select-amenity-icon">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {iconOptions.map((icon) => (
                              <SelectItem key={icon.value} value={icon.value}>
                                {icon.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amenity_category">Category</Label>
                        <Select
                          value={amenityForm.watch("category")}
                          onValueChange={(value) => amenityForm.setValue("category", value)}
                        >
                          <SelectTrigger data-testid="select-amenity-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.name}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amenity_description">Description</Label>
                        <Textarea
                          id="amenity_description"
                          {...amenityForm.register("description")}
                          data-testid="input-amenity-description"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="amenity_featured"
                          checked={amenityForm.watch("featured")}
                          onCheckedChange={(checked) => amenityForm.setValue("featured", checked)}
                          data-testid="switch-amenity-featured"
                        />
                        <Label htmlFor="amenity_featured">Featured Amenity</Label>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={addAmenityMutation.isPending}
                        data-testid="submit-amenity"
                      >
                        {addAmenityMutation.isPending 
                          ? "Saving..." 
                          : editingAmenity ? "Update Amenity" : "Add Amenity"
                        }
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {amenitiesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-muted rounded-lg h-20" />
                    ))}
                  </div>
                ) : amenities.length > 0 ? (
                  <div className="space-y-4">
                    {categoryOptions.map((category) => {
                      const categoryAmenities = amenities.filter(a => a.category === category.value);
                      if (categoryAmenities.length === 0) return null;
                      
                      return (
                        <div key={category.value}>
                          <h3 className="font-semibold text-lg mb-3 text-foreground">{category.label}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categoryAmenities.map((amenity) => (
                              <div key={amenity.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    {amenity.icon === 'wifi' && <Wifi className="h-5 w-5 text-primary" />}
                                    {amenity.icon === 'car' && <Car className="h-5 w-5 text-primary" />}
                                    {amenity.icon === 'coffee' && <Coffee className="h-5 w-5 text-primary" />}
                                    {amenity.icon === 'waves' && <Waves className="h-5 w-5 text-primary" />}
                                    {amenity.icon === 'bed' && <Bed className="h-5 w-5 text-primary" />}
                                    {amenity.icon === 'bath' && <Bath className="h-5 w-5 text-primary" />}
                                    {amenity.icon === 'users' && <Users className="h-5 w-5 text-primary" />}
                                    {amenity.icon === 'star' && <Star className="h-5 w-5 text-primary" />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-foreground">{amenity.name}</h4>
                                      {amenity.featured && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Star className="h-3 w-3 mr-1" />
                                          Featured
                                        </Badge>
                                      )}
                                    </div>
                                    {amenity.description && (
                                      <p className="text-sm text-muted-foreground">{amenity.description}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openAmenityDialog(amenity)}
                                    data-testid={`edit-amenity-${amenity.id}`}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteAmenityMutation.mutate(amenity.id)}
                                    data-testid={`delete-amenity-${amenity.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No amenities found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attractions" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Nearby Attractions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage nearby attractions with rich content, images, and details
                  </p>
                </div>
                <Dialog open={isAttractionDialogOpen} onOpenChange={setIsAttractionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      className="ocean-gradient text-white"
                      onClick={() => openAttractionDialog()}
                      data-testid="add-attraction-button"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Attraction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingAttraction ? "Edit Attraction" : "Add New Attraction"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={attractionForm.handleSubmit(handleAttractionSubmit)} className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="attraction_name">Name *</Label>
                            <Input
                              id="attraction_name"
                              {...attractionForm.register("name")}
                              data-testid="input-attraction-name"
                            />
                            {attractionForm.formState.errors.name && (
                              <p className="text-sm text-destructive">
                                {attractionForm.formState.errors.name.message}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="attraction_distance">Distance</Label>
                            <Input
                              id="attraction_distance"
                              placeholder="e.g., 5 minutes walk"
                              {...attractionForm.register("distance")}
                              data-testid="input-attraction-distance"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="attraction_description">Short Description</Label>
                          <Textarea
                            id="attraction_description"
                            rows={2}
                            placeholder="Brief description for map display"
                            {...attractionForm.register("description")}
                            data-testid="input-attraction-description"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="attraction_detailed_description">Detailed Description</Label>
                          <Textarea
                            id="attraction_detailed_description"
                            rows={4}
                            placeholder="Rich detailed description for lightbox display"
                            {...attractionForm.register("detailed_description")}
                            data-testid="input-attraction-detailed-description"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="attraction_category">Category *</Label>
                            <Select
                              value={attractionForm.watch("category")}
                              onValueChange={(value) => attractionForm.setValue("category", value as any)}
                            >
                              <SelectTrigger data-testid="select-attraction-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categoryOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center">
                                      {getCategoryIcon(option.value)}
                                      <span className="ml-2">{option.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="attraction_icon">Icon</Label>
                            <Select
                              value={attractionForm.watch("icon")}
                              onValueChange={(value) => attractionForm.setValue("icon", value)}
                            >
                              <SelectTrigger data-testid="select-attraction-icon">
                                <SelectValue placeholder="Select icon" />
                              </SelectTrigger>
                              <SelectContent>
                                {attractionIconOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="attraction_color">Color</Label>
                            <Input
                              id="attraction_color"
                              type="color"
                              {...attractionForm.register("color")}
                              data-testid="input-attraction-color"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Location */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Location & Contact</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="attraction_lat">Latitude *</Label>
                            <Input
                              id="attraction_lat"
                              type="number"
                              step="any"
                              placeholder="21.4389"
                              {...attractionForm.register("lat")}
                              data-testid="input-attraction-lat"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="attraction_lng">Longitude *</Label>
                            <Input
                              id="attraction_lng"
                              type="number"
                              step="any"
                              placeholder="-157.7384"
                              {...attractionForm.register("lng")}
                              data-testid="input-attraction-lng"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="attraction_address">Full Address</Label>
                          <Input
                            id="attraction_address"
                            placeholder="123 Main St, Honolulu, HI 96813"
                            {...attractionForm.register("address")}
                            data-testid="input-attraction-address"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="attraction_phone">Phone Number</Label>
                            <Input
                              id="attraction_phone"
                              type="tel"
                              placeholder="(808) 123-4567"
                              {...attractionForm.register("phone_number")}
                              data-testid="input-attraction-phone"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="attraction_website">Website URL</Label>
                            <Input
                              id="attraction_website"
                              type="url"
                              placeholder="https://example.com"
                              {...attractionForm.register("website_url")}
                              data-testid="input-attraction-website"
                            />
                            {attractionForm.formState.errors.website_url && (
                              <p className="text-sm text-destructive">
                                {attractionForm.formState.errors.website_url.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Images */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Images & Media</h3>
                        <div className="space-y-2">
                          <Label htmlFor="attraction_image_url">Main Image URL</Label>
                          <Input
                            id="attraction_image_url"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            {...attractionForm.register("image_url")}
                            data-testid="input-attraction-image-url"
                          />
                          {attractionForm.formState.errors.image_url && (
                            <p className="text-sm text-destructive">
                              {attractionForm.formState.errors.image_url.message}
                            </p>
                          )}
                        </div>

                        {/* Gallery Images Management */}
                        <div className="space-y-2">
                          <Label>Gallery Images</Label>
                          <div className="flex space-x-2">
                            <Input
                              value={newGalleryImage}
                              onChange={(e) => setNewGalleryImage(e.target.value)}
                              placeholder="https://example.com/gallery-image.jpg"
                              type="url"
                              data-testid="input-new-gallery-image"
                            />
                            <Button
                              type="button"
                              onClick={addGalleryImage}
                              disabled={!newGalleryImage.trim()}
                              data-testid="button-add-gallery-image"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {attractionGalleryImages.length > 0 && (
                            <div className="space-y-2">
                              {attractionGalleryImages.map((imageUrl, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <div className="flex items-center space-x-2">
                                    <img
                                      src={imageUrl}
                                      alt={`Gallery ${index + 1}`}
                                      className="h-10 w-10 object-cover rounded"
                                      onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyNUMyMi43NjE0IDI1IDI1IDIyLjc2MTQgMjUgMjBDMjUgMTcuMjM4NiAyMi43NjE0IDE1IDIwIDE1QzE3LjIzODYgMTUgMTUgMTcuMjM4NiAxNSAyMEMxNSAyMi43NjE0IDE3LjIzODYgMjUgMjAgMjVaIiBmaWxsPSIjOUM5Qzk5Ii8+CjwvZz4KPC9zdmc+Cg==';
                                      }}
                                    />
                                    <span className="text-sm truncate max-w-xs">{imageUrl}</span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeGalleryImage(index)}
                                    data-testid={`button-remove-gallery-image-${index}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Business Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Business Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="attraction_hours">Operating Hours</Label>
                            <Textarea
                              id="attraction_hours"
                              rows={3}
                              placeholder="Mon-Fri: 9AM-5PM\nSat-Sun: 10AM-6PM"
                              {...attractionForm.register("hours")}
                              data-testid="input-attraction-hours"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="attraction_ticket_price">Ticket Price</Label>
                            <Input
                              id="attraction_ticket_price"
                              placeholder="Free, $25/adult, $15/child"
                              {...attractionForm.register("ticket_price")}
                              data-testid="input-attraction-ticket-price"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="attraction_rating">Rating</Label>
                            <Input
                              id="attraction_rating"
                              type="number"
                              step="0.1"
                              min="0"
                              max="5"
                              placeholder="4.5"
                              {...attractionForm.register("rating")}
                              data-testid="input-attraction-rating"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="attraction_reviews_count">Reviews Count</Label>
                            <Input
                              id="attraction_reviews_count"
                              type="number"
                              min="0"
                              placeholder="128"
                              {...attractionForm.register("reviews_count")}
                              data-testid="input-attraction-reviews-count"
                            />
                          </div>
                        </div>

                        {/* Tags Management */}
                        <div className="space-y-2">
                          <Label>Tags</Label>
                          <div className="flex space-x-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="e.g., family-friendly, outdoor, historic"
                              data-testid="input-new-tag"
                            />
                            <Button
                              type="button"
                              onClick={addTag}
                              disabled={!newTag.trim()}
                              data-testid="button-add-tag"
                            >
                              <Tag className="h-4 w-4" />
                            </Button>
                          </div>
                          {attractionTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {attractionTags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                                  <span>{tag}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0"
                                    onClick={() => removeTag(index)}
                                    data-testid={`button-remove-tag-${index}`}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="attraction_sort_order">Sort Order</Label>
                            <Input
                              id="attraction_sort_order"
                              type="number"
                              min="0"
                              placeholder="0"
                              {...attractionForm.register("sort_order")}
                              data-testid="input-attraction-sort-order"
                            />
                          </div>
                          <div className="space-y-2 flex items-end">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="attraction_active"
                                checked={attractionForm.watch("active")}
                                onCheckedChange={(checked) => attractionForm.setValue("active", checked)}
                                data-testid="switch-attraction-active"
                              />
                              <Label htmlFor="attraction_active">Active</Label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          type="submit"
                          className="flex-1"
                          disabled={addAttractionMutation.isPending || updateAttractionMutation.isPending}
                          data-testid="submit-attraction"
                        >
                          {(addAttractionMutation.isPending || updateAttractionMutation.isPending)
                            ? "Saving..." 
                            : editingAttraction ? "Update Attraction" : "Add Attraction"
                          }
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAttractionDialogOpen(false)}
                          data-testid="cancel-attraction"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {attractionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="animate-pulse bg-muted rounded-lg h-48" />
                    ))}
                  </div>
                ) : attractions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {attractions.map((attraction) => (
                      <div key={attraction.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(attraction.category)}
                            <div>
                              <h3 className="font-semibold text-foreground">{attraction.name}</h3>
                              <p className="text-sm text-muted-foreground capitalize">{attraction.category}</p>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAttractionDialog(attraction)}
                              data-testid={`edit-attraction-${attraction.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteAttractionMutation.mutate(attraction.id)}
                              data-testid={`delete-attraction-${attraction.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {attraction.image_url && (
                          <div className="aspect-video mb-3 rounded overflow-hidden">
                            <img
                              src={attraction.image_url}
                              alt={attraction.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          {attraction.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {attraction.description}
                            </p>
                          )}

                          {attraction.distance && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {attraction.distance}
                            </div>
                          )}

                          {attraction.rating && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                              {attraction.rating} ({attraction.reviews_count || 0} reviews)
                            </div>
                          )}

                          {attraction.ticket_price && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {attraction.ticket_price}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1 mt-2">
                            {attraction.website_url && (
                              <Badge variant="outline" className="text-xs">
                                <Globe className="h-2 w-2 mr-1" />
                                Website
                              </Badge>
                            )}
                            {attraction.phone_number && (
                              <Badge variant="outline" className="text-xs">
                                <Phone className="h-2 w-2 mr-1" />
                                Phone
                              </Badge>
                            )}
                            {attraction.gallery_images && attraction.gallery_images.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Eye className="h-2 w-2 mr-1" />
                                {attraction.gallery_images.length} images
                              </Badge>
                            )}
                            {attraction.tags && attraction.tags.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Tag className="h-2 w-2 mr-1" />
                                {attraction.tags.length} tags
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <Badge variant={attraction.active ? "default" : "secondary"}>
                              {attraction.active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Order: {attraction.sort_order}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No attractions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                      data-testid="add-photo-button"
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
                    <form onSubmit={photoForm.handleSubmit(handlePhotoSubmit)} className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Label>Upload Method</Label>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="upload-url"
                                name="uploadMode"
                                value="url"
                                checked={uploadMode === "url"}
                                onChange={(e) => setUploadMode(e.target.value as "url" | "file")}
                              />
                              <Label htmlFor="upload-url" className="text-sm font-normal">URL</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="upload-file"
                                name="uploadMode"
                                value="file"
                                checked={uploadMode === "file"}
                                onChange={(e) => setUploadMode(e.target.value as "url" | "file")}
                              />
                              <Label htmlFor="upload-file" className="text-sm font-normal">Upload File</Label>
                            </div>
                          </div>
                        </div>

                        {uploadMode === "url" ? (
                          <div className="space-y-2">
                            <Label htmlFor="url">Photo URL</Label>
                            <Input
                              id="url"
                              type="url"
                              placeholder="https://example.com/photo.jpg"
                              {...photoForm.register("url")}
                              data-testid="input-photo-url"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label htmlFor="file">Select Image File</Label>
                            <Input
                              id="file"
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              data-testid="input-photo-file"
                            />
                            {filePreview && (
                              <div className="mt-2">
                                <img
                                  src={filePreview}
                                  alt="Preview"
                                  className="max-w-48 max-h-48 rounded-lg border object-cover"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {selectedFile?.name} ({((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                                </p>
                              </div>
                            )}
                          </div>
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
                        <Switch
                          id="is_featured"
                          checked={photoForm.watch("is_featured")}
                          onCheckedChange={(checked) => photoForm.setValue("is_featured", checked)}
                          data-testid="switch-featured"
                        />
                        <Label htmlFor="is_featured">Featured Photo</Label>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={addPhotoMutation.isPending || uploadFileMutation.isPending}
                        data-testid="submit-photo"
                      >
                        {(addPhotoMutation.isPending || uploadFileMutation.isPending)
                          ? (uploadMode === "file" ? "Uploading..." : "Saving...") 
                          : editingPhoto ? "Update Photo" : (uploadMode === "file" ? "Upload Photo" : "Add Photo")
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
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                        {photo.is_featured && (
                          <Badge className="absolute top-2 left-2 bg-coral-500 text-white">
                            Featured
                          </Badge>
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-1">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openPhotoDialog(photo)}
                              data-testid={`edit-photo-${photo.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deletePhotoMutation.mutate(photo.id)}
                              data-testid={`delete-photo-${photo.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-foreground">{photo.alt}</p>
                          <p className="text-xs text-muted-foreground">Sort order: {photo.sort_order}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No photos found</p>
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