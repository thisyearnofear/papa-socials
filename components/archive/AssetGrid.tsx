import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Asset } from "./types";

interface AssetGridProps {
  assets: Asset[];
  onAssetClick: (asset: Asset) => void;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  onAssetClick,
  loading = false,
  hasMore = false,
  onLoadMore,
}) => {
  if (loading) {
    return (
      <div className="filecoin-loading-grid">
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
    );
  }

  if (assets.length === 0) {
    return (
      <div className="filecoin-empty">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="empty-icon">📦</div>
          <p>No items found in the catalogue.</p>
          <p>Add some items to get started.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="filecoin-assets-grid">
        {assets.map((asset: Asset, index: number) => (
          <motion.div
            key={asset.cid}
            className="filecoin-asset-card"
            onClick={() => onAssetClick(asset)}
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
            <div className="filecoin-asset-preview">
              {getAssetPreview(asset)}
            </div>
            <div className="filecoin-asset-info">
              <h3>{asset.metadata?.title || "Untitled"}</h3>
              <p className="filecoin-asset-type">
                {asset.metadata?.type || "Unknown type"}
              </p>
              <p className="filecoin-asset-date">
                {asset.metadata?.date
                  ? new Date(asset.metadata.date).toLocaleDateString()
                  : "Unknown date"}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <div className="load-more-container">
          <button
            onClick={onLoadMore}
            className="load-more-button"
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
};

// Helper function to get a preview image based on asset type
function getAssetPreview(asset: Asset) {
  const assetType = asset.metadata?.type;
  const assetUrl = `https://w3s.link/ipfs/${asset.cid}${
    asset.metadata?.title ? `/${encodeURIComponent(asset.metadata.title)}` : ""
  }`;

  if (assetType?.startsWith("image/") || assetType === "image") {
    return (
      <div
        className="filecoin-asset-image-container"
        style={{ position: "relative", width: "100%", height: "200px" }}
      >
        <Image
          src={assetUrl}
          alt={asset.metadata?.title || "Image"}
          className="filecoin-asset-image"
          fill
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }

  // Video thumbnail
  if (assetType?.startsWith("video/") || assetType === "video") {
    return (
      <div className="filecoin-asset-icon video">
        <span>🎬</span>
      </div>
    );
  }

  // Audio thumbnail
  if (assetType?.startsWith("audio/") || assetType === "audio") {
    return (
      <div className="filecoin-asset-icon audio">
        <span>🎵</span>
      </div>
    );
  }

  // PDF/Document thumbnail
  if (
    assetType === "application/pdf" ||
    assetType === "pdf" ||
    assetType === "document"
  ) {
    return (
      <div className="filecoin-asset-icon document">
        <span>📄</span>
      </div>
    );
  }

  // Default thumbnail
  return (
    <div className="filecoin-asset-icon default">
      <span>📁</span>
    </div>
  );
}
