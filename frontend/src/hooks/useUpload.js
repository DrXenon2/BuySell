import { useState, useCallback } from 'react';
import { uploadService } from '../services/uploadService';

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const uploadFile = useCallback(async (file, folder = 'products', userId) => {
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      // Validation
      const validation = uploadService.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Upload
      const result = await uploadService.uploadFile(file, folder, userId);
      
      setUploadedFiles(prev => [...prev, result]);
      setProgress(100);
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  const uploadMultipleFiles = useCallback(async (files, folder = 'products', userId) => {
    setUploading(true);
    setError('');
    setProgress(0);

    try {
      // Validation de tous les fichiers
      files.forEach(file => {
        const validation = uploadService.validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
      });

      // Upload séquentiel avec progression
      const results = [];
      for (let i = 0; i < files.length; i++) {
        const result = await uploadService.uploadFile(files[i], folder, userId);
        results.push(result);
        setProgress(((i + 1) / files.length) * 100);
      }

      setUploadedFiles(prev => [...prev, ...results]);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  const deleteFile = useCallback(async (fileName, userId) => {
    try {
      await uploadService.deleteFile(fileName, userId);
      setUploadedFiles(prev => prev.filter(file => file.fileName !== fileName));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const clearFiles = useCallback(() => {
    setUploadedFiles([]);
    setError('');
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    uploading,
    progress,
    error,
    uploadedFiles,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    clearFiles,
    clearError
  };
}
