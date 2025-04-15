/**
 * Service for handling photo uploads, conversions to base64, etc.
 */

// Check if a file is a valid image 
export function isValidImageFile(file: File): boolean {
  // Valid image MIME types
  const validTypes = [
    'image/jpeg', 
    'image/png', 
    'image/gif', 
    'image/webp', 
    'image/bmp',
    'image/svg+xml'
  ];
  return validTypes.includes(file.type);
}

// Convert a File object to a base64 string
export async function fileToBase64(file: File): Promise<string> {
  console.log('Converting file to base64:', file.name, file.type);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.warn('FileReader timed out');
      reject(new Error('File reading timed out'));
    }, 10000);
    
    reader.onload = () => {
      clearTimeout(timeout);
      const result = reader.result as string;
      console.log('File converted to base64, length:', result?.length || 0);
      resolve(result);
    };
    
    reader.onerror = error => {
      clearTimeout(timeout);
      console.error('Error reading file:', error);
      reject(error);
    };
    
    reader.readAsDataURL(file);
  });
}

// Direct method to handle image upload without resizing (fallback)
export async function processImageDirect(file: File): Promise<string | null> {
  console.log('Processing image directly:', file.name);
  try {
    const result = await fileToBase64(file);
    if (result && typeof result === 'string' && result.startsWith('data:')) {
      return result;
    }
    console.error('Invalid direct base64 result');
    return null;
  } catch (error) {
    console.error('Direct processing failed:', error);
    return null;
  }
}

// Resize an image to a maximum width/height while maintaining aspect ratio
export async function resizeImage(file: File, maxWidth = 1000, maxHeight = 1000): Promise<File | null> {
  console.log('Resizing image:', file.name, 'current size:', Math.round(file.size / 1024), 'KB');
  
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      // Set timeout to prevent hanging - reduced from 10s to 5s
      const timeout = setTimeout(() => {
        console.warn('Image resize timed out');
        URL.revokeObjectURL(url);
        resolve(null);
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        
        try {
          // Check if resizing is needed - more aggressive size check
          if (img.width <= maxWidth && img.height <= maxHeight && file.size < 500 * 1024) {
            console.log('Image is already small enough, skipping resize');
            resolve(file);
            return;
          }
          
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.error('Could not get canvas context');
            resolve(null);
            return;
          }
          
          // Use better quality settings for drawing
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            blob => {
              if (!blob) {
                console.error('Canvas to Blob conversion failed');
                resolve(null);
                return;
              }
              
              const resizedFile = new File(
                [blob], 
                file.name, 
                { 
                  type: file.type, 
                  lastModified: file.lastModified 
                }
              );
              
              console.log('Resize complete, new size:', Math.round(resizedFile.size / 1024), 'KB');
              resolve(resizedFile);
            },
            file.type,
            0.8 // Quality parameter - slightly reduced from 0.85 for better compression
          );
        } catch (error) {
          console.error('Error in resize processing:', error);
          resolve(null);
        }
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        console.error('Error loading image for resize:', error);
        resolve(null);
      };
      
      img.src = url;
    } catch (error) {
      console.error('Resize image exception:', error);
      resolve(null);
    }
  });
}

