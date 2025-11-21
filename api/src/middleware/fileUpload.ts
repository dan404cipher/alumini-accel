import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const ensureUploadsDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure multer for document uploads (PDF, DOC, DOCX)
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/documents/";
    ensureUploadsDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter for documents
const documentFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
  }
};

// Create multer instance for document uploads
export const documentUpload = multer({
  storage: documentStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
});

// Middleware for single document upload
export const uploadSingleDocument = (fieldName: string) => {
  return documentUpload.single(fieldName) as any;
};

// Optional file upload - doesn't require a file
export const uploadOptionalDocument = (fieldName: string) => {
  return multer({
    storage: documentStorage,
    fileFilter: documentFilter,
    limits: { 
      fileSize: 10 * 1024 * 1024, // 10MB limit for documents/certificates
      files: 1, // Only one file allowed
    },
  }).single(fieldName) as any;
};

// Middleware for multiple document uploads
export const uploadMultipleDocuments = (
  fieldName: string,
  maxCount: number = 5
) => {
  return documentUpload.array(fieldName, maxCount) as any;
};

// Middleware for mixed document uploads
export const uploadMixedDocuments = (
  fields: Array<{ name: string; maxCount: number }>
) => {
  return documentUpload.fields(fields) as any;
};
