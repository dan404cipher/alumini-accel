import { useState, useRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";

// Type assertion to fix ReactCrop TypeScript issues
const CropComponent = ReactCrop as any;
import "react-image-crop/dist/ReactCrop.css";
import "./ImageUpload.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Upload, Crop as CropIcon, RotateCcw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (file: File | null) => void;
  onImageUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
  maxSize?: number; // in MB
  aspectRatio?: number;
}

// Helper function to create a canvas element
function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Helper function to get cropped image as a file
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Calculate the crop dimensions
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = "high";

  // Draw the cropped image
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(new File([blob], fileName, { type: "image/jpeg" }));
        }
      },
      "image/jpeg",
      0.95
    );
  });
}

// Helper function to add padding to image
function addPaddingToImage(
  image: HTMLImageElement,
  padding: number,
  backgroundColor: string = "#ffffff"
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Calculate new dimensions with padding
    const paddedWidth = image.width + padding * 2;
    const paddedHeight = image.height + padding * 2;

    canvas.width = paddedWidth;
    canvas.height = paddedHeight;

    // Fill with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, paddedWidth, paddedHeight);

    // Draw the original image in the center
    ctx.drawImage(image, padding, padding, image.width, image.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(new File([blob], "padded-image.jpg", { type: "image/jpeg" }));
        }
      },
      "image/jpeg",
      0.95
    );
  });
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageChange,
  onImageUpload,
  isLoading = false,
  maxSize = 5, // 5MB default
  aspectRatio = 1, // Square by default
}) => {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(aspectRatio);
  const [padding, setPadding] = useState(20);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [showCrop, setShowCrop] = useState(false);
  const [showPadding, setShowPadding] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const onSelectFile = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `Please select an image smaller than ${maxSize}MB`,
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImgSrc(reader.result?.toString() || "");
        setShowCrop(true);
      });
      reader.readAsDataURL(file);
    },
    [maxSize, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onSelectFile,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".bmp", ".webp"],
    },
    multiple: false,
    onDragEnter: () => {},
    onDragLeave: () => {},
    onDragOver: () => {},
  });

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 90,
          },
          aspectRatio,
          width,
          height
        ),
        width,
        height
      );
      setCrop(crop);
    },
    [aspectRatio]
  );

  const onDownloadCropClick = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const image = await createImage(imgRef.current.src);
      const croppedImage = await getCroppedImg(
        image,
        completedCrop,
        "cropped-image.jpg"
      );
      onImageChange(croppedImage);
      setShowCrop(false);
      setShowPadding(true);
    } catch (error) {
      console.error("Error cropping image:", error);
      toast({
        title: "Error",
        description: "Failed to crop image",
        variant: "destructive",
      });
    }
  }, [completedCrop, onImageChange, toast]);

  const onAddPadding = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const image = await createImage(imgRef.current.src);
      const croppedImage = await getCroppedImg(
        image,
        completedCrop,
        "cropped-image.jpg"
      );

      // Convert File to HTMLImageElement for padding
      const paddedImageElement = await createImage(
        URL.createObjectURL(croppedImage)
      );
      const paddedImage = await addPaddingToImage(
        paddedImageElement,
        padding,
        backgroundColor
      );
      onImageChange(paddedImage);
      setShowPadding(false);
    } catch (error) {
      console.error("Error adding padding:", error);
      toast({
        title: "Error",
        description: "Failed to add padding to image",
        variant: "destructive",
      });
    }
  }, [completedCrop, padding, backgroundColor, onImageChange, toast]);

  const onUpload = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      const image = await createImage(imgRef.current.src);
      const croppedImage = await getCroppedImg(
        image,
        completedCrop,
        "profile-image.jpg"
      );

      // Convert File to HTMLImageElement for padding
      const paddedImageElement = await createImage(
        URL.createObjectURL(croppedImage)
      );
      const paddedImage = await addPaddingToImage(
        paddedImageElement,
        padding,
        backgroundColor
      );
      await onImageUpload(paddedImage);
      setShowCrop(false);
      setShowPadding(false);
      setImgSrc("");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  }, [completedCrop, padding, backgroundColor, onImageUpload, toast]);

  const resetImage = () => {
    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    setShowCrop(false);
    setShowPadding(false);
    onImageChange(null);
  };

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {currentImage && !showCrop && !showPadding && (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Current profile"
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
          />
         
        </div>
      )}

      {/* Upload Area */}
      

      {/* Image Cropping */}
      {showCrop && imgSrc && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Crop Your Image</h3>
                <Button variant="outline" size="sm" onClick={resetImage}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Aspect Ratio:</label>
                  <select
                    value={aspect || ""}
                    onChange={(e) =>
                      setAspect(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value="">Free</option>
                    <option value={1}>1:1 (Square)</option>
                    <option value={4 / 3}>4:3</option>
                    <option value={16 / 9}>16:9</option>
                    <option value={3 / 4}>3:4</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Scale:</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">
                    {Math.round(scale * 100)}%
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Rotate:</label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotate}
                    onChange={(e) => setRotate(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">{rotate}°</span>
                </div>
              </div>

              <div className="flex justify-center">
                <CropComponent
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={aspect}
                  minWidth={50}
                  minHeight={50}
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxHeight: "400px",
                      maxWidth: "400px",
                    }}
                    onLoad={onImageLoad}
                  />
                </CropComponent>
              </div>

              <div className="flex justify-center space-x-2">
                <Button onClick={onDownloadCropClick} disabled={!completedCrop}>
                  <CropIcon className="w-4 h-4 mr-2" />
                  Crop Image
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Padding Options */}
      {showPadding && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Padding</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPadding(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Padding Size (px):
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0px</span>
                    <span>{padding}px</span>
                    <span>100px</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Background Color:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-12 h-8 border rounded"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-2">
                <Button onClick={onAddPadding}>
                  <Download className="w-4 h-4 mr-2" />
                  Apply Padding
                </Button>
                <Button onClick={onUpload} disabled={isLoading}>
                  {isLoading ? "Uploading..." : "Upload Image"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageUpload;
