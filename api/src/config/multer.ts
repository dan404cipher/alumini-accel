import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directories exist
const uploadDirs = [
  "uploads",
  "uploads/profile-images",
  "uploads/documents",
  "uploads/events",
  "uploads/news",
  "uploads/gallery",
  "uploads/tenant-logos",
  "uploads/tenant-banners",
  "uploads/campaigns",
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for profile images
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile-images/");
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

// File filter for profile images
const profileImageFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      )
    );
  }
};

// Multer configuration for profile images
export const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: profileImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// General file storage for other uploads
const generalStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/documents/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

export const uploadGeneral = multer({
  storage: generalStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Configure multer for gallery images
const galleryImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/gallery/");
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `gallery-${uniqueSuffix}${ext}`);
  },
});

// File filter for gallery images
const galleryImageFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check file type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      )
    );
  }
};

// Multer configuration for gallery images
export const uploadGalleryImages = multer({
  storage: galleryImageStorage,
  fileFilter: galleryImageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per image
  },
});

// Configure multer for tenant logos
const tenantLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/tenant-logos/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `logo-${uniqueSuffix}${ext}`);
  },
});

// File filter for tenant logos
const tenantLogoFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      )
    );
  }
};

// Multer configuration for tenant logos
export const uploadTenantLogo = multer({
  storage: tenantLogoStorage,
  fileFilter: tenantLogoFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for logos
  },
});

// Configure multer for tenant banners
const tenantBannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/tenant-banners/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `banner-${uniqueSuffix}${ext}`);
  },
});

// File filter for tenant banners
const tenantBannerFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      )
    );
  }
};

// Multer configuration for tenant banners
export const uploadTenantBanner = multer({
  storage: tenantBannerStorage,
  fileFilter: tenantBannerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for banners
  },
});

// Configure multer for campaign images
const campaignImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/campaigns/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `campaign-${uniqueSuffix}${ext}`);
  },
});

// File filter for campaign images
const campaignImageFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
      )
    );
  }
};

// Multer configuration for campaign images
export const uploadCampaignImage = multer({
  storage: campaignImageStorage,
  fileFilter: campaignImageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for campaign images
  },
});
