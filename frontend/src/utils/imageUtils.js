/**
 * Image utility functions
 */

/**
 * Preload image
 * @param {string} src - Image source
 * @returns {Promise} Promise that resolves when image is loaded
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Get image dimensions
 * @param {string} src - Image source
 * @returns {Promise<Object>} Promise with image dimensions
 */
export const getImageDimensions = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Create image placeholder
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {string} text - Placeholder text
 * @returns {string} Data URL placeholder
 */
export const createImagePlaceholder = (width, height, text = 'Image') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  // Background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);
  
  // Text
  ctx.fillStyle = '#9ca3af';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  return canvas.toDataURL();
};

/**
 * Compress image
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - Image quality (0-1)
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    reader.onload = (e) => {
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Convert File to Base64
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image file
 * @param {File} file - Image file
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSize = 5, // MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    minWidth = 100,
    minHeight = 100,
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
};

/**
 * Create image URL from File/Blob
 * @param {File|Blob} file - File or Blob object
 * @returns {string} Object URL
 */
export const createObjectURL = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke object URL
 * @param {string} url - Object URL to revoke
 */
export const revokeObjectURL = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Lazy load image
 * @param {HTMLImageElement} img - Image element
 * @param {string} src - Image source
 * @returns {Promise} Promise that resolves when image is loaded
 */
export const lazyLoadImage = (img, src) => {
  return new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
};
