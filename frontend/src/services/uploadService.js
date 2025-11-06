/**
 * Upload service
 */

import { apiService } from './api';
import { supabaseService } from './supabaseClient';
import { FILE_CONSTRAINTS } from '../utils/constants';
import { validateImageFile, compressImage } from '../utils/imageUtils';

class UploadService {
  /**
   * Upload single file
   */
  async uploadFile(file, options = {}) {
    if (!file) throw new Error('File is required');

    const {
      bucket = 'public',
      folder = 'uploads',
      compress = true,
      maxWidth = 1200,
      quality = 0.8,
      onProgress = null,
    } = options;

    // Validate file
    const validation = validateImageFile(file, {
      maxSize: FILE_CONSTRAINTS.MAX_FILE_SIZE,
      allowedTypes: FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES,
    });

    if (!validation.isValid) {
      throw new Error(validation.errors[0]);
    }

    let fileToUpload = file;

    // Compress image if needed
    if (compress && file.type.startsWith('image/')) {
      try {
        fileToUpload = await compressImage(file, maxWidth, quality);
      } catch (error) {
        console.warn('Image compression failed, using original file:', error);
      }
    }

    // Generate unique filename
    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    try {
      // Try Supabase upload first
      const { data, error } = await supabaseService.uploadFile(
        bucket,
        filePath,
        fileToUpload,
        {
          cacheControl: '3600',
          upsert: false,
        }
      );

      if (error) throw error;

      const publicUrl = supabaseService.getPublicUrl(bucket, filePath);
      
      return {
        url: publicUrl,
        path: filePath,
        fileName: fileName,
        size: fileToUpload.size,
        type: fileToUpload.type,
        bucket: bucket,
      };
    } catch (supabaseError) {
      // Fallback to traditional API upload
      console.log('Supabase upload failed, trying traditional API...');
      
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('bucket', bucket);
      formData.append('folder', folder);

      const response = await apiService.upload('/upload', formData, onProgress);
      return response;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files, options = {}) {
    if (!files || !files.length) throw new Error('Files are required');

    const uploadPromises = files.map(file => 
      this.uploadFile(file, options)
    );

    const results = await Promise.allSettled(uploadPromises);

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          file: files[index].name,
          error: result.reason.message,
        });
      }
    });

    return {
      successful,
      failed,
      total: files.length,
      successfulCount: successful.length,
      failedCount: failed.length,
    };
  }

  /**
   * Upload product images
   */
  async uploadProductImages(files, productId, options = {}) {
    if (!files || !files.length) throw new Error('Files are required');
    if (!productId) throw new Error('Product ID is required');

    const uploadOptions = {
      bucket: 'products',
      folder: `products/${productId}`,
      compress: true,
      maxWidth: 800,
      quality: 0.7,
      ...options,
    };

    return await this.uploadFiles(files, uploadOptions);
  }

  /**
   * Upload user avatar
   */
  async uploadUserAvatar(file, userId, options = {}) {
    if (!file) throw new Error('File is required');
    if (!userId) throw new Error('User ID is required');

    const uploadOptions = {
      bucket: 'avatars',
      folder: `users/${userId}`,
      compress: true,
      maxWidth: 300,
      quality: 0.8,
      ...options,
    };

    const result = await this.uploadFile(file, uploadOptions);
    return result;
  }

  /**
   * Upload category image
   */
  async uploadCategoryImage(file, categoryId, options = {}) {
    if (!file) throw new Error('File is required');
    if (!categoryId) throw new Error('Category ID is required');

    const uploadOptions = {
      bucket: 'categories',
      folder: `categories/${categoryId}`,
      compress: true,
      maxWidth: 400,
      quality: 0.8,
      ...options,
    };

    const result = await this.uploadFile(file, uploadOptions);
    return result;
  }

  /**
   * Upload document
   */
  async uploadDocument(file, options = {}) {
    if (!file) throw new Error('File is required');

    // Validate document type
    const allowedTypes = FILE_CONSTRAINTS.ALLOWED_DOCUMENT_TYPES;
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de document non supporté. Types autorisés: ${allowedTypes.join(', ')}`);
    }

    // Validate file size
    const maxSize = FILE_CONSTRAINTS.MAX_FILE_SIZE * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`Taille maximale: ${FILE_CONSTRAINTS.MAX_FILE_SIZE}MB`);
    }

    const uploadOptions = {
      bucket: 'documents',
      folder: 'documents',
      compress: false,
      ...options,
    };

    return await this.uploadFile(file, uploadOptions);
  }

  /**
   * Delete file
   */
  async deleteFile(filePath, bucket = 'public') {
    if (!filePath) throw new Error('File path is required');

    try {
      // Try Supabase delete first
      await supabaseService.deleteFile(bucket, filePath);
      return { success: true, message: 'File deleted successfully' };
    } catch (supabaseError) {
      // Fallback to traditional API delete
      console.log('Supabase delete failed, trying traditional API...');
      
      await apiService.delete('/upload', {
        filePath,
        bucket,
      });
      
      return { success: true, message: 'File deleted successfully' };
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(filePath, bucket = 'public') {
    if (!filePath) throw new Error('File path is required');

    try {
      return supabaseService.getPublicUrl(bucket, filePath);
    } catch (error) {
      // Fallback to constructing URL from API
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return `${baseUrl}/uploads/${bucket}/${filePath}`;
    }
  }

  /**
   * Get signed URL for private file
   */
  async getSignedUrl(filePath, bucket = 'private', expiresIn = 3600) {
    if (!filePath) throw new Error('File path is required');

    try {
      const { data, error } = await supabaseService.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      // Fallback to API
      const response = await apiService.post('/upload/signed-url', {
        filePath,
        bucket,
        expiresIn,
      });
      
      return response.url;
    }
  }

  /**
   * List files in folder
   */
  async listFiles(folder = '', bucket = 'public', options = {}) {
    const {
      limit = 100,
      offset = 0,
      sortBy = 'name',
      sortOrder = 'asc',
    } = options;

    try {
      const { data, error } = await supabaseService.storage
        .from(bucket)
        .list(folder, {
          limit,
          offset,
          sortBy: { column: sortBy, order: sortOrder },
        });

      if (error) throw error;
      return data;
    } catch (error) {
      // Fallback to API
      return await apiService.get('/upload/list', {
        folder,
        bucket,
        limit,
        offset,
        sortBy,
        sortOrder,
      });
    }
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(bucket = 'public') {
    try {
      // Note: Supabase doesn't provide direct storage usage API
      // This would need to be implemented via your backend
      return await apiService.get('/upload/usage', { bucket });
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }

  /**
   * Create folder
   */
  async createFolder(folderPath, bucket = 'public') {
    if (!folderPath) throw new Error('Folder path is required');

    // Note: Supabase doesn't have explicit folder creation
    // Folders are created automatically when files are uploaded
    // This method creates a placeholder file to create the folder
    const placeholderContent = new Blob([''], { type: 'text/plain' });
    const placeholderFile = new File([placeholderContent], '.keep', { type: 'text/plain' });

    const filePath = `${folderPath}/.keep`;

    try {
      await supabaseService.uploadFile(bucket, filePath, placeholderFile);
      await this.deleteFile(filePath, bucket); // Delete the placeholder
      
      return { success: true, message: 'Folder created successfully' };
    } catch (error) {
      throw new Error('Failed to create folder');
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file, options = {}) {
    const {
      maxSize = FILE_CONSTRAINTS.MAX_FILE_SIZE,
      allowedTypes = [...FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES, ...FILE_CONSTRAINTS.ALLOWED_DOCUMENT_TYPES],
    } = options;

    const errors = [];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Type de fichier non supporté. Types autorisés: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push(`Taille maximale: ${maxSize}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get file preview URL
   */
  getFilePreview(file) {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return file;
  }

  /**
   * Revoke file preview URL
   */
  revokeFilePreview(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

// Create singleton instance
export const uploadService = new UploadService();

export default uploadService;
