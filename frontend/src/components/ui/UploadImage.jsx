'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

export function UploadImage({ 
  onUploadComplete, 
  folder = 'products', 
  userId,
  multiple = false,
  maxFiles = 5,
  existingImages = []
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState(existingImages);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    if (files.length > maxFiles) {
      setError(`Maximum ${maxFiles} fichiers autorisés`);
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    const uploadPromises = files.map(async (file, index) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('userId', userId);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          // Simuler la progression
          setProgress(((index + 1) / files.length) * 100);
          return result.data;
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const newImages = [...uploadedImages, ...results];
      setUploadedImages(newImages);
      
      if (onUploadComplete) {
        onUploadComplete(multiple ? newImages : results[0]);
      }
      
      setProgress(100);
    } catch (error) {
      setError(`Erreur lors de l'upload: ${error.message}`);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    }
  };

  const handleRemoveImage = async (image, index) => {
    try {
      const response = await fetch(`/api/upload?fileName=${image.fileName}&userId=${userId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        const newImages = uploadedImages.filter((_, i) => i !== index);
        setUploadedImages(newImages);
        
        if (onUploadComplete && multiple) {
          onUploadComplete(newImages);
        }
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Erreur lors de la suppression');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    handleFileUpload({ target: { files } });
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="w-full">
      {/* Zone de drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${uploading ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileUpload}
          multiple={multiple}
          disabled={uploading}
          className="hidden"
        />
        
        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {uploading ? 'Upload en cours...' : 'Cliquez ou glissez-déposez pour uploader'}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, WEBP, GIF jusqu'à 10MB
              {multiple && `, maximum ${maxFiles} fichiers`}
            </p>
          </div>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">{Math.round(progress)}%</p>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Images uploadées */}
      {uploadedImages.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Images uploadées ({uploadedImages.length})
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={image.publicUrl}
                    alt={`Uploaded ${index + 1}`}
                    width={150}
                    height={150}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveImage(image, index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
