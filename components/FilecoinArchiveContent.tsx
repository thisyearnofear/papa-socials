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

interface VerificationResults {
  assetId: string;
  cid: string;
  status: "pending" | "verified" | "failed";
  dateVerified?: string;
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

const FilecoinArchiveContent: React.FC = () => {
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
  const [verificationResults, setVerificationResults] = useState<
    VerificationResults[] | null
  >(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);

  // Initialize Filecoin hook
  const { storedAssets, isLoading, uploadFiles, verifyAsset, error } =
    useFilecoin();

  // Derived state - convert FilecoinAssets to Assets
  const assets = storedAssets.map(convertToAsset);
  const loading = isLoading;

  // Adapter function for uploadAsset
  const uploadAsset = async (files: File[], metadata: AssetMetadata) => {
    return await uploadFiles(files, convertToContextMetadata(metadata));
  };

  // Adapter function for verifyAssets
  const verifyAssets = async () => {
    // Verify each asset and collect results
    const results: VerificationResults[] = [];

    for (const asset of storedAssets) {
      const verified = await verifyAsset(asset);
      results.push({
        assetId: asset.id.toString(),
        cid: asset.cid,
        status: verified ? "verified" : "failed",
        dateVerified: new Date().toISOString(),
      });
    }

    return results;
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

  // Handle asset verification
  const handleVerify = async () => {
    setVerificationResults(null);
    setUploadStatus({
      message: "Verifying assets on the Filecoin network...",
      status: "loading",
    });

    try {
      const results = await verifyAssets();
      setVerificationResults(results);
      setUploadStatus({
        message: "Verification complete",
        status: "success",
      });
    } catch (err) {
      setUploadStatus({
        message: `Error verifying assets: ${
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
            />
          </div>
        );
      case "audio":
        return (
          <div className="filecoin-modal-preview">
            <audio controls src={`https://w3s.link/ipfs/${asset.cid}`}>
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      case "video":
        return (
          <div className="filecoin-modal-preview">
            <video
              controls
              width="100%"
              src={`https://w3s.link/ipfs/${asset.cid}`}
            >
              Your browser does not support the video element.
            </video>
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

  return (
    <div className="content-wrapper">
      {/* Tabs Navigation */}
      <div className="filecoin-tabs">
        <button
          className={`filecoin-tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          Browse Archive
        </button>
        <button
          className={`filecoin-tab ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload Assets
        </button>
        <button
          className={`filecoin-tab ${activeTab === "verify" ? "active" : ""}`}
          onClick={() => setActiveTab("verify")}
        >
          Verify Storage
        </button>
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

      {error && <div className="filecoin-message error">Error: {error}</div>}

      {/* Content Area */}
      <div className="filecoin-content">
        {/* Browse Assets */}
        {activeTab === "browse" && (
          <motion.div
            className="filecoin-browse"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="section-title">Artist Archive</h2>

            {loading ? (
              <div className="filecoin-loading">
                <div className="loading-spinner"></div>
                Loading assets from Filecoin...
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.05 },
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
                No assets found in the archive. Upload some assets to get
                started.
              </div>
            )}
          </motion.div>
        )}

        {/* Upload Assets */}
        {activeTab === "upload" && (
          <motion.div
            className="filecoin-upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="section-title">Upload to Archive</h2>

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
                <label htmlFor="asset-type">Asset Type</label>
                <select
                  id="asset-type"
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
                <label htmlFor="asset-title">Title</label>
                <input
                  type="text"
                  id="asset-title"
                  name="title"
                  className="filecoin-text-input"
                  value={assetMetadata.title}
                  onChange={handleMetadataChange}
                  placeholder="Enter asset title"
                  required
                />
              </div>

              <div className="filecoin-form-group">
                <label htmlFor="asset-description">Description</label>
                <textarea
                  id="asset-description"
                  name="description"
                  className="filecoin-textarea"
                  value={assetMetadata.description}
                  onChange={handleMetadataChange}
                  placeholder="Enter asset description"
                />
              </div>

              <div className="filecoin-form-group">
                <label htmlFor="asset-creator">Creator</label>
                <input
                  type="text"
                  id="asset-creator"
                  name="creator"
                  className="filecoin-text-input"
                  value={assetMetadata.creator}
                  onChange={handleMetadataChange}
                  placeholder="Enter creator name"
                />
              </div>

              <div className="filecoin-form-group">
                <label htmlFor="asset-date">Creation Date</label>
                <input
                  type="date"
                  id="asset-date"
                  name="date"
                  className="filecoin-text-input"
                  value={assetMetadata.date}
                  onChange={handleMetadataChange}
                />
              </div>

              <div className="filecoin-form-group">
                <label htmlFor="asset-tags">Tags (press Enter to add)</label>
                <input
                  type="text"
                  id="asset-tags"
                  className="filecoin-text-input"
                  ref={tagsInputRef}
                  onKeyDown={handleTagsSubmit}
                  placeholder="Add tags and press Enter"
                />

                {assetMetadata.tags.length > 0 && (
                  <div className="filecoin-tags">
                    {assetMetadata.tags.map((tag) => (
                      <span key={tag} className="filecoin-tag">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#00a4ff",
                            cursor: "pointer",
                            marginLeft: "4px",
                            fontSize: "12px",
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="filecoin-upload-button"
                disabled={
                  !selectedFiles ||
                  selectedFiles.length === 0 ||
                  uploadStatus?.status === "loading"
                }
              >
                {uploadStatus?.status === "loading"
                  ? "Uploading..."
                  : "Upload to Filecoin"}
              </button>
            </form>
          </motion.div>
        )}

        {/* Verify Assets */}
        {activeTab === "verify" && (
          <motion.div
            className="filecoin-verify"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="section-title">Verify Storage Status</h2>

            <p>
              Verify the storage status of your assets on the Filecoin network
              to ensure they are being properly stored and maintained.
            </p>

            <button
              className="filecoin-verify-button"
              onClick={handleVerify}
              disabled={uploadStatus?.status === "loading"}
            >
              {uploadStatus?.status === "loading"
                ? "Verifying..."
                : "Check Storage Status"}
            </button>

            {verificationResults && (
              <div className="filecoin-verification-results">
                <h3>Verification Results</h3>

                <div className="filecoin-table-wrapper">
                  <table className="filecoin-table">
                    <thead>
                      <tr>
                        <th>Asset</th>
                        <th>CID</th>
                        <th>Status</th>
                        <th>Date Verified</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verificationResults.map((result) => (
                        <tr key={result.assetId}>
                          <td>
                            {assets.find((a) => a.cid === result.cid)?.metadata
                              .title || "Unknown"}
                          </td>
                          <td className="filecoin-cid">
                            {result.cid.substring(0, 10)}...
                          </td>
                          <td>
                            <span className={`status-${result.status}`}>
                              {result.status.charAt(0).toUpperCase() +
                                result.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            {result.dateVerified
                              ? new Date(
                                  result.dateVerified
                                ).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            <a
                              href={`https://w3s.link/ipfs/${result.cid}`}
                              className="filecoin-view-link"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
          >
            <motion.div
              className="filecoin-modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="filecoin-modal-close"
                onClick={handleCloseModal}
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

                  <div className="filecoin-detail-item">
                    <h4>Storage Details</h4>
                    <p>
                      Content ID (CID):{" "}
                      <span className="filecoin-cid">{selectedAsset.cid}</span>
                    </p>
                    <p>
                      Size:{" "}
                      {selectedAsset.size
                        ? `${(selectedAsset.size / 1024 / 1024).toFixed(2)} MB`
                        : "Unknown"}
                    </p>
                    <a
                      href={`https://w3s.link/ipfs/${selectedAsset.cid}`}
                      className="filecoin-ipfs-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on IPFS Gateway
                    </a>
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
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilecoinArchiveContent;
