import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { AssetMetadata, UploadStatus } from "./types";

interface UploadFormProps {
  onUpload: (files: File[], metadata: AssetMetadata) => Promise<void>;
  uploadStatus: UploadStatus | null;
  isUploading: boolean;
}

const DEFAULT_METADATA: AssetMetadata = {
  title: "",
  description: "",
  creator: "",
  type: "image",
  tags: [],
};

export const UploadForm: React.FC<UploadFormProps> = ({
  onUpload,
  uploadStatus,
  isUploading,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<AssetMetadata>(DEFAULT_METADATA);
  const [tagInput, setTagInput] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);

      // Auto-fill title with filename if empty
      if (!metadata.title && files.length === 1) {
        const fileName = files[0].name.split(".")[0]; // Remove extension
        setMetadata({
          ...metadata,
          title: fileName.charAt(0).toUpperCase() + fileName.slice(1), // Capitalize first letter
        });
      }
    }
  };

  const handleMetadataChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setMetadata({ ...metadata, [name]: value });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      setMetadata({
        ...metadata,
        tags: [...(metadata.tags || []), tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setMetadata({
      ...metadata,
      tags: (metadata.tags || []).filter((tag: string) => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    await onUpload(selectedFiles, metadata);

    // Reset form after successful upload
    if (!isUploading && uploadStatus?.status === "success") {
      setSelectedFiles([]);
      setMetadata(DEFAULT_METADATA);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <motion.div
      className="archive-upload"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="section-title">Upload Files to IPFS</h2>

      <div className="upload-intro">
        <p>
          Upload your files to IPFS and the Filecoin network for decentralized,
          permanent storage.
        </p>
      </div>

      <form className="archive-upload-form" onSubmit={handleSubmit}>
        <div className="archive-form-group">
          <label className="archive-form-label">Select Files</label>
          <input
            type="file"
            onChange={handleFileSelect}
            multiple
            className="archive-form-input"
            ref={fileInputRef}
          />
          {selectedFiles.length > 0 && (
            <div className="selected-files">
              <p>Selected {selectedFiles.length} file(s):</p>
              <ul>
                {selectedFiles.map((file, index) => (
                  <li key={index}>
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="archive-form-group">
          <label className="archive-form-label">Title</label>
          <input
            type="text"
            name="title"
            value={metadata.title}
            onChange={handleMetadataChange}
            className="archive-form-input"
            placeholder="Enter a title"
          />
        </div>

        <div className="archive-form-group">
          <label className="archive-form-label">Description</label>
          <textarea
            name="description"
            value={metadata.description}
            onChange={handleMetadataChange}
            className="archive-form-input"
            placeholder="Enter a description"
            rows={3}
          />
        </div>

        <div className="archive-form-group">
          <label className="archive-form-label">Creator</label>
          <input
            type="text"
            name="creator"
            value={metadata.creator}
            onChange={handleMetadataChange}
            className="archive-form-input"
            placeholder="Enter creator name"
          />
        </div>

        <div className="archive-form-group">
          <label className="archive-form-label">Type</label>
          <select
            name="type"
            value={metadata.type}
            onChange={handleMetadataChange}
            className="archive-form-input"
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="document">Document</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="archive-form-group">
          <label className="archive-form-label">Tags</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="archive-form-input"
            placeholder="Type a tag and press Enter"
          />
          {(metadata.tags || []).length > 0 && (
            <div className="archive-tags-container">
              {(metadata.tags || []).map((tag: string) => (
                <div key={tag} className="archive-tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="archive-tag-remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="archive-upload-button"
          disabled={isUploading || selectedFiles.length === 0}
        >
          {isUploading ? (
            <>
              <span className="loading-spinner"></span> Uploading...
            </>
          ) : (
            "Upload to IPFS"
          )}
        </button>

        {uploadStatus && (
          <div className={`archive-message ${uploadStatus.status}`}>
            {uploadStatus.message}
          </div>
        )}
      </form>
    </motion.div>
  );
};
