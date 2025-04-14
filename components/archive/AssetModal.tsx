import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Asset } from "./types";
import { FilePreview } from "./FilePreview";

interface AssetModalProps {
  asset: Asset;
  onClose: () => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({ asset, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [ipfsUrl, setIpfsUrl] = useState<string>("");
  const [loadError, setLoadError] = useState<boolean>(false);

  // Format gateway URLs for asset access
  useEffect(() => {
    // From the server logs we can see that alternativeUrl is available in the metadata
    if (asset.metadata?.alternativeUrl) {
      // If we have a pre-formatted URL in the metadata, prefer that
      setIpfsUrl(asset.metadata.alternativeUrl);
    } else {
      // Fallback to constructing our own URL
      const gatewayUrl = `https://w3s.link/ipfs/${asset.cid}`;
      const filenameComponent = asset.metadata?.title
        ? `/${encodeURIComponent(asset.metadata.title)}`
        : "";

      setIpfsUrl(gatewayUrl + filenameComponent);
    }

    // Add a backup timeout to ensure we don't get stuck in loading state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("AssetModal: Force ending loading state after timeout");
        setIsLoading(false);
      }
    }, 7000); // 7 second timeout as a safety net

    setIsLoading(false);

    return () => clearTimeout(timeoutId);
  }, [asset, isLoading]);

  // Format the date if available
  const formattedDate = asset.metadata?.date
    ? new Date(asset.metadata.date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown date";

  // Escape key handler
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // Extract filename or use default title
  const fileName =
    asset.metadata?.title ||
    (asset.metadata?.name
      ? `${asset.metadata.name.substring(0, 15)}...`
      : "Untitled");

  // Handle preview error
  const handlePreviewError = () => {
    setLoadError(true);
    setIsLoading(false);
    console.log("Error loading asset preview");
  };

  return (
    <AnimatePresence>
      <motion.div
        className="asset-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="asset-modal-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="asset-modal-close" onClick={onClose}>
            &times;
          </button>

          <div className="asset-modal-header">
            <h2 className="asset-modal-title">{fileName}</h2>
            {asset.metadata?.creator && (
              <p className="asset-modal-creator">by {asset.metadata.creator}</p>
            )}
          </div>

          <div className="asset-modal-body">
            <div className="asset-preview-container">
              {isLoading ? (
                <div className="asset-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading content...</p>
                </div>
              ) : (
                <FilePreview
                  url={ipfsUrl}
                  fileName={fileName}
                  fileType={asset.metadata?.type}
                  onError={handlePreviewError}
                />
              )}
              {loadError && (
                <div className="error-message">
                  Failed to load asset. Please try again later.
                </div>
              )}
            </div>

            <div className="asset-metadata-container">
              <div className="asset-metadata-section">
                <h3 className="metadata-section-title">Details</h3>

                <div className="metadata-item">
                  <span className="metadata-label">Type</span>
                  <span className="metadata-value">
                    {asset.metadata?.type || "Unknown"}
                  </span>
                </div>

                <div className="metadata-item">
                  <span className="metadata-label">Date</span>
                  <span className="metadata-value">{formattedDate}</span>
                </div>

                {asset.metadata?.description && (
                  <div className="metadata-item description">
                    <span className="metadata-label">Description</span>
                    <p className="metadata-description">
                      {asset.metadata.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="asset-metadata-section">
                <h3 className="metadata-section-title">Storage</h3>
                <div className="metadata-item">
                  <span className="metadata-label">CID</span>
                  <span className="metadata-value cid">{asset.cid}</span>
                </div>

                <div className="metadata-item">
                  <span className="metadata-label">Size</span>
                  <span className="metadata-value">
                    {asset.size ? formatFileSize(asset.size) : "Unknown size"}
                  </span>
                </div>

                <div className="metadata-item">
                  <span className="metadata-label">Added</span>
                  <span className="metadata-value">
                    {asset.added
                      ? new Date(asset.added).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
              </div>

              {asset.metadata?.tags && asset.metadata.tags.length > 0 && (
                <div className="asset-metadata-section">
                  <h3 className="metadata-section-title">Tags</h3>
                  <div className="asset-tags">
                    {asset.metadata.tags.map((tag, index) => (
                      <span key={index} className="asset-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="asset-actions">
                <a
                  href={ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="asset-action-button"
                >
                  Open in New Tab
                </a>
                <a
                  href={`https://explore.ipfs.tech/ipfs/${asset.cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="asset-action-button secondary"
                >
                  View on IPFS Explorer
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
