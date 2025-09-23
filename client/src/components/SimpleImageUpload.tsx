import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SimpleImageUploadProps {
  currentImage?: string;
  onImageChange: (file: File | null) => void;
  onImageUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
  maxSize?: number; // in MB
}

const SimpleImageUpload: React.FC<SimpleImageUploadProps> = ({
  currentImage,
  onImageChange,
  onImageUpload,
  isLoading = false,
  maxSize = 5, // 5MB default
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  console.log("=== SIMPLE IMAGE UPLOAD COMPONENT RENDERED ===");
  console.log("Props:", { currentImage, isLoading, maxSize });
  console.log("State:", { imageFile: !!imageFile, previewUrl });

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      console.log("=== FILE SELECTION DEBUG ===");
      const file = event.target.files?.[0];
      if (!file) {
        console.log("No file selected");
        return;
      }

      console.log("File selected:", file.name, file.size, file.type);

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        console.log(
          "File too large:",
          file.size,
          "max:",
          maxSize * 1024 * 1024
        );
        toast({
          title: "File too large",
          description: `Please select an image smaller than ${maxSize}MB`,
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        console.log("Invalid file type:", file.type);
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      console.log("File validation passed, setting up preview...");
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageChange(file);
      console.log("=== FILE SELECTION DEBUG END ===");
    },
    [maxSize, toast, onImageChange]
  );

  const handleUpload = async () => {
    if (!imageFile) {
      console.log("No image file to upload");
      return;
    }

    console.log("=== UPLOAD DEBUG START ===");
    console.log("Starting upload for file:", imageFile.name);

    try {
      await onImageUpload(imageFile);
      console.log("Upload completed successfully");
      // Reset after successful upload
      setImageFile(null);
      setPreviewUrl("");
      onImageChange(null);
    } catch (error) {
      console.error("Upload failed:", error);
    }
    console.log("=== UPLOAD DEBUG END ===");
  };

  const resetImage = () => {
    setImageFile(null);
    setPreviewUrl("");
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {currentImage && !previewUrl && (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Current profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 p-0"
            onClick={resetImage}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Preview Image */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          />
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 p-0"
            onClick={resetImage}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Upload Area */}
      {!previewUrl && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Upload Profile Image</p>
                <p className="text-sm text-gray-500 mb-4">
                  Click to select an image or drag and drop
                </p>
                <p className="text-xs text-gray-400">
                  Max size: {maxSize}MB • Supported: JPG, PNG, GIF, WebP
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Uploading..." : "Select Image"}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button (when preview is shown) */}
      {previewUrl && (
        <div className="flex justify-center space-x-2">
          <Button
            onClick={handleUpload}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Uploading..." : "Upload Image"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SimpleImageUpload;
