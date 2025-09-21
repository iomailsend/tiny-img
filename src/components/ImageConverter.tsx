import React, { useState, useCallback } from 'react';
import { Upload, Download, Image as ImageIcon, Zap, Settings, Moon, Sun } from 'lucide-react';

interface ConvertedImage {
  id: string;
  originalFile: File;
  originalSize: number;
  convertedBlob: Blob;
  convertedSize: number;
  compressionRatio: number;
  preview: string;
}

const ImageConverter: React.FC = () => {
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [dragOver, setDragOver] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const convertImageToWebP = useCallback((file: File): Promise<ConvertedImage> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image on canvas
        ctx?.drawImage(img, 0, 0);

        // Convert to WebP
        canvas.toBlob((blob) => {
          if (blob) {
            const convertedImage: ConvertedImage = {
              id: Math.random().toString(36).substr(2, 9),
              originalFile: file,
              originalSize: file.size,
              convertedBlob: blob,
              convertedSize: blob.size,
              compressionRatio: Math.round((1 - blob.size / file.size) * 100),
              preview: URL.createObjectURL(blob)
            };
            resolve(convertedImage);
          } else {
            reject(new Error('Failed to convert image'));
          }
        }, 'image/webp', quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, [quality]);

  const convertImageFromUrl = useCallback(async (url: string): Promise<ConvertedImage> => {
    return new Promise(async (resolve, reject) => {
      try {
        // First, fetch the image to get the actual file size
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch image from URL');
        }
        
        const actualFileSize = parseInt(response.headers.get('content-length') || '0');
        const imageBlob = await response.blob();
        const actualOriginalSize = actualFileSize > 0 ? actualFileSize : imageBlob.size;
        
        // Create image element for canvas conversion
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob((webpBlob) => {
            if (webpBlob) {
              // Create a fake file object for consistency
              const fileName = url.split('/').pop()?.split('?')[0] || 'image';
              const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
              
              const convertedImage: ConvertedImage = {
                id: Math.random().toString(36).substr(2, 9),
                originalFile: new File([imageBlob], `${fileName.split('.')[0]}.${fileExtension}`, { type: imageBlob.type }),
                originalSize: actualOriginalSize,
                convertedBlob: webpBlob,
                convertedSize: webpBlob.size,
                compressionRatio: Math.round((1 - webpBlob.size / actualOriginalSize) * 100),
                preview: URL.createObjectURL(webpBlob)
              };
              resolve(convertedImage);
            } else {
              reject(new Error('Failed to convert image to WebP'));
            }
          }, 'image/webp', quality);
        };
        
        img.onerror = () => reject(new Error('Failed to load image from URL. Please check the URL and try again.'));
        img.src = URL.createObjectURL(imageBlob);
        
      } catch (error) {
        reject(new Error('Failed to fetch image from URL. Please check the URL and try again.'));
      }
    });
  }, [quality]);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a fake file object for consistency
            const fileName = url.split('/').pop()?.split('?')[0] || 'image';
            const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : 'jpg';
            const originalSize = blob.size; // We'll estimate this
            
            canvas.toBlob((webpBlob) => {
              if (webpBlob) {
                const convertedImage: ConvertedImage = {
                  id: Math.random().toString(36).substr(2, 9),
                  originalFile: new File([blob], `${fileName.split('.')[0]}.${fileExtension}`, { type: blob.type }),
                  originalSize: originalSize,
                  convertedBlob: webpBlob,
                  convertedSize: webpBlob.size,
                  compressionRatio: Math.round((1 - webpBlob.size / originalSize) * 100),
                  preview: URL.createObjectURL(webpBlob)
                };
                resolve(convertedImage);
              } else {
                reject(new Error('Failed to convert image to WebP'));
              }
            }, 'image/webp', quality);
          } else {
            reject(new Error('Failed to load image from URL'));
          }
        }, 'image/jpeg', 1.0);
      };
      
      img.onerror = () => reject(new Error('Failed to load image from URL. Please check the URL and try again.'));
      img.src = url;
    });
  }, [quality]);

  const handleFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    const validFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'].includes(file.type)
    );

    if (validFiles.length === 0) {
      setIsProcessing(false);
      alert('Please select valid image files (JPEG, PNG, GIF, BMP)');
      return;
    }
    try {
      const convertedImages = await Promise.all(
        validFiles.map(file => convertImageToWebP(file))
      );
      setImages(prev => [...prev, ...convertedImages]);
    } catch (error) {
      console.error('Error converting images:', error);
      alert('Error converting images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [convertImageToWebP]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const downloadImage = useCallback((image: ConvertedImage) => {
    const url = URL.createObjectURL(image.convertedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${image.originalFile.name.split('.')[0]}.webp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const downloadAll = useCallback(() => {
    images.forEach(image => downloadImage(image));
  }, [images, downloadImage]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const clearAll = useCallback(() => {
    images.forEach(image => URL.revokeObjectURL(image.preview));
    setImages([]);
  }, [images]);

  const handleUrlConvert = useCallback(async () => {
    if (!imageUrl.trim()) return;
    
    setIsProcessingUrl(true);
    try {
      const convertedImage = await convertImageFromUrl(imageUrl.trim());
      setImages(prev => [...prev, convertedImage]);
      setImageUrl('');
    } catch (error) {
      console.error('Error converting image from URL:', error);
      alert(error instanceof Error ? error.message : 'Failed to convert image from URL. Please check the URL and try again.');
    } finally {
      setIsProcessingUrl(false);
    }
  }, [imageUrl, convertImageFromUrl]);
  const totalSavings = images.reduce((acc, img) => acc + (img.originalSize - img.convertedSize), 0);

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Theme Toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full transition-all duration-300 ${
              isDarkMode
                ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700 shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
            }`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            WebP Converter Pro
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Convert and optimize your images to WebP format for faster web performance. 
            Reduce file sizes by up to 80% without compromising quality.
          </p>
        </div>

        {/* Quality Settings */}
        <div className="mb-8 max-w-md mx-auto">
          <div className={`rounded-xl p-6 shadow-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center mb-4">
              <Settings className={`w-5 h-5 mr-2 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Quality Settings</h3>
            </div>
            <div className="space-y-2">
              <div className={`flex justify-between text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                <span>Quality: {Math.round(quality * 100)}%</span>
                <span>{quality === 1 ? 'Lossless' : quality >= 0.8 ? 'High' : quality >= 0.6 ? 'Medium' : 'Low'}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`relative mb-8 border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            dragOver
              ? isDarkMode
                ? 'border-blue-400 bg-blue-900/20 scale-105'
                : 'border-blue-400 bg-blue-50 scale-105'
              : isDarkMode
                ? 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className={`text-xl font-semibold mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                {dragOver ? 'Drop your images here' : 'Drag & drop images here'}
              </p>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                or <span className={`font-medium ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>browse files</span>
              </p>
              <p className={`text-sm mt-2 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                Supports JPEG, PNG, GIF, BMP formats
              </p>
            </div>
          </div>
        </div>

        {/* URL Input Section */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className={`rounded-xl p-6 shadow-lg transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="text-center mb-4">
              <h3 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Or convert from URL</h3>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Paste a direct link to any image</p>
            </div>
            <div className="flex gap-3">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && imageUrl.trim() && !isProcessingUrl) {
                    handleUrlConvert();
                  }
                }}
                placeholder="https://example.com/image.jpg"
                className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                disabled={isProcessingUrl}
              />
              <button
                onClick={handleUrlConvert}
                disabled={!imageUrl.trim() || isProcessingUrl}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingUrl ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Convert
              </button>
            </div>
          </div>
        </div>
        {/* Processing Indicator */}
        {(isProcessing || isProcessingUrl) && (
          <div className="text-center mb-8">
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${
              isDarkMode 
                ? 'bg-blue-900/30 text-blue-300' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              {isProcessingUrl ? 'Converting image from URL...' : 'Converting images...'}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`rounded-xl p-6 shadow-lg text-center transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
            }`}>
              <div className="text-3xl font-bold text-blue-600 mb-2">{images.length}</div>
              <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Images Converted</div>
            </div>
            <div className={`rounded-xl p-6 shadow-lg text-center transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
            }`}>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(images.reduce((acc, img) => acc + img.compressionRatio, 0) / images.length)}%
              </div>
              <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Average Savings</div>
            </div>
            <div className={`rounded-xl p-6 shadow-lg text-center transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
            }`}>
              <div className="text-3xl font-bold text-purple-600 mb-2">{formatFileSize(totalSavings)}</div>
              <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Total Saved</div>
            </div>
          </div>
        )}

        {/* Converted Images */}
        {images.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>Converted Images</h2>
              <div className="space-x-3">
                <button
                  onClick={downloadAll}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </button>
                <button
                  onClick={clearAll}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <div key={image.id} className={`rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                }`}>
                  <div className={`aspect-video relative overflow-hidden ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <img
                      src={image.preview}
                      alt="Converted"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image preview failed to load:', e);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                      onLoad={() => console.log('Image preview loaded successfully')}
                    />
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <ImageIcon className={`w-12 h-12 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center mb-3">
                      <ImageIcon className={`w-4 h-4 mr-2 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`text-sm font-medium truncate ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {image.originalFile.name}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Original:</span>
                        <span className="font-medium">{formatFileSize(image.originalSize)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>WebP:</span>
                        <span className="font-medium text-green-600">{formatFileSize(image.convertedSize)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Saved:</span>
                        <span className="font-bold text-green-600">{image.compressionRatio}%</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => downloadImage(image)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download WebP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageConverter;