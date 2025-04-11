import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useFilecoin,
  FilecoinAsset,
  AssetMetadata as ContextAssetMetadata,
} from "../contexts/filecoin-context";
import { OptimizedImage } from "./OptimizedImage";

// Type definitions
interface Asset {
  cid: string;
  size?: number;
  metadata: AssetMetadata;
}

interface AssetMetadata {
  title: string;
  description: string;
  creator: string;
  date: string;
  tags: string[];
  type: "image" | "audio" | "video" | "document";
}

interface UploadStatus {
  status: "uploading" | "success" | "error";
  message: string;
}

interface ArchiveContentProps {
  onBackClick: () => void;
}

// Adapter function to convert FilecoinAsset to Asset
const convertToAsset = (fileAsset: FilecoinAsset): Asset => {
  return {
    cid: fileAsset.cid,
    size: fileAsset.size,
    metadata: {
      title: fileAsset.metadata.title || fileAsset.name || "Untitled",
      description: fileAsset.metadata.description || "",
      creator: fileAsset.metadata.creator || "",
      date:
        fileAsset.metadata.date ||
        fileAsset.uploadedAt ||
        new Date().toISOString(),
      tags: fileAsset.metadata.tags || [],
      type: (fileAsset.metadata.type ||
        fileAsset.type ||
        "document") as AssetMetadata["type"],
    },
  };
};

// Convert AssetMetadata to ContextAssetMetadata
const convertToContextMetadata = (
  metadata: AssetMetadata
): ContextAssetMetadata => {
  return {
    ...metadata,
    // Include any additional fields needed by the context
  };
};

const ArchiveContent: React.FC<ArchiveContentProps> = ({ onBackClick }) => {
  // State management
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [assetMetadata, setAssetMetadata] = useState<AssetMetadata>({
    title: "",
    description: "",
    creator: "",
    date: new Date().toISOString().split("T")[0],
    tags: [],
    type: "image",
  });
  const [activeTab, setActiveTab] = useState<string>("browse");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);

  // Initialize Archive hook
  const { storedAssets, isLoading, uploadFiles, error } = useFilecoin();

  // Derived state - convert FilecoinAssets to Assets
  const assets = storedAssets.map(convertToAsset);
  const loading = isLoading;

  // Adapter function for uploadAsset
  const uploadAsset = async (files: File[], metadata: AssetMetadata) => {
    return await uploadFiles(files, convertToContextMetadata(metadata));
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);

      // Auto-detect file type based on first file
      const file = e.target.files[0];
      let detectedType: AssetMetadata["type"] = "document";

      if (file.type.startsWith("image/")) {
        detectedType = "image";
      } else if (file.type.startsWith("audio/")) {
        detectedType = "audio";
      } else if (file.type.startsWith("video/")) {
        detectedType = "video";
      }

      setAssetMetadata((prev) => ({ ...prev, type: detectedType }));
    }
  };

  // Handle metadata changes
  const handleMetadataChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setAssetMetadata((prev) => ({ ...prev, [name]: value }));
  };

  // Handle tags input
  const handleTagsSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagsInputRef.current) {
      e.preventDefault();
      const tag = tagsInputRef.current.value.trim();

      if (tag && !assetMetadata.tags.includes(tag)) {
        setAssetMetadata((prev) => ({
          ...prev,
          tags: [...prev.tags, tag],
        }));
        tagsInputRef.current.value = "";
      }
    }
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setAssetMetadata((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle file upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFiles || selectedFiles.length === 0) {
      setUploadStatus({
        message: "Please select files to upload",
        status: "error",
      });
      return;
    }

    setUploadStatus({
      message: "Uploading to archive...",
      status: "uploading",
    });

    try {
      const fileArray = Array.from(selectedFiles);
      await uploadAsset(fileArray, assetMetadata);

      setUploadStatus({
        message: "Files uploaded successfully to archive!",
        status: "success",
      });

      // Reset form
      setSelectedFiles(null);
      setAssetMetadata({
        title: "",
        description: "",
        creator: "",
        date: new Date().toISOString().split("T")[0],
        tags: [],
        type: "image",
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setUploadStatus({
        message: `Error uploading files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        status: "error",
      });
    }
  };

  // Handle asset click (for viewing details)
  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedAsset(null);
  };

  // Render asset preview in grid
  const renderAssetPreview = (asset: Asset) => {
    switch (asset.metadata.type) {
      case "image":
        return (
          <div className="archive-asset-preview">
            <OptimizedImage
              src={`https://w3s.link/ipfs/${asset.cid}`}
              alt={asset.metadata.title || "Image asset"}
              width={250}
              height={180}
              style={{ objectFit: "cover", height: "100%", width: "100%" }}
              contentType="image"
            />
          </div>
        );
      case "audio":
        return (
          <div className="archive-asset-preview">
            <div className="archive-asset-icon">
              <OptimizedImage
                src="/images/audio-icon.svg"
                alt="Audio file"
                width={80}
                height={80}
                contentType="audio"
              />
            </div>
          </div>
        );
      case "video":
        return (
          <div className="archive-asset-preview">
            <div className="archive-asset-icon">
              <OptimizedImage
                src="/images/video-icon.svg"
                alt="Video file"
                width={80}
                height={80}
                contentType="video"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="archive-asset-preview">
            <div className="archive-asset-icon">
              <OptimizedImage
                src="/images/document-icon.svg"
                alt="Document file"
                width={80}
                height={80}
                contentType="document"
              />
            </div>
          </div>
        );
    }
  };

  // Render asset details in modal
  const renderAssetDetails = (asset: Asset) => {
    switch (asset.metadata.type) {
      case "image":
        return (
          <div className="filecoin-modal-preview">
            <OptimizedImage
              src={`https://w3s.link/ipfs/${asset.cid}`}
              alt={asset.metadata.title || "Image asset"}
              width={400}
              height={300}
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                borderRadius: "8px",
              }}
              contentType="image"
            />
          </div>
        );
      case "audio":
        return (
          <div className="filecoin-modal-preview">
            <div className="audio-player-wrapper">
              <audio
                controls
                src={`https://w3s.link/ipfs/${asset.cid}`}
                onError={(e) => {
                  console.log(
                    "Audio failed to load, trying alternative gateway"
                  );
                  const audio = e.currentTarget;
                  if (audio.src.includes("w3s.link")) {
                    audio.src = `https://ipfs.io/ipfs/${asset.cid}`;
                  } else if (audio.src.includes("ipfs.io")) {
                    audio.src = `https://dweb.link/ipfs/${asset.cid}`;
                  }
                }}
              >
                Your browser does not support the audio element.
              </audio>
              <div className="audio-fallback">
                <OptimizedImage
                  src="/images/audio-icon.svg"
                  alt="Audio file"
                  width={80}
                  height={80}
                  contentType="audio"
                />
                <a
                  href={`https://w3s.link/ipfs/${asset.cid}`}
                  className="filecoin-download-button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Audio
                </a>
              </div>
            </div>
          </div>
        );
      case "video":
        return (
          <div className="filecoin-modal-preview">
            <div className="video-player-wrapper">
              <video
                controls
                width="100%"
                src={`https://w3s.link/ipfs/${asset.cid}`}
                onError={(e) => {
                  console.log(
                    "Video failed to load, trying alternative gateway"
                  );
                  const video = e.currentTarget;
                  if (video.src.includes("w3s.link")) {
                    video.src = `https://ipfs.io/ipfs/${asset.cid}`;
                  } else if (video.src.includes("ipfs.io")) {
                    video.src = `https://dweb.link/ipfs/${asset.cid}`;
                  }
                }}
              >
                Your browser does not support the video element.
              </video>
              <div className="video-fallback">
                <OptimizedImage
                  src="/images/video-icon.svg"
                  alt="Video file"
                  width={80}
                  height={80}
                  contentType="video"
                />
                <a
                  href={`https://w3s.link/ipfs/${asset.cid}`}
                  className="filecoin-download-button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Video
                </a>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="filecoin-modal-preview">
            <div className="filecoin-file-preview">
              <OptimizedImage
                src="/images/document-icon.svg"
                alt="Document file"
                width={80}
                height={80}
                contentType="document"
              />
              <a
                href={`https://w3s.link/ipfs/${asset.cid}`}
                className="filecoin-download-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download File
              </a>
            </div>
          </div>
        );
    }
  };

  // Return with mobile optimizations
  return (
    <div className="archive-container">
      {/* Header with back button */}
      <div className="archive-header">
        <h1 className="archive-title">Artist Catalogue</h1>
        <button className="archive-back-button" onClick={onBackClick}>
          Back
        </button>
      </div>

      {/* Tabs Navigation - Mobile-optimized */}
      <div className="archive-tabs">
        <button
          className={`archive-tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          Browse
        </button>
        <button
          className={`archive-tab ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload
        </button>
      </div>

      {/* Status Messages */}
      {uploadStatus && (
        <div className={`archive-message ${uploadStatus.status}`}>
          {uploadStatus.status === "uploading" && (
            <div className="loading-spinner"></div>
          )}
          {uploadStatus.message}
        </div>
      )}

      {error && (
        <div className="filecoin-message error">
          <p>
            <strong>Connection Issue:</strong> {error}
          </p>
          <p className="error-hint">
            Do not worry - you can still browse content and interact with the
            catalogue. New uploads will be stored locally.
          </p>
        </div>
      )}

      {/* Content Area - Responsive mobile design */}
      <div className="archive-content">
        {/* Browse Assets */}
        {activeTab === "browse" && (
          <motion.div
            className="archive-browse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="section-title">Artist Catalogue</h2>

            {loading ? (
              <div className="filecoin-loading-grid">
                {/* Skeleton loaders instead of spinner */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="filecoin-skeleton-card">
                    <div className="filecoin-skeleton-image"></div>
                    <div className="filecoin-skeleton-content">
                      <div className="filecoin-skeleton-title"></div>
                      <div className="filecoin-skeleton-text"></div>
                    </div>
                  </div>
                ))}
                <div className="filecoin-loading-message">
                  Loading catalogue items...
                </div>
              </div>
            ) : assets && assets.length > 0 ? (
              <div className="filecoin-assets-grid">
                {assets.map((asset: Asset, index: number) => (
                  <motion.div
                    key={asset.cid}
                    className="filecoin-asset-card"
                    onClick={() => handleAssetClick(asset)}
                    whileHover={{
                      y: -5,
                      boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05, duration: 0.3 },
                    }}
                  >
                    {renderAssetPreview(asset)}
                    <div className="filecoin-asset-info">
                      <h3>{asset.metadata.title || "Untitled"}</h3>
                      <p className="filecoin-asset-type">
                        {asset.metadata.type}
                      </p>
                      <p className="filecoin-asset-date">
                        {new Date(asset.metadata.date).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="filecoin-empty">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="empty-icon">📦</div>
                  <p>No items found in the catalogue.</p>
                  <p>Add some items to get started.</p>
                  <button
                    className="filecoin-action-button"
                    onClick={() => setActiveTab("upload")}
                  >
                    Add New Content
                  </button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* Upload Assets - Simplified for user flow */}
        {activeTab === "upload" && (
          <motion.div
            className="archive-upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="section-title">Add to Catalogue</h2>

            <div className="upload-intro">
              <p>
                Share your content with PAPA&apos;s fans by adding it to the
                catalogue. Your content will be preserved on the decentralized
                web for future generations.
              </p>
            </div>

            <form onSubmit={handleUpload} className="archive-upload-form">
              <div className="archive-form-group">
                <label className="archive-form-label">Files</label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="archive-form-input"
                />
              </div>

              <div className="archive-form-group">
                <label className="archive-form-label">Title</label>
                <input
                  type="text"
                  name="title"
                  value={assetMetadata.title}
                  onChange={handleMetadataChange}
                  className="archive-form-input"
                />
              </div>

              <div className="archive-form-group">
                <label className="archive-form-label">Description</label>
                <textarea
                  name="description"
                  value={assetMetadata.description}
                  onChange={handleMetadataChange}
                  className="archive-form-input"
                  rows={3}
                />
              </div>

              <div className="archive-form-group">
                <label className="archive-form-label">Creator</label>
                <input
                  type="text"
                  name="creator"
                  value={assetMetadata.creator}
                  onChange={handleMetadataChange}
                  className="archive-form-input"
                />
              </div>

              <div className="archive-form-group">
                <label className="archive-form-label">Date</label>
                <input
                  type="date"
                  name="date"
                  value={assetMetadata.date}
                  onChange={handleMetadataChange}
                  className="archive-form-input"
                />
              </div>

              <div className="archive-form-group">
                <label className="archive-form-label">Tags</label>
                <input
                  type="text"
                  ref={tagsInputRef}
                  onKeyDown={handleTagsSubmit}
                  placeholder="Type a tag and press Enter"
                  className="archive-form-input"
                />
                <div className="archive-tags-container">
                  {assetMetadata.tags.map((tag) => (
                    <div key={tag} className="archive-tag">
                      {tag}
                      <button
                        type="button"
                        className="archive-tag-remove"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="archive-upload-button"
                disabled={
                  uploadStatus?.status === "uploading" ||
                  !selectedFiles ||
                  selectedFiles.length === 0
                }
              >
                {uploadStatus?.status === "uploading" ? (
                  <>
                    <span className="button-spinner"></span>
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </button>

              {uploadStatus && (
                <div className={`archive-message ${uploadStatus.status}`}>
                  {uploadStatus.message}
                </div>
              )}
            </form>
          </motion.div>
        )}
      </div>

      {/* Asset Details Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            className="archive-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="archive-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="archive-modal-header">
                <h2 className="archive-modal-title">
                  {selectedAsset.metadata.title}
                </h2>
                <button
                  className="archive-modal-close"
                  onClick={handleCloseModal}
                >
                  ×
                </button>
              </div>
              {renderAssetDetails(selectedAsset)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .archive-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .archive-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .archive-title {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }

        .archive-back-button {
          padding: 8px 16px;
          background: #333;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .archive-back-button:hover {
          background: #444;
        }

        .archive-tabs {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .archive-tab {
          padding: 8px 16px;
          background: #f5f5f5;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .archive-tab.active {
          background: #333;
          color: white;
        }

        .archive-tab:hover {
          background: #e0e0e0;
        }

        .archive-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .archive-browse,
        .archive-upload {
          flex: 1;
        }

        .section-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .upload-intro {
          margin-bottom: 20px;
        }

        .archive-upload-form {
          margin-top: 20px;
          padding: 20px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .archive-form-group {
          margin-bottom: 15px;
        }

        .archive-form-label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .archive-form-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .archive-tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: 5px;
        }

        .archive-tag {
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .archive-tag-remove {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
        }

        .archive-upload-button {
          background: #333;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }

        .archive-upload-button:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .archive-message {
          margin-top: 10px;
          padding: 10px;
          border-radius: 4px;
        }

        .archive-message.success {
          background: #d4edda;
          color: #155724;
        }

        .archive-message.error {
          background: #f8d7da;
          color: #721c24;
        }

        .archive-message.uploading {
          background: #cce5ff;
          color: #004085;
        }

        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #333;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }

        .button-spinner {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-left-color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Mobile optimizations - see filecoin.css for full styles */

        /* Skeleton loaders for content */
        .filecoin-loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
          position: relative;
        }

        .filecoin-skeleton-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
          height: 280px;
          display: flex;
          flex-direction: column;
        }

        .filecoin-skeleton-image {
          height: 180px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .filecoin-skeleton-content {
          padding: 1rem;
        }

        .filecoin-skeleton-title {
          width: 80%;
          height: 18px;
          margin-bottom: 15px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }

        .filecoin-skeleton-text {
          width: 60%;
          height: 12px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.03) 0%,
            rgba(255, 255, 255, 0.08) 50%,
            rgba(255, 255, 255, 0.03) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }

        /* Audio and Video player wrappers */
        .audio-player-wrapper,
        .video-player-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .audio-fallback,
        .video-fallback {
          display: none;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          border: 1px dashed rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          margin-top: 10px;
        }

        audio:error + .audio-fallback,
        video:error + .video-fallback {
          display: flex;
        }

        .filecoin-download-button {
          margin-top: 15px;
          display: inline-block;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-radius: 20px;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .filecoin-download-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .error-hint {
          font-size: 0.9rem;
          opacity: 0.8;
          margin-top: 5px;
        }

        @media (max-width: 768px) {
          .filecoin-loading-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
          }

          .filecoin-skeleton-card {
            height: 220px;
          }

          .filecoin-skeleton-image {
            height: 150px;
          }
        }
      `}</style>
    </div>
  );
};

export default ArchiveContent;
