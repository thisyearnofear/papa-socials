import React, { useState, useEffect } from "react";
import Image from "next/image";

interface FilePreviewProps {
  url: string;
  fileName?: string;
  fileType?: string;
  onError?: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  url,
  fileName,
  fileType,
  onError,
}) => {
  const [error, setError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [detectedType, setDetectedType] = useState<string | null>(null);

  // Check if the URL exists and possibly detect content type
  useEffect(() => {
    if (!url) {
      setError(true);
      setIsLoading(false);
      if (onError) onError();
      return;
    }

    // Try to verify the resource exists before displaying
    const checkUrl = async () => {
      try {
        // Only perform HEAD request if URL is external
        if (url.startsWith("http")) {
          const proxyUrl = `/api/storage/proxy-head?url=${encodeURIComponent(
            url
          )}`;
          const response = await fetch(proxyUrl);
          const data = await response.json();

          if (data.exists && data.contentType) {
            setDetectedType(data.contentType);
          }
        }
      } catch (err) {
        console.error("Error checking content:", err);
        // Continue anyway - will fall back to fileType or extension-based detection
      } finally {
        // Always end loading state, even if there was an error
        setIsLoading(false);
      }
    };

    // Set a timeout to ensure loading state doesn't get stuck
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Forcing loading state to end after timeout");
        setIsLoading(false);
      }
    }, 5000); // 5 second timeout as fallback

    checkUrl();

    // Clean up timeout
    return () => clearTimeout(timeoutId);
  }, [url, onError]);

  // Smart type detection that uses multiple sources of information
  const getEffectiveType = (): string => {
    // Use detected type if available
    if (detectedType) return detectedType;

    // Otherwise use provided fileType
    if (fileType) return fileType;

    // Finally try to detect from extension
    if (fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase();
      if (ext) {
        const extensionMap: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
          svg: "image/svg+xml",
          mp4: "video/mp4",
          webm: "video/webm",
          mp3: "audio/mpeg",
          wav: "audio/wav",
          pdf: "application/pdf",
          txt: "text/plain",
          md: "text/markdown",
          html: "text/html",
          json: "application/json",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xls: "application/vnd.ms-excel",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ppt: "application/vnd.ms-powerpoint",
          pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        };

        if (extensionMap[ext]) return extensionMap[ext];
      }
    }

    // Last resort - return generic binary type
    return "application/octet-stream";
  };

  const effectiveType = getEffectiveType();

  // Simplified type detection that also handles generic content types
  const isImage =
    effectiveType.startsWith("image/") || effectiveType === "image";
  const isVideo =
    effectiveType.startsWith("video/") || effectiveType === "video";
  const isAudio =
    effectiveType.startsWith("audio/") || effectiveType === "audio";
  const isPdf = effectiveType === "application/pdf" || effectiveType === "pdf";
  const isText =
    effectiveType.startsWith("text/") ||
    effectiveType === "text" ||
    fileName?.endsWith(".txt") ||
    fileName?.endsWith(".md");

  // Handle loading errors
  const handleError = () => {
    setError(true);
    setIsLoading(false);
    if (onError) onError();
  };

  // If we're still loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="file-preview-loading">
        <div className="loading-spinner"></div>
        <p>Loading content...</p>
      </div>
    );
  }

  // If we've encountered an error, show the fallback view
  if (error) {
    return (
      <div className="file-preview-fallback">
        <div className="file-icon">📄</div>
        <p className="file-name">{fileName || "File"}</p>
        <p className="file-type">({effectiveType || "Unknown type"})</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="file-link"
        >
          View on IPFS
        </a>
      </div>
    );
  }

  // Image preview
  if (isImage) {
    return (
      <div className="file-preview-image">
        <Image
          src={url}
          alt={fileName || "Image preview"}
          width={500}
          height={400}
          style={{
            objectFit: "contain",
            maxHeight: "60vh",
            width: "auto",
            height: "auto",
          }}
          onError={handleError}
          priority
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-original-link"
        >
          View Original
        </a>
      </div>
    );
  }

  // Video preview
  if (isVideo) {
    return (
      <div className="file-preview-video">
        <video controls src={url} onError={handleError} playsInline>
          Your browser does not support the video tag.
        </video>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-original-link"
        >
          Download Video
        </a>
      </div>
    );
  }

  // Audio preview
  if (isAudio) {
    return (
      <div className="file-preview-audio">
        <div className="audio-icon">🎵</div>
        <audio controls src={url} onError={handleError}>
          Your browser does not support the audio tag.
        </audio>
        <p className="audio-title">{fileName || "Audio file"}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-original-link"
        >
          Download Audio
        </a>
      </div>
    );
  }

  // PDF preview
  if (isPdf) {
    return (
      <div className="file-preview-pdf">
        <iframe
          src={url}
          title={fileName || "PDF Document"}
          onError={handleError}
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-original-link"
        >
          View PDF
        </a>
      </div>
    );
  }

  // Text preview (for plain text, markdown, etc.)
  if (isText) {
    return (
      <div className="file-preview-text">
        <iframe
          src={url}
          title={fileName || "Text Document"}
          onError={handleError}
        />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="view-original-link"
        >
          View Text File
        </a>
      </div>
    );
  }

  // Default file icon for other types
  return (
    <div className="file-preview-default">
      <div className="file-icon">
        {fileName?.endsWith(".zip") || fileName?.endsWith(".rar")
          ? "🗜️"
          : fileName?.endsWith(".doc") || fileName?.endsWith(".docx")
          ? "📝"
          : fileName?.endsWith(".xls") || fileName?.endsWith(".xlsx")
          ? "📊"
          : fileName?.endsWith(".ppt") || fileName?.endsWith(".pptx")
          ? "📑"
          : "📄"}
      </div>
      <p className="file-name">{fileName || "File"}</p>
      <p className="file-type">({effectiveType || "Unknown type"})</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="file-link"
      >
        View on IPFS
      </a>
    </div>
  );
};
