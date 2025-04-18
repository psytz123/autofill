import { useState, useEffect, memo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  onLoad?: () => void;
}

/**
 * Optimized image component with lazy loading and progressive enhancement
 * Automatically handles image loading states and applies best practices
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  loading = 'lazy',
  onLoad,
  ...props
}: OptimizedImageProps & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'loading' | 'width' | 'height'>) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  
  // Determine appropriate loading strategy
  const loadingStrategy = priority ? 'eager' : loading;
  
  // If image has priority, preload it
  useEffect(() => {
    if (priority && src) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = src;
      document.head.appendChild(preloadLink);
      
      return () => {
        document.head.removeChild(preloadLink);
      };
    }
  }, [priority, src]);
  
  const handleImageLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  const handleImageError = () => {
    setIsError(true);
  };
  
  return (
    <div className={`relative overflow-hidden ${isLoaded ? '' : 'bg-gray-100 animate-pulse'}`}>
      {!isLoaded && !isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-300 rounded-full animate-spin"></div>
        </div>
      )}
      
      {isError ? (
        <div className="flex items-center justify-center bg-gray-100 text-gray-400 text-sm p-4" style={{ width, height }}>
          Failed to load image
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={loadingStrategy}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          {...props}
        />
      )}
    </div>
  );
};

export default memo(OptimizedImage);