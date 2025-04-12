import React from "react";
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
  const isImage = fileType?.startsWith("image/");
  const isVideo = fileType?.startsWith("video/");
  const isAudio = fileType?.startsWith("audio/");
  const isPdf = fileType === "application/pdf";

  if (isImage) {
    return (
      <div style={{ position: "relative", width: "100%", height: "200px" }}>
        <Image
          src={url}
          alt={fileName || "Image preview"}
          fill
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="mb-4 max-w-full">
        <video
          controls
          className="w-full max-h-[500px]"
          src={url}
          onError={onError}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="mb-4">
        <audio controls className="w-full" src={url} onError={onError}>
          Your browser does not support the audio tag.
        </audio>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="mb-4 h-[500px] w-full">
        <iframe
          src={url}
          className="w-full h-full border-0 rounded-lg"
          title={fileName || "PDF Document"}
        />
      </div>
    );
  }

  // Default file icon
  return (
    <div className="mb-4 p-4 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium mb-2">{fileName || "File"}</p>
        <p className="text-sm text-gray-500 mb-3">
          ({fileType || "Unknown type"})
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
          View in IPFS
        </a>
      </div>
    </div>
  );
};
