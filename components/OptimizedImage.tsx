import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  asBackground?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  asBackground,
  ...props
}: OptimizedImageProps) {
  // Convert jpg/jpeg paths to webp
  const getWebPPath = (imagePath: string) => {
    return imagePath.replace(/\.(jpg|jpeg)$/i, ".webp");
  };

  const [imgSrc, setImgSrc] = useState(getWebPPath(src));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImgSrc(getWebPPath(src));
  }, [src]);

  if (asBackground) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          ...props.style,
        }}
      >
        <picture>
          <source srcSet={getWebPPath(src)} type="image/webp" />
          <source srcSet={src} type="image/jpeg" />
          <Image
            {...props}
            src={imgSrc}
            alt={alt}
            fill
            onLoadingComplete={() => setIsLoading(false)}
            onError={() => {
              if (fallbackSrc) {
                setImgSrc(fallbackSrc);
              } else {
                // Fallback to original jpg
                setImgSrc(src);
              }
            }}
            style={{
              objectFit: "cover",
              opacity: isLoading ? 0 : 1,
              transition: "opacity 0.3s ease-in-out",
            }}
            sizes={
              props.sizes ||
              "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            }
            quality={props.quality || 75}
            loading={props.loading || "lazy"}
            placeholder={props.placeholder || "blur"}
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJiEkMj44Li4wMTQ/RDBCPUM3Ri9JVFVZW1xbN0RjamRYalFZW1f/2wBDARUXFyAeIBogHh4gIiA/NCs0Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          />
        </picture>
      </div>
    );
  }

  return (
    <picture>
      <source srcSet={getWebPPath(src)} type="image/webp" />
      <source srcSet={src} type="image/jpeg" />
      <Image
        {...props}
        src={imgSrc}
        alt={alt}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          if (fallbackSrc) {
            setImgSrc(fallbackSrc);
          } else {
            // Fallback to original jpg
            setImgSrc(src);
          }
        }}
        style={{
          ...props.style,
          opacity: isLoading ? 0 : 1,
          transition: "opacity 0.3s ease-in-out",
        }}
        sizes={
          props.sizes ||
          "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        }
        quality={props.quality || 75}
        loading={props.loading || "lazy"}
        placeholder={props.placeholder || "blur"}
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJiEkMj44Li4wMTQ/RDBCPUM3Ri9JVFVZW1xbN0RjamRYalFZW1f/2wBDARUXFyAeIBogHh4gIiA/NCs0Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      />
    </picture>
  );
}
