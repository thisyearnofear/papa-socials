import React, { useState, useRef, useEffect, useCallback } from "react";
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
  url?: string;
}

interface AssetMetadata {
  title: string;
  description: string;
  creator: string;
  date: string;
  tags: string[];
  type: "image" | "audio" | "video" | "document";
  name?: string;
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
      name: fileAsset.name,
    },
    url: fileAsset.url,
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

  // New state for user auth and space management
  const [userEmail, setUserEmail] = useState<string>("");
  const [spaceName, setSpaceName] = useState<string>("");
  const [isCreatingSpace, setIsCreatingSpace] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [availableSpaces, setAvailableSpaces] = useState<
    Array<{ did: string; name: string }>
  >([]);
  const [isLoadingSpaces, _setIsLoadingSpaces] = useState<boolean>(false);
  const setIsLoadingSpaces = useCallback((value: boolean) => {
    _setIsLoadingSpaces(value);
  }, []);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMoreContent, setHasMoreContent] = useState<boolean>(false);

  // Add state for space cursor
  const [spaceCursor, setSpaceCursor] = useState<string>("");
  const [hasMoreSpaces, setHasMoreSpaces] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);

  // Initialize Archive hook
  const {
    storedAssets,
    isLoading: filecoinIsLoading,
    uploadFiles,
    isInitialized,
    userSpace,
    loginWithEmail,
    createUserSpace,
    logout,
    switchSpace,
    loadMoreAssets,
    getAvailableSpaces,
  } = useFilecoin();

  // Derived state - convert FilecoinAssets to Assets
  const assets = storedAssets.map(convertToAsset);
  const loading = filecoinIsLoading || isLoading;

  // Fetch available spaces for an email
  const fetchAvailableSpaces = useCallback(
    async (email: string) => {
      if (!email) return;

      setIsLoadingSpaces(true);
      try {
        // Reset spaces when first loading
        setAvailableSpaces([]);
        setSpaceCursor("");

        const result = await getAvailableSpaces(email);
        setAvailableSpaces(result.spaces);
        setSpaceCursor(result.cursor || "");
        setHasMoreSpaces(!!result.cursor);
        console.log("Available spaces:", result.spaces);
      } catch (err) {
        console.error("Error fetching spaces:", err);
      } finally {
        setIsLoadingSpaces(false);
      }
    },
    [getAvailableSpaces, setIsLoadingSpaces]
  );

  // Load more spaces function
  const loadMoreSpaces = useCallback(async () => {
    if (!userEmail || !spaceCursor) return;

    setIsLoadingSpaces(true);
    try {
      const result = await getAvailableSpaces(userEmail, spaceCursor);
      setAvailableSpaces((prev) => [...prev, ...result.spaces]);
      setSpaceCursor(result.cursor || "");
      setHasMoreSpaces(!!result.cursor);
    } catch (err) {
      console.error("Error loading more spaces:", err);
    } finally {
      setIsLoadingSpaces(false);
    }
  }, [userEmail, spaceCursor, getAvailableSpaces, setIsLoadingSpaces]);

  // Get spaces when the component mounts or userSpace changes
  useEffect(() => {
    if (userSpace) {
      fetchAvailableSpaces(userSpace.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSpace]);

  // Add a new useEffect to check for hasMoreContent after assets load
  useEffect(() => {
    // When assets are loaded, show the "Load More" button if there are items
    // This is a simple heuristic; in production you'd use a flag from the API
    setHasMoreContent(storedAssets.length > 0);
  }, [storedAssets.length]);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) {
      setUploadStatus({
        message: "Please enter your email address",
        status: "error",
      });
      return;
    }

    setIsLoggingIn(true);
    setUploadStatus({
      message: "Logging in and checking for spaces...",
      status: "uploading",
    });

    try {
      const success = await loginWithEmail(userEmail);
      if (success) {
        // Fetch available spaces for this email
        await fetchAvailableSpaces(userEmail);

        setUploadStatus({
          message:
            "Login successful! Check your email for verification if needed.",
          status: "success",
        });

        // Check if we've got a space after login
        if (userSpace) {
          // Switch to browse tab once logged in with space
          setActiveTab("browse");
        }
      } else {
        setUploadStatus({
          message: "Login failed. Please try again.",
          status: "error",
        });
      }
    } catch (err) {
      setUploadStatus({
        message: `Login error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        status: "error",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle space selection
  const handleSpaceSelection = async (spaceDid: string) => {
    if (!spaceDid || !userEmail) return;

    setIsLoading(true);
    setUploadStatus({
      message: "Connecting to space...",
      status: "uploading",
    });

    try {
      const selectedSpace = availableSpaces.find(
        (space) => space.did === spaceDid
      );
      if (!selectedSpace) throw new Error("Space not found");

      // Switch to the selected space using the context function
      const success = await switchSpace(
        spaceDid,
        userEmail,
        selectedSpace.name
      );

      if (success) {
        setUploadStatus({
          message: `Connected to space: ${selectedSpace.name}`,
          status: "success",
        });
        setActiveTab("browse");
      } else {
        setUploadStatus({
          message: "Failed to connect to selected space",
          status: "error",
        });
      }
    } catch (err) {
      setUploadStatus({
        message: `Error selecting space: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        status: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle space creation
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !spaceName) {
      setUploadStatus({
        message: "Email and space name are required",
        status: "error",
      });
      return;
    }

    setIsCreatingSpace(true);
    try {
      const space = await createUserSpace(userEmail, spaceName);
      if (space) {
        setUploadStatus({
          message: `Space "${spaceName}" created successfully!`,
          status: "success",
        });
        // Switch to upload tab once space is created
        setActiveTab("upload");
      } else {
        setUploadStatus({
          message: "Failed to create space. Please try again.",
          status: "error",
        });
      }
    } catch (err) {
      setUploadStatus({
        message: `Space creation error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        status: "error",
      });
    } finally {
      setIsCreatingSpace(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setUploadStatus({
      message: "You've been logged out",
      status: "success",
    });
  };

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
    // Determine the correct URL - if the url exists in the asset use that, otherwise construct it
    const assetUrl =
      asset.url ||
      `https://w3s.link/ipfs/${asset.cid}${
        asset.metadata.name
          ? `/${encodeURIComponent(asset.metadata.name as string)}`
          : ""
      }`;

    switch (asset.metadata.type) {
      case "image":
        return (
          <div className="archive-asset-preview">
            <OptimizedImage
              src={assetUrl}
              alt={asset.metadata.title || "Image asset"}
              width={250}
              height={180}
              style={{ objectFit: "cover", height: "100%", width: "100%" }}
              contentType="image"
              onError={(e) => {
                console.log("Image failed to load, trying alternative gateway");
                const img = e.currentTarget as HTMLImageElement;
                if (img.src.includes("w3s.link")) {
                  img.src = `https://ipfs.io/ipfs/${asset.cid}${
                    asset.metadata.name
                      ? `/${encodeURIComponent(asset.metadata.name as string)}`
                      : ""
                  }`;
                } else if (img.src.includes("ipfs.io")) {
                  img.src = `https://dweb.link/ipfs/${asset.cid}${
                    asset.metadata.name
                      ? `/${encodeURIComponent(asset.metadata.name as string)}`
                      : ""
                  }`;
                }
              }}
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
    // Determine the correct URL - if the url exists in the asset use that, otherwise construct it
    const assetUrl =
      asset.url ||
      `https://w3s.link/ipfs/${asset.cid}${
        asset.metadata.name
          ? `/${encodeURIComponent(asset.metadata.name as string)}`
          : ""
      }`;

    switch (asset.metadata.type) {
      case "image":
        return (
          <div className="filecoin-modal-preview">
            <OptimizedImage
              src={assetUrl}
              alt={asset.metadata.title || "Image asset"}
              width={400}
              height={300}
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                borderRadius: "8px",
              }}
              contentType="image"
              onError={(e) => {
                console.log("Image failed to load, trying alternative gateway");
                const img = e.currentTarget as HTMLImageElement;
                if (img.src.includes("w3s.link")) {
                  img.src = `https://ipfs.io/ipfs/${asset.cid}${
                    asset.metadata.name
                      ? `/${encodeURIComponent(asset.metadata.name as string)}`
                      : ""
                  }`;
                } else if (img.src.includes("ipfs.io")) {
                  img.src = `https://dweb.link/ipfs/${asset.cid}${
                    asset.metadata.name
                      ? `/${encodeURIComponent(asset.metadata.name as string)}`
                      : ""
                  }`;
                }
              }}
            />
            <div style={{ marginTop: "10px", textAlign: "center" }}>
              <a
                href={assetUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "4px",
                  marginTop: "10px",
                }}
              >
                View Original
              </a>
            </div>
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

  // Update the handleLoadMore function
  const handleLoadMore = async () => {
    setIsLoading(true);
    try {
      // Use loadMoreAssets instead of refreshAssets
      const hasMore = await loadMoreAssets();
      // Update state based on whether there are more assets to load
      setHasMoreContent(hasMore);
    } catch (err) {
      console.error("Error loading more assets:", err);
      setUploadStatus({
        message: "Error loading more content",
        status: "error",
      });
    } finally {
      setIsLoading(false);
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

      {/* Status Messages */}
      {uploadStatus && (
        <div
          className={`archive-message ${uploadStatus.status}`}
          style={{
            padding: "15px",
            borderRadius: "8px",
            margin: "15px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              uploadStatus.status === "success"
                ? "rgba(25, 135, 84, 0.8)"
                : uploadStatus.status === "error"
                ? "rgba(220, 53, 69, 0.8)"
                : "rgba(13, 110, 253, 0.8)",
            color: "white",
            fontWeight: "bold",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {uploadStatus.status === "uploading" && (
            <div
              className="loading-spinner"
              style={{ marginRight: "10px" }}
            ></div>
          )}
          {uploadStatus.message}
        </div>
      )}

      {/* User Authentication Status */}
      <div
        className="user-auth-status"
        style={{
          background: "rgba(30, 30, 30, 0.9)",
          padding: "15px 20px",
          borderRadius: "10px",
          marginBottom: "20px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
        }}
      >
        {userSpace ? (
          <div
            className="user-space-info"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 5px 0", color: "#fff" }}>
                Connected Space:{" "}
                <span style={{ color: "#4fd1c5" }}>{userSpace.spaceName}</span>
              </h3>
              <p
                style={{
                  margin: "0",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Account: {userSpace.email}
              </p>
              <p
                style={{
                  margin: "5px 0 0 0",
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Space ID: {userSpace.spaceDid.substring(0, 20)}...
              </p>

              {/* Space Selector */}
              {availableSpaces.length > 1 && (
                <div style={{ marginTop: "10px" }}>
                  <select
                    value={userSpace.spaceDid}
                    onChange={(e) => handleSpaceSelection(e.target.value)}
                    style={{
                      background: "rgba(50, 50, 50, 0.8)",
                      color: "white",
                      border: "1px solid rgba(79, 209, 197, 0.5)",
                      borderRadius: "4px",
                      padding: "5px 10px",
                      fontSize: "14px",
                      width: "100%",
                      maxWidth: "250px",
                    }}
                  >
                    {availableSpaces.map((space) => (
                      <option key={space.did} value={space.did}>
                        {space.name}{" "}
                        {space.did === userSpace.spaceDid ? "(current)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button
              className="logout-button"
              onClick={handleLogout}
              style={{
                padding: "8px 15px",
                background: "rgba(255, 100, 100, 0.2)",
                border: "1px solid rgba(255, 100, 100, 0.5)",
                borderRadius: "5px",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p
              className="login-prompt"
              style={{
                fontStyle: "italic",
                color: "rgba(255, 255, 255, 0.7)",
                marginBottom: "10px",
              }}
            >
              Please login to manage your catalogue space
            </p>
            <button
              onClick={() => setActiveTab("login")}
              style={{
                padding: "8px 16px",
                background: "rgba(79, 209, 197, 0.2)",
                border: "1px solid rgba(79, 209, 197, 0.5)",
                borderRadius: "5px",
                color: "white",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Login Now
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation - Mobile-optimized */}
      <div className="archive-tabs">
        <button
          className={`archive-tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          Browse
        </button>
        {isInitialized ? (
          <button
            className={`archive-tab ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            Upload
          </button>
        ) : (
          <button
            className={`archive-tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="archive-content">
        {/* Login / Create Space */}
        {activeTab === "login" && !isInitialized && (
          <motion.div
            className="archive-auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="section-title">Connect to Your Space</h2>

            {uploadStatus &&
            uploadStatus.status === "success" &&
            uploadStatus.message.includes("Login successful") ? (
              <div
                style={{
                  background: "rgba(30, 30, 30, 0.9)",
                  padding: "25px",
                  borderRadius: "10px",
                  textAlign: "center",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
                  marginTop: "20px",
                }}
              >
                <h3 style={{ color: "#4fd1c5", marginBottom: "15px" }}>
                  Login Successful!
                </h3>
                <p>
                  Would you like to create a new storage space for your content?
                </p>

                {/* Available Spaces List */}
                {availableSpaces.length > 0 && (
                  <div style={{ marginTop: "20px", textAlign: "left" }}>
                    <h4 style={{ color: "#fff", marginBottom: "10px" }}>
                      Your Available Spaces:
                    </h4>
                    <div
                      style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        background: "rgba(40, 40, 40, 0.6)",
                        padding: "8px",
                        borderRadius: "5px",
                      }}
                    >
                      {availableSpaces.map((space) => (
                        <div
                          key={space.did}
                          style={{
                            padding: "8px 10px",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: "bold" }}>
                              {space.name}
                            </div>
                            <div style={{ fontSize: "11px", opacity: 0.7 }}>
                              {space.did.substring(0, 15)}...
                            </div>
                          </div>
                          <button
                            onClick={() => handleSpaceSelection(space.did)}
                            style={{
                              background: "rgba(79, 209, 197, 0.2)",
                              color: "#fff",
                              border: "1px solid rgba(79, 209, 197, 0.5)",
                              borderRadius: "4px",
                              padding: "5px 10px",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Load More Spaces Button */}
                    {hasMoreSpaces && (
                      <div style={{ textAlign: "center", marginTop: "10px" }}>
                        <button
                          onClick={loadMoreSpaces}
                          style={{
                            background: "rgba(255, 255, 255, 0.1)",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            color: "white",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            width: "100%",
                          }}
                          disabled={isLoadingSpaces}
                        >
                          {isLoadingSpaces ? (
                            <>
                              <span className="button-spinner"></span>
                              Loading...
                            </>
                          ) : (
                            <>
                              Load More Spaces
                              <span style={{ fontSize: "14px" }}>↓</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Create New Space Form */}
                <div style={{ marginTop: "20px" }}>
                  <div className="archive-form-group">
                    <label
                      className="archive-form-label"
                      style={{ color: "#fff", fontWeight: "bold" }}
                    >
                      Space Name
                    </label>
                    <input
                      type="text"
                      value={spaceName}
                      onChange={(e) => setSpaceName(e.target.value)}
                      className="archive-form-input"
                      placeholder="my-awesome-space"
                      style={{
                        background: "rgba(50, 50, 50, 0.7)",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                      }}
                      required
                    />
                  </div>

                  <button
                    onClick={handleCreateSpace}
                    style={{
                      width: "100%",
                      padding: "12px",
                      marginTop: "15px",
                      background: "#4fd1c5",
                      border: "none",
                      borderRadius: "5px",
                      color: "white",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "16px",
                    }}
                    disabled={isCreatingSpace || !spaceName}
                  >
                    {isCreatingSpace ? (
                      <>
                        <span className="button-spinner"></span>
                        Creating...
                      </>
                    ) : (
                      "Create New Space"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-forms">
                {/* Login Form */}
                <form onSubmit={handleLogin} className="auth-form">
                  <h3>Login with Email</h3>
                  <div className="archive-form-group">
                    <label className="archive-form-label">Email</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="archive-form-input"
                      placeholder="your-email@example.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="archive-auth-button"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <span className="button-spinner"></span>
                        Verifying...
                      </>
                    ) : (
                      "Login"
                    )}
                  </button>
                  <p className="form-note">
                    You&apos;ll receive a verification email to confirm your
                    identity
                  </p>
                </form>

                {/* Create Space Form */}
                <form onSubmit={handleCreateSpace} className="auth-form">
                  <h3>Create Your Space</h3>
                  <div className="archive-form-group">
                    <label className="archive-form-label">Email</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="archive-form-input"
                      placeholder="your-email@example.com"
                      required
                    />
                  </div>
                  <div className="archive-form-group">
                    <label className="archive-form-label">Space Name</label>
                    <input
                      type="text"
                      value={spaceName}
                      onChange={(e) => setSpaceName(e.target.value)}
                      className="archive-form-input"
                      placeholder="my-awesome-space"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="archive-auth-button"
                    disabled={isCreatingSpace}
                  >
                    {isCreatingSpace ? (
                      <>
                        <span className="button-spinner"></span>
                        Creating...
                      </>
                    ) : (
                      "Create Space"
                    )}
                  </button>
                  <p className="form-note">
                    Your space stores your content on the decentralized web
                  </p>
                </form>
              </div>
            )}
          </motion.div>
        )}

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
                  {userSpace && (
                    <>
                      <div
                        style={{
                          marginTop: "20px",
                          padding: "15px",
                          background: "rgba(30, 30, 30, 0.7)",
                          borderRadius: "8px",
                          fontSize: "14px",
                          textAlign: "left",
                        }}
                      >
                        <h3 style={{ marginTop: 0 }}>Debug Info:</h3>
                        <p>Space DID: {userSpace.spaceDid}</p>
                        <p>Space Name: {userSpace.spaceName}</p>
                        <p>Account: {userSpace.email}</p>
                      </div>
                      <p
                        style={{
                          marginTop: "15px",
                          fontSize: "13px",
                          opacity: 0.7,
                        }}
                      >
                        If you believe this space should have content, try
                        uploading a test file to see if the connection is
                        working correctly.
                      </p>
                    </>
                  )}
                  <button
                    className="filecoin-action-button"
                    onClick={() => setActiveTab("upload")}
                  >
                    Add New Content
                  </button>
                </motion.div>
              </div>
            )}
            {hasMoreContent && (
              <div
                className="load-more-container"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: "20px 0",
                }}
              >
                <button
                  onClick={handleLoadMore}
                  className="load-more-button"
                  style={{
                    padding: "10px 20px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    borderRadius: "5px",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="button-spinner"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More Items
                      <span style={{ fontSize: "20px" }}>↓</span>
                    </>
                  )}
                </button>
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
            <h2 className="section-title" style={{ textAlign: "center" }}>
              Add to Catalogue
            </h2>

            <div className="upload-intro" style={{ textAlign: "center" }}>
              <p>
                Share your content with PAPA&apos;s fans by adding it to the
                catalogue. Your content will be preserved on the decentralized
                web for future generations.
              </p>
            </div>

            <form
              onSubmit={handleUpload}
              className="archive-upload-form"
              style={{
                background: "rgba(30, 30, 30, 0.9)",
                padding: "30px",
                borderRadius: "10px",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
              }}
            >
              <div className="archive-form-group">
                <label
                  className="archive-form-label"
                  style={{ color: "#fff", fontWeight: "bold" }}
                >
                  Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  className="archive-form-input"
                  style={{
                    background: "rgba(50, 50, 50, 0.7)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
              </div>

              <div className="archive-form-group">
                <label
                  className="archive-form-label"
                  style={{ color: "#fff", fontWeight: "bold" }}
                >
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={assetMetadata.title}
                  onChange={handleMetadataChange}
                  className="archive-form-input"
                  style={{
                    background: "rgba(50, 50, 50, 0.7)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
              </div>

              <div className="archive-form-group">
                <label
                  className="archive-form-label"
                  style={{ color: "#fff", fontWeight: "bold" }}
                >
                  Description
                </label>
                <textarea
                  name="description"
                  value={assetMetadata.description}
                  onChange={handleMetadataChange}
                  className="archive-form-input"
                  rows={3}
                  style={{
                    background: "rgba(50, 50, 50, 0.7)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
              </div>

              <div className="archive-form-group">
                <label
                  className="archive-form-label"
                  style={{ color: "#fff", fontWeight: "bold" }}
                >
                  Creator
                </label>
                <input
                  type="text"
                  name="creator"
                  value={assetMetadata.creator}
                  onChange={handleMetadataChange}
                  className="archive-form-input"
                  style={{
                    background: "rgba(50, 50, 50, 0.7)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
              </div>

              <div className="archive-form-group">
                <label
                  className="archive-form-label"
                  style={{ color: "#fff", fontWeight: "bold" }}
                >
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={assetMetadata.date}
                  onChange={handleMetadataChange}
                  className="archive-form-input"
                  style={{
                    background: "rgba(50, 50, 50, 0.7)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
              </div>

              <div className="archive-form-group">
                <label
                  className="archive-form-label"
                  style={{ color: "#fff", fontWeight: "bold" }}
                >
                  Tags
                </label>
                <input
                  type="text"
                  ref={tagsInputRef}
                  onKeyDown={handleTagsSubmit}
                  placeholder="Type a tag and press Enter"
                  className="archive-form-input"
                  style={{
                    background: "rgba(50, 50, 50, 0.7)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                  }}
                />
                <div
                  className="archive-tags-container"
                  style={{ marginTop: "10px" }}
                >
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
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "#555",
                  color: "white",
                  fontSize: "16px",
                  marginTop: "20px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
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
                  "Upload to Catalogue"
                )}
              </button>
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

        /* Add styles for new auth components */
        .user-auth-status {
          background: rgba(255, 255, 255, 0.1);
          padding: 10px 15px;
          border-radius: 4px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-space-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .login-prompt {
          font-style: italic;
          color: rgba(255, 255, 255, 0.7);
        }

        .logout-button {
          padding: 5px 10px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
        }

        .auth-forms {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 20px;
        }

        .auth-form {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 8px;
        }

        .auth-form h3 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 18px;
        }

        .archive-auth-button {
          width: 100%;
          background: #333;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .form-note {
          font-size: 13px;
          opacity: 0.7;
          margin-top: 10px;
          text-align: center;
        }

        @media (max-width: 768px) {
          .auth-forms {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ArchiveContent;
