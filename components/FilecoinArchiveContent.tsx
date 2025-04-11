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
  type: string;
}

interface UploadStatus {
  message: string;
  status: "success" | "error" | "loading";
}

interface FilecoinArchiveContentProps {
  onBackClick?: () => void;
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
      type: fileAsset.metadata.type || fileAsset.type || "document",
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

const FilecoinArchiveContent: React.FC<FilecoinArchiveContentProps> = ({
  onBackClick,
}) => {
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

  // Initialize Filecoin hook
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
      let detectedType = "document";

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
      message: "Uploading to Filecoin network...",
      status: "loading",
    });

    try {
      const fileArray = Array.from(selectedFiles);
      await uploadAsset(fileArray, assetMetadata);

      setUploadStatus({
        message: "Files uploaded successfully to Filecoin network!",
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
          <div className="filecoin-asset-preview">
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
          <div className="filecoin-asset-preview">
            <div className="filecoin-asset-icon">
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
          <div className="filecoin-asset-preview">
            <div className="filecoin-asset-icon">
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
          <div className="filecoin-asset-preview">
            <div className="filecoin-asset-icon">
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
    <div className="content-wrapper">
      {/* Tabs Navigation - Mobile-optimized */}
      <div className="filecoin-tabs">
        <button
          className={`filecoin-tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
          aria-label="Browse Catalogue"
        >
          <span className="tab-text">Browse</span>
          <span className="tab-icon">🔍</span>
        </button>
        <button
          className={`filecoin-tab ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
          aria-label="Upload Assets"
        >
          <span className="tab-text">Upload</span>
          <span className="tab-icon">📤</span>
        </button>
        {onBackClick && (
          <button
            className="filecoin-tab"
            onClick={onBackClick}
            aria-label="Back to Grid"
          >
            <span className="tab-text">Back</span>
            <span className="tab-icon">↩️</span>
          </button>
        )}
      </div>

      {/* Status Messages */}
      {uploadStatus && (
        <div className={`filecoin-message ${uploadStatus.status}`}>
          {uploadStatus.status === "loading" && (
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
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <p className="error-hint">
            Do not worry - you can still browse content and interact with the
            catalogue. New uploads will be stored locally.
          </p>
        </div>
      )}

      {/* Content Area - Responsive mobile design */}
      <div className="filecoin-content">
        {/* Browse Assets */}
        {activeTab === "browse" && (
          <motion.div
            className="filecoin-browse"
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
            className="filecoin-upload"
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

            <form onSubmit={handleUpload} className="filecoin-upload-form">
              <div className="filecoin-form-group">
                <label htmlFor="file-upload">Select Files</label>
                <input
                  type="file"
                  id="file-upload"
                  className="filecoin-file-input"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  multiple
                />

                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="filecoin-selected-files">
                    <div>Selected {selectedFiles.length} file(s):</div>
                    <ul>
                      {Array.from(selectedFiles).map((file, index) => (
                        <li key={index}>
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)}{" "}
                          MB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="filecoin-form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  className="filecoin-text-input"
                  value={assetMetadata.title}
                  onChange={handleMetadataChange}
                  required
                  placeholder="Enter a title for this content"
                />
              </div>

              <div className="filecoin-form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  className="filecoin-textarea"
                  value={assetMetadata.description}
                  onChange={handleMetadataChange}
                  placeholder="What is special about this content?"
                />
              </div>

              <div className="filecoin-form-row">
                <div className="filecoin-form-group half">
                  <label htmlFor="creator">Creator</label>
                  <input
                    type="text"
                    id="creator"
                    name="creator"
                    className="filecoin-text-input"
                    value={assetMetadata.creator}
                    onChange={handleMetadataChange}
                    placeholder="Who created this?"
                  />
                </div>

                <div className="filecoin-form-group half">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="filecoin-text-input"
                    value={assetMetadata.date}
                    onChange={handleMetadataChange}
                  />
                </div>
              </div>

              <div className="filecoin-form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  name="type"
                  className="filecoin-select"
                  value={assetMetadata.type}
                  onChange={handleMetadataChange}
                >
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
              </div>

              <div className="filecoin-form-group">
                <label htmlFor="tags">Tags (Press Enter to add)</label>
                <input
                  type="text"
                  id="tags"
                  className="filecoin-text-input"
                  onKeyDown={handleTagsSubmit}
                  ref={tagsInputRef}
                  placeholder="lyrics, live, unreleased, etc."
                />

                {assetMetadata.tags.length > 0 && (
                  <div className="filecoin-tags-container">
                    {assetMetadata.tags.map((tag) => (
                      <span key={tag} className="filecoin-tag">
                        {tag}
                        <button
                          className="filecoin-tag-remove"
                          onClick={() => handleRemoveTag(tag)}
                          aria-label={`Remove tag ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="filecoin-form-actions">
                <button
                  type="button"
                  className="filecoin-cancel-button"
                  onClick={() => setActiveTab("browse")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="filecoin-upload-button"
                  disabled={
                    uploadStatus?.status === "loading" ||
                    !selectedFiles ||
                    selectedFiles.length === 0
                  }
                >
                  {uploadStatus?.status === "loading" ? (
                    <>
                      <span className="button-spinner"></span>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    "Add to Catalogue"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      {/* Asset Details Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            className="filecoin-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
            key="modal"
          >
            <motion.div
              className="filecoin-modal-content"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="filecoin-modal-close"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ×
              </button>

              <h2 className="filecoin-modal-title">
                {selectedAsset.metadata.title || "Untitled"}
              </h2>

              <div className="filecoin-modal-body">
                {renderAssetDetails(selectedAsset)}

                <div className="filecoin-modal-details">
                  {selectedAsset.metadata.description && (
                    <div className="filecoin-detail-item">
                      <h4>Description</h4>
                      <p>{selectedAsset.metadata.description}</p>
                    </div>
                  )}

                  {selectedAsset.metadata.creator && (
                    <div className="filecoin-detail-item">
                      <h4>Creator</h4>
                      <p>{selectedAsset.metadata.creator}</p>
                    </div>
                  )}

                  <div className="filecoin-detail-item">
                    <h4>Created</h4>
                    <p>
                      {new Date(
                        selectedAsset.metadata.date
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  {selectedAsset.metadata.tags &&
                    selectedAsset.metadata.tags.length > 0 && (
                      <div className="filecoin-detail-item">
                        <h4>Tags</h4>
                        <div className="filecoin-tags">
                          {selectedAsset.metadata.tags.map((tag: string) => (
                            <span key={tag} className="filecoin-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="filecoin-detail-item">
                    <div className="filecoin-detail-buttons">
                      <a
                        href={`https://w3s.link/ipfs/${selectedAsset.cid}`}
                        className="filecoin-ipfs-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>View Original</span>
                        <span>↗</span>
                      </a>
                      <button
                        className="filecoin-action-button"
                        onClick={handleCloseModal}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
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

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        .filecoin-loading-message {
          position: absolute;
          bottom: -40px;
          left: 0;
          right: 0;
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
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

export default FilecoinArchiveContent;
