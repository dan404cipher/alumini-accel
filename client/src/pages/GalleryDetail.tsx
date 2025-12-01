import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { galleryAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Images, ChevronLeft, ChevronRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GalleryDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("gallery");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["gallery-detail", id],
    queryFn: () => galleryAPI.getGalleryById(id ?? ""),
    enabled: Boolean(id),
  });

  const gallery = useMemo(() => {
    if (!data) return null;
    if ("data" in data && data.data?.gallery) return data.data.gallery;
    if ("data" in data) return data.data;
    return (data as any).gallery ?? data;
  }, [data]);

  let content: React.ReactNode;

  if (!id) {
    content = (
      <div className="max-w-4xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Invalid gallery</AlertTitle>
          <AlertDescription>
            Missing gallery ID. Please return to the gallery page.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate("/gallery")}>
          Back to Gallery
        </Button>
      </div>
    );
  } else if (isLoading) {
    content = (
      <div className="max-w-6xl mx-auto py-10 space-y-4">
        <Skeleton className="h-10 w-60" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-72" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  } else if (isError || !gallery) {
    const message =
      queryError instanceof Error
        ? queryError.message
        : "Unable to load gallery.";
    content = (
      <div className="max-w-4xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Gallery not found</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate("/gallery")}>
          Back to Gallery
        </Button>
      </div>
    );
  } else {
    const createdDate = gallery.createdAt
      ? new Date(gallery.createdAt).toLocaleDateString()
      : null;

    content = (
      <div className="max-w-6xl mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <Card className="shadow-large">
          <CardHeader>
            <CardTitle className="text-3xl">{gallery.title}</CardTitle>
            <CardDescription className="space-y-1">
              <p>{gallery.description || "Photo collection"}</p>
              {createdDate && (
                <span className="text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {createdDate}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Array.isArray(gallery.images) && gallery.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gallery.images.map((image: string, idx: number) => (
                  <div
                    key={`${image}-${idx}`}
                    className="relative group overflow-hidden rounded-lg border cursor-pointer"
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <img
                      src={image}
                      alt={`${gallery.title} ${idx + 1}`}
                      className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <Images className="w-4 h-4" />
                <AlertTitle>No images</AlertTitle>
                <AlertDescription>
                  This gallery does not have any images yet.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 w-full pt-20">
        <div className="px-4 sm:px-6 lg:px-8">{content}</div>
      </main>
      <Footer />

      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Gallery Image</DialogTitle>
          </DialogHeader>
          {selectedIndex !== null && gallery?.images?.[selectedIndex] && (
            <div className="relative">
              <img
                src={gallery.images[selectedIndex]}
                alt={`Gallery image ${selectedIndex + 1}`}
                className="w-full h-auto rounded-lg max-h-[80vh] object-contain bg-black"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&auto=format&fit=crop";
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => {
                    if (prev === null || !gallery.images) return prev;
                    return prev === 0 ? gallery.images.length - 1 : prev - 1;
                  });
                }}
                disabled={gallery.images.length <= 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => {
                    if (prev === null || !gallery.images) return prev;
                    return prev === gallery.images.length - 1 ? 0 : prev + 1;
                  });
                }}
                disabled={gallery.images.length <= 1}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryDetailPage;

