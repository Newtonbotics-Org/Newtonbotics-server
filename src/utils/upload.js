const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Check if running on Vercel (serverless environment)
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;

// Create uploads directory if it doesn't exist (skip on Vercel - use Cloudinary instead)
let uploadsDir, projectDocumentsDir;

if (!isVercel) {
  // Only create directories in non-serverless environments
  uploadsDir = path.join(__dirname, '../../uploads');
  projectDocumentsDir = path.join(uploadsDir, 'project-documents');
  
  [uploadsDir, projectDocumentsDir].forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (error) {
      // Silently fail if directory creation fails (e.g., read-only filesystem)
      // This allows the app to continue running even if uploads directory can't be created
      console.warn(`Warning: Could not create uploads directory: ${dir}`, error.message);
    }
  });
} else {
  // On Vercel, use /tmp for temporary file storage (if needed)
  uploadsDir = '/tmp/uploads';
  projectDocumentsDir = '/tmp/uploads/project-documents';
}

// Configure storage for project documents
// On Vercel, use memory storage since filesystem is read-only
const storage = isVercel 
  ? multer.memoryStorage() // Use memory storage on Vercel
  : multer.diskStorage({
      destination: (req, file, cb) => {
        // Ensure directory exists before saving (lazy creation)
        try {
          if (!fs.existsSync(projectDocumentsDir)) {
            fs.mkdirSync(projectDocumentsDir, { recursive: true });
          }
          cb(null, projectDocumentsDir);
        } catch (error) {
          // Fallback to memory storage if directory creation fails
          cb(null, '/tmp');
        }
      },
      filename: (req, file, cb) => {
        // Generate unique filename: timestamp-originalname
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${name}-${uniqueSuffix}${ext}`);
      }
    });

// File filter - accept documents only
const fileFilter = (req, file, cb) => {
  // Allowed document types
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain',
    'text/markdown'
  ];
  
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
  const isValidExtension = allowedExtensions.includes(ext);
  
  if (isValidMimeType && isValidExtension) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Middleware for single file upload (for project documents)
const uploadProjectDocument = upload.single('document');

module.exports = {
  uploadProjectDocument,
  projectDocumentsDir
};
