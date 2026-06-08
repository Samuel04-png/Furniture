import React, { useState } from 'react';
import { cn } from '../lib/utils';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  fallback?: string;
}

const Image = ({
  src,
  alt,
  fill,
  priority,
  sizes,
  className,
  style,
  loading: loadingProp,
  fallback,
  ...props
}: ImageProps) => {
  const resolvedLoading = loadingProp ?? (priority ? 'eager' : undefined);
  const [hasError, setHasError] = useState(false);
  const effectiveSrc = hasError && fallback ? fallback : src;

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (fallback && !hasError) {
      setHasError(true);
      return;
    }
    props.onError?.(e);
  };

  if (fill) {
    return (
      <img
        src={effectiveSrc}
        alt={alt}
        sizes={sizes}
        loading={resolvedLoading}
        decoding="async"
        onError={handleError}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        style={{ ...style }}
        {...props}
      />
    );
  }

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      sizes={sizes}
      loading={resolvedLoading}
      decoding="async"
      onError={handleError}
      className={className}
      style={{ ...style }}
      {...props}
    />
  );
};

export default Image;
