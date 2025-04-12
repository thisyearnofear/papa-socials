import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Asset, UploadStatus } from "./types";

interface AssetListProps {
  assets: Asset[];
  isLoadingAssets: boolean;
  selectedAssetCid: string | null;
  onAssetSelect: (cid: string) => void;
  onDeleteAsset: (cid: string) => Promise<void>;
  onLoadMoreAssets: () => Promise<void>;
  hasMoreAssets: boolean;
  uploadStatus: UploadStatus | null;
  renderAssetDetails: (asset: Asset) => React.ReactNode;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  isLoadingAssets,
  selectedAssetCid,
  onAssetSelect,
  onDeleteAsset,
  onLoadMoreAssets,
  hasMoreAssets,
  uploadStatus,
  renderAssetDetails,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleDelete = async (cid: string) => {
    if (confirmDelete === cid) {
      await onDeleteAsset(cid);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(cid);
    }
  };

  const getFileTypeIcon = (asset: Asset) => {
    const type = asset.metadata?.type?.toLowerCase() || "";

    if (type.includes("image")) return "🖼️";
    if (type.includes("video")) return "🎬";
    if (type.includes("audio")) return "🎵";
    if (type.includes("pdf")) return "📄";
    if (type.includes("text")) return "📝";
    if (type.includes("zip") || type.includes("compressed")) return "🗜️";
    return "📁";
  };

  const filteredAssets = assets.filter((asset) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      asset.metadata?.title?.toLowerCase().includes(term) ||
      asset.metadata?.description?.toLowerCase().includes(term) ||
      asset.metadata?.creator?.toLowerCase().includes(term) ||
      asset.cid.toLowerCase().includes(term) ||
      (asset.metadata?.tags &&
        asset.metadata.tags.some((tag) => tag.toLowerCase().includes(term)))
    );
  });

  const formatSize = (bytes?: number): string => {
    if (bytes === undefined) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="asset-browser">
      <div className="asset-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search assets..."
            className="asset-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            aria-label="Grid View"
          >
            📱
          </button>
          <button
            className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            aria-label="List View"
          >
            📋
          </button>
        </div>
      </div>

      {uploadStatus && (
        <div className={`archive-message ${uploadStatus.status}`}>
          {uploadStatus.message}
        </div>
      )}

      {isLoadingAssets && assets.length === 0 ? (
        <div className="loading-assets">
          <div className="loading-spinner"></div>
          <p>Loading assets...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="no-assets">
          {searchTerm ? (
            <p>No assets match your search. Try a different term.</p>
          ) : (
            <p>No assets found. Upload your first asset!</p>
          )}
        </div>
      ) : (
        <div className={`assets-container ${viewMode}`}>
          {filteredAssets.map((asset) => (
            <motion.div
              key={asset.cid}
              className={`asset-item ${
                selectedAssetCid === asset.cid ? "selected" : ""
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => onAssetSelect(asset.cid)}
            >
              <div className="asset-icon">{getFileTypeIcon(asset)}</div>
              <div className="asset-info">
                <h3 className="asset-title">
                  {asset.metadata?.title || "Untitled Asset"}
                </h3>
                <p className="asset-description">
                  {asset.metadata?.description?.substring(0, 100) ||
                    "No description"}
                  {(asset.metadata?.description?.length || 0) > 100 && "..."}
                </p>
                <div className="asset-meta">
                  <span className="asset-id">
                    CID: {asset.cid.substring(0, 8)}...
                  </span>
                  <span className="asset-size">{formatSize(asset.size)}</span>
                </div>
                {viewMode === "list" && asset.metadata?.tags && (
                  <div className="asset-tags">
                    {asset.metadata.tags.map((tag, idx) => (
                      <span key={idx} className="asset-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="asset-actions">
                <Link
                  href={`https://ipfs.io/ipfs/${asset.cid}`}
                  target="_blank"
                >
                  <button
                    className="asset-action-btn view"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </button>
                </Link>
                <button
                  className={`asset-action-btn delete ${
                    confirmDelete === asset.cid ? "confirm" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(asset.cid);
                  }}
                >
                  {confirmDelete === asset.cid ? "Confirm" : "Delete"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {hasMoreAssets && (
        <button
          className="load-more-button"
          onClick={onLoadMoreAssets}
          disabled={isLoadingAssets}
        >
          {isLoadingAssets ? "Loading..." : "Load More Assets"}
        </button>
      )}

      {selectedAssetCid && (
        <motion.div
          className="asset-details-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {renderAssetDetails(
            assets.find((a) => a.cid === selectedAssetCid) as Asset
          )}
        </motion.div>
      )}
    </div>
  );
};
