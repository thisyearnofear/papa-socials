import Image, { ImageProps } from "next/image";
import { useState, useEffect, useCallback } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  asBackground?: boolean;
  style?: React.CSSProperties;
  contentType?: "image" | "audio" | "video" | "document";
}

// Alternative gateways for IPFS content
const IPFS_GATEWAYS = [
  "https://w3s.link/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
];

export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  asBackground = false,
  priority = false,
  quality = 75,
  loading,
  style = {},
  contentType = "image",
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [gatewayAttempt, setGatewayAttempt] = useState(0);

  // Extract CID from IPFS URL if present
  const extractCid = useCallback((url: string): string | null => {
    const match = url.match(/ipfs\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }, []);

  // Try loading from different gateways
  const tryNextGateway = useCallback(
    (originalUrl: string) => {
      const cid = extractCid(originalUrl);
      if (!cid) return null;

      const nextAttempt = gatewayAttempt + 1;
      if (nextAttempt >= IPFS_GATEWAYS.length) return null;

      setGatewayAttempt(nextAttempt);
      return `${IPFS_GATEWAYS[nextAttempt]}${cid}`;
    },
    [extractCid, gatewayAttempt]
  );

  // Set default fallbacks by content type
  const getDefaultFallback = useCallback(() => {
    switch (contentType) {
      case "audio":
        return "/images/audio-icon.svg";
      case "video":
        return "/images/video-icon.svg";
      case "document":
        return "/images/document-icon.svg";
      default:
        return "/img/placeholder-image.svg"; // Default image fallback
    }
  }, [contentType]);

  // Handle w3s.link IPFS URLs with a timeout
  useEffect(() => {
    setImgSrc(src);
    setIsLoaded(false);
    setLoadFailed(false);
    setGatewayAttempt(0);

    // If this is an IPFS URL, set a timeout to handle potential gateway issues
    if (src && src.includes("/ipfs/")) {
      const timeoutId = setTimeout(() => {
        if (!isLoaded) {
          console.log(`Load timeout for ${src}, attempting fallback`);
          // Try next gateway
          const nextGateway = tryNextGateway(src);
          if (nextGateway) {
            console.log(`Trying alternative gateway: ${nextGateway}`);
            setImgSrc(nextGateway);
          } else {
            setLoadFailed(true);
            // Use fallback or default
            if (fallbackSrc) {
              setImgSrc(fallbackSrc);
            } else {
              setImgSrc(getDefaultFallback());
            }
          }
        }
      }, 5000); // 5 second timeout for IPFS gateway responses

      return () => clearTimeout(timeoutId);
    }
  }, [
    src,
    gatewayAttempt,
    fallbackSrc,
    getDefaultFallback,
    isLoaded,
    tryNextGateway,
  ]);

  // Handle error with the current gateway
  const handleImageError = useCallback(() => {
    console.log(`Error loading image from ${imgSrc}`);
    // Try next gateway first
    const nextGateway = tryNextGateway(src);
    if (nextGateway && gatewayAttempt < IPFS_GATEWAYS.length - 1) {
      console.log(`Trying alternative gateway: ${nextGateway}`);
      setImgSrc(nextGateway);
    } else {
      // All gateways failed, use fallback
      setLoadFailed(true);
      if (fallbackSrc) {
        setImgSrc(fallbackSrc);
      } else {
        setImgSrc(getDefaultFallback());
      }
    }
  }, [
    gatewayAttempt,
    getDefaultFallback,
    imgSrc,
    fallbackSrc,
    src,
    tryNextGateway,
  ]);

  // Determine loading behavior - priority takes precedence over lazy loading
  const loadingBehavior = priority ? undefined : loading || "lazy";

  if (asBackground) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          ...style,
        }}
      >
        <Image
          {...props}
          src={loadFailed ? fallbackSrc || getDefaultFallback() : imgSrc}
          alt={alt}
          fill
          priority={priority}
          loading={loadingBehavior}
          onLoad={() => setIsLoaded(true)}
          onError={handleImageError}
          style={{
            objectFit: "cover",
            opacity: isLoaded ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
            ...style,
          }}
          sizes={
            props.sizes ||
            "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          }
          quality={quality}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJiEkMj44Li4wMTQ/RDBCPUM3Ri9JVFVZW1xbN0RjamRYalFZW1f/2wBDARUXFyAeIBogHh4gIiA/NCs0Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
      </div>
    );
  }

  return (
    <Image
      {...props}
      src={loadFailed ? fallbackSrc || getDefaultFallback() : imgSrc}
      alt={alt}
      priority={priority}
      loading={loadingBehavior}
      onLoad={() => setIsLoaded(true)}
      onError={handleImageError}
      style={{
        opacity: isLoaded ? 1 : 0,
        transition: "opacity 0.3s ease-in-out",
        ...style,
      }}
      sizes={
        props.sizes ||
        "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      }
      quality={quality}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJiEkMj44Li4wMTQ/RDBCPUM3Ri9JVFVZW1xbN0RjamRYalFZW1f/2wBDARUXFyAeIBogHh4gIiA/NCs0Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz//wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  );
}
