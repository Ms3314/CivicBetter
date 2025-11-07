// import { supabase } from '../config/supabase.config';

// export interface UploadResult {
//   url: string;
//   path: string;
//   error?: string;
// }

// /**
//  * Get content type from file extension
//  */
// function getContentType(fileName: string): string {
//   const ext = fileName.split('.').pop()?.toLowerCase();
//   const contentTypes: Record<string, string> = {
//     jpg: 'image/jpeg',
//     jpeg: 'image/jpeg',
//     png: 'image/png',
//     gif: 'image/gif',
//     webp: 'image/webp',
//     svg: 'image/svg+xml',
//   };
//   return contentTypes[ext || ''] || 'image/jpeg';
// }

// /**
//  * Upload image to Supabase Storage
//  * @param file - File buffer or Blob
//  * @param fileName - Name of the file
//  * @param folder - Folder path in storage bucket (e.g., 'issues', 'avatars')
//  * @param contentType - Optional content type, will be auto-detected if not provided
//  * @returns Public URL of the uploaded file
//  */
// export async function uploadImage(
//   file: Buffer | Blob,
//   fileName: string,
//   folder: string = 'issues',
//   contentType?: string
// ): Promise<UploadResult> {
//   try {
//     // Generate unique filename to avoid conflicts
//     const timestamp = Date.now();
//     const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
//     const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
//     const filePath = `${folder}/${uniqueFileName}`;

//     // Upload to Supabase Storage
//     const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'images';
//     const fileContentType = contentType || getContentType(fileName);
    
//     const { data, error } = await supabase.storage
//       .from(bucketName)
//       .upload(filePath, file, {
//         contentType: fileContentType,
//         upsert: false, // Don't overwrite existing files
//       });

//     if (error) {
//       console.error('Supabase upload error:', error);
//       return {
//         url: '',
//         path: filePath,
//         error: error.message,
//       };
//     }

//     // Get public URL
//     const { data: urlData } = supabase.storage
//       .from(bucketName)
//       .getPublicUrl(filePath);

//     return {
//       url: urlData.publicUrl,
//       path: filePath,
//     };
//   } catch (error) {
//     console.error('Upload error:', error);
//     return {
//       url: '',
//       path: '',
//       error: error instanceof Error ? error.message : 'Unknown error',
//     };
//   }
// }

// /**
//  * Delete image from Supabase Storage
//  * @param filePath - Path of the file to delete
//  * @returns Success status
//  */
// export async function deleteImage(filePath: string): Promise<boolean> {
//   try {
//     const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'images';
    
//     const { error } = await supabase.storage
//       .from(bucketName)
//       .remove([filePath]);

//     if (error) {
//       console.error('Delete error:', error);
//       return false;
//     }

//     return true;
//   } catch (error) {
//     console.error('Delete error:', error);
//     return false;
//   }
// }

// /**
//  * Upload multiple images
//  * @param files - Array of file buffers/blobs with names
//  * @param folder - Folder path in storage bucket
//  * @returns Array of upload results
//  */
// export async function uploadMultipleImages(
//   files: Array<{ buffer: Buffer | Blob; name: string }>,
//   folder: string = 'issues'
// ): Promise<UploadResult[]> {
//   const uploadPromises = files.map((file) =>
//     uploadImage(file.buffer, file.name, folder)
//   );

//   return Promise.all(uploadPromises);
// }

