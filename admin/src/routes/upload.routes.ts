import { Router } from 'express';
import type { Request, Response } from 'express';
import { uploadSingle, uploadMultiple, handleUploadError } from '../middleware/upload.middleware';
import { uploadImage, uploadMultipleImages } from '../utils/upload';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Upload Routes
 * All routes require authentication
 */
router.use(authenticate);

/**
 * Upload single image
 * POST /upload/image
 */
router.post('/image', uploadSingle, handleUploadError, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = (req.body.folder as string) || 'issues';
    const result = await uploadImage(
      req.file.buffer,
      req.file.originalname,
      folder,
      req.file.mimetype
    );

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json({
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upload image',
    });
  }
});

/**
 * Upload multiple images
 * POST /upload/images
 */
router.post('/images', uploadMultiple, handleUploadError, async (req: Request, res: Response) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const folder = (req.body.folder as string) || 'issues';
    const files = (req.files as Express.Multer.File[]).map((file) => ({
      buffer: file.buffer,
      name: file.originalname,
    }));

    const results = await uploadMultipleImages(files, folder);

    res.json({
      uploads: results.map((result) => ({
        url: result.url,
        path: result.path,
        error: result.error,
      })),
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upload images',
    });
  }
});

export default router;

