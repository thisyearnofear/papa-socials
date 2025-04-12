import React from "react";
import { Asset } from "./types";
import { FilePreview } from "./FilePreview";

interface AssetModalProps {
  asset: Asset;
  onClose: () => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({ asset, onClose }) => {
  return (
    <div className="asset-modal">
      <div className="asset-modal-content">
        <button className="close-modal" onClick={onClose}>
          &times;
        </button>
        <h2>{asset.metadata?.title || "Untitled Asset"}</h2>

        <FilePreview
          url={`https://w3s.link/ipfs/${asset.cid}`}
          fileName={asset.metadata?.title}
          fileType={asset.metadata?.type}
        />

        <div className="asset-metadata">
          <p>
            <strong>Type:</strong> {asset.metadata?.type || "Unknown"}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {asset.metadata?.date
              ? new Date(asset.metadata.date).toLocaleDateString()
              : "Unknown date"}
          </p>
          <p>
            <strong>Creator:</strong> {asset.metadata?.creator || "Unknown"}
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {asset.metadata?.description || "No description provided."}
          </p>
          <p>
            <strong>CID:</strong> {asset.cid}
          </p>
          {asset.metadata?.tags && asset.metadata.tags.length > 0 && (
            <div>
              <strong>Tags:</strong>
              <div className="asset-tags">
                {asset.metadata.tags.map((tag, index) => (
                  <span key={index} className="asset-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