// Process multiple image files for upload - resize and convert to base64
export async function processImages(files: FileList): Promise<string[]> {
  console.log('Processing', files.length, 'images');
  const processedImages: string[] = [];
  
  // Limit to 10 files at a time to prevent browser hanging
  const maxFilesToProcess = Math.min(10, files.length);
  if (files.length > maxFilesToProcess) {
    console.warn(`Limiting to ${maxFilesToProcess} images for performance (${files.length} selected)`);
  }
  
  for (let i = 0; i < maxFilesToProcess; i++) {
    const file = files[i];
    console.log(`Processing file ${i+1}/${maxFilesToProcess}:`, file.name, file.type);
    
    // Check if it's a valid image file
    if (!isValidImageFile(file)) {
      console.warn(`Skipping non-image file: ${file.name} (${file.type})`);
      continue;
    }
    
    // Validate file size - skip files larger than 10MB (reduced from 15MB)
    if (file.size > 10 * 1024 * 1024) {
      console.warn(`Skipping large file: ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`);
      continue;
    }
    
    try {
      // First try to resize the image - use smaller dimensions (1000px instead of 1200px)
      const resizedFile = await resizeImage(file, 1000, 1000);
      
      if (resizedFile) {
        // Convert resized image to base64
        const base64Image = await fileToBase64(resizedFile);
        
        // Validate the base64 result
        if (base64Image && typeof base64Image === 'string' && base64Image.startsWith('data:')) {
          processedImages.push(base64Image);
          console.log('Image processed successfully');
          continue;
        }
      }
      
      // If resize failed, try direct conversion as fallback (but only for smaller files < 3MB)
      if (file.size < 3 * 1024 * 1024) {
        console.log('Resize failed, trying direct conversion for small file');
        const directBase64 = await processImageDirect(file);
        
        if (directBase64) {
          processedImages.push(directBase64);
          console.log('Direct conversion successful');
        } else {
          console.error('Failed to process image:', file.name);
        }
      } else {
        console.warn('Skipping direct conversion for large file:', file.name);
      }
    } catch (error) {
      console.error(`Error processing image: ${file.name}`, error);
    }
  }
  
  console.log('Processed', processedImages.length, 'of', maxFilesToProcess, 'images');
  return processedImages;
}

// Simple cache for thumbnails to prevent regenerating the same ones
const thumbnailCache = new Map<string, string>();

// Clear the thumbnail cache
export function clearThumbnailCache(): void {
  console.log('Clearing thumbnail cache');
  thumbnailCache.clear();
}

// Get a thumbnail version of a base64 image (for previews)
export function getThumbnail(base64Image: string, size = 500, key = ''): Promise<string> {
  return new Promise((resolve) => {
    try {
      // If the input is not a valid base64 image, return it as is
      if (!base64Image || typeof base64Image !== 'string' || !base64Image.startsWith('data:')) {
        console.warn('Invalid image data provided to getThumbnail');
        resolve(base64Image); // Return the original input
        return;
      }
      
      // Generate a cache key - first 50 chars + image size should be enough for uniqueness
      const cacheKey = base64Image.substring(0, 50) + size + key;
      
      // Check if we already have this thumbnail in cache
      if (thumbnailCache.has(cacheKey)) {
        // console.log('Using cached thumbnail');
        resolve(thumbnailCache.get(cacheKey) as string);
        return;
      }
      
      const img = new Image();
      
      // Set a timeout to avoid hanging if the image loading takes too long
      const timeout = setTimeout(() => {
        console.warn('Thumbnail generation timed out');
        resolve(base64Image); // Return original on timeout
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error('Could not get canvas context');
            resolve(base64Image);
            return;
          }
          
          // Calculate dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            height = (height * size) / width;
            width = size;
          } else {
            width = (width * size) / height;
            height = size;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Use better quality rendering
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const thumbnailData = canvas.toDataURL('image/jpeg', 0.9); // Higher quality - 0.9 instead of 0.7
          
          // Save to cache
          thumbnailCache.set(cacheKey, thumbnailData);
          
          // Limit cache size to 100 items to prevent memory issues
          if (thumbnailCache.size > 100) {
            // Delete the oldest entry (first key in the map)
            const firstKey = thumbnailCache.keys().next().value;
            if (firstKey) {
              thumbnailCache.delete(firstKey);
            }
          }
          
          resolve(thumbnailData);
        } catch (error) {
          console.error('Error generating thumbnail:', error);
          resolve(base64Image); // Return original on error
        }
      };
      
      img.onerror = (error) => {
        clearTimeout(timeout);
        console.error('Error loading image for thumbnail:', error);
        resolve(base64Image); // Return original on error
      };
      
      img.src = base64Image;
    } catch (error) {
      console.error('Error in getThumbnail:', error);
      resolve(base64Image);
    }
  });
} 