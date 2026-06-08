import React from 'react';
import { cn } from '../lib/utils';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
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
  ...props
}: ImageProps) => {
  const resolvedLoading = loadingProp ?? (priority ? 'eager' : undefined);
  
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={resolvedLoading}
        decoding="async"
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        style={{ ...style }}
        {...props}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      loading={resolvedLoading}
      decoding="async"
      className={className}
      style={{ ...style }}
      {...props}
    />
  );
};

export default Image;
