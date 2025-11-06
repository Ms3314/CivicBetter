import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Configure multer to store files in memory as Buffer
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware for single image upload
export const uploadSingle = upload.single('image');

// Middleware for multiple images
export const uploadMultiple = upload.array('images', 10); // Max 10 images

// Error handler for multer
export function handleUploadError(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  next(err);
}

