import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  useFilecoin,
  FilecoinAsset,
  AssetMetadata as ContextAssetMetadata,
} from "../contexts/filecoin-context";
import { AssetGrid } from "./archive/AssetGrid";
import { UploadForm } from "./archive/UploadForm";
import { UserStatus } from "./archive/UserStatus";
import { SpaceCreator } from "./archive/SpaceCreator";
import { AssetModal } from "./archive/AssetModal";
import {
  Asset as ArchiveAsset,
  AssetMetadata,
  UploadStatus,
} from "./archive/types";
import { DelegationTab } from "./archive/DelegationTab";

interface ArchiveContentProps {
  onBackClick: () => void;
}

// Adapter function to convert FilecoinAsset to Asset
const convertToAsset = (fileAsset: FilecoinAsset): ArchiveAsset => {
  return {
    cid: fileAsset.cid,
    size: fileAsset.size,
    metadata: {
      title: fileAsset.metadata?.title || fileAsset.name,
      description: fileAsset.metadata?.description,
      creator: fileAsset.metadata?.creator,
      date: fileAsset.metadata?.date,
      tags: fileAsset.metadata?.tags,
      type: fileAsset.metadata?.type || fileAsset.type,
    },
    added: fileAsset.uploadedAt,
    lastAccessed: new Date().toISOString(),
  };
};

// Convert AssetMetadata to ContextAssetMetadata
const convertToContextMetadata = (
  metadata: AssetMetadata
): ContextAssetMetadata => {
  return {
    title: metadata.title,
    description: metadata.description,
    creator: metadata.creator,
    date: metadata.date,
    type: metadata.type,
    tags: metadata.tags,
  };
};

const ArchiveContent: React.FC<ArchiveContentProps> = ({ onBackClick }) => {
  // State management
  const [selectedAsset, setSelectedAsset] = useState<ArchiveAsset | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [activeTab, setActiveTab] = useState<string>("browse");
  const [userEmail, setUserEmail] = useState<string>("");
  const [spaceName, setSpaceName] = useState<string>("");
  const [isCreatingSpace, setIsCreatingSpace] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [availableSpaces, setAvailableSpaces] = useState<
    Array<{ did: string; name: string }>
  >([]);
  const [isLoadingSpaces, setIsLoadingSpaces] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMoreContent, setHasMoreContent] = useState<boolean>(true);
  const [spaceCursor, setSpaceCursor] = useState<string>("");
  const [hasMoreSpaces, setHasMoreSpaces] = useState<boolean>(false);

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
    refreshAssets,
  } = useFilecoin();

  // Derived state
  const assets = storedAssets.map(convertToAsset);
  const loading = filecoinIsLoading || isLoading;

  // Fetch available spaces
  const fetchAvailableSpaces = useCallback(
    async (email: string) => {
      if (!email) return;

      setIsLoadingSpaces(true);
      try {
        setAvailableSpaces([]);
        setSpaceCursor("");

        const result = await getAvailableSpaces(email);
        setAvailableSpaces(result.spaces);
        setSpaceCursor(result.cursor || "");
        setHasMoreSpaces(!!result.cursor);
      } catch (err) {
        console.error("Error fetching spaces:", err);
      } finally {
        setIsLoadingSpaces(false);
      }
    },
    [getAvailableSpaces]
  );

  // Load more spaces
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
  }, [userEmail, spaceCursor, getAvailableSpaces]);

  // Get spaces when userSpace changes
  useEffect(() => {
    if (userSpace) {
      fetchAvailableSpaces(userSpace.email);
    }
  }, [userSpace, fetchAvailableSpaces]);

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
    try {
      const success = await loginWithEmail(userEmail);
      if (success) {
        await fetchAvailableSpaces(userEmail);
        setUploadStatus({
          message:
            "Login successful! Check your email for verification if needed.",
          status: "success",
        });
        if (userSpace) {
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
    try {
      const selectedSpace = availableSpaces.find(
        (space) => space.did === spaceDid
      );
      if (!selectedSpace) throw new Error("Space not found");

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

  // Handle file upload
  const handleUpload = async (files: File[], metadata: AssetMetadata) => {
    setUploadStatus({
      message: "Uploading to archive...",
      status: "loading",
    });

    try {
      await uploadFiles(files, convertToContextMetadata(metadata));
      setUploadStatus({
        message: "Files uploaded successfully to archive!",
        status: "success",
      });
      setActiveTab("browse");
    } catch (err) {
      setUploadStatus({
        message: `Error uploading files: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        status: "error",
      });
    }
  };

  // Handle load more
  const handleLoadMore = async () => {
    setIsLoading(true);
    try {
      const hasMore = await loadMoreAssets();
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

  return (
    <div className="archive-container">
      {/* Header */}
      <div className="archive-header">
        <button className="archive-back-button" onClick={onBackClick}>
          Back
        </button>
      </div>

      {/* Status Messages */}
      {uploadStatus && (
        <div className={`archive-message ${uploadStatus.status}`}>
          {uploadStatus.status === "loading" && (
            <div className="loading-spinner"></div>
          )}
          {uploadStatus.message}
        </div>
      )}

      {/* User Authentication Status */}
      <div className="user-auth-status">
        <UserStatus
          userSpace={userSpace}
          availableSpaces={availableSpaces}
          onSpaceSelection={handleSpaceSelection}
          onLogout={logout}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="archive-tabs">
        <button
          className={`archive-tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          Browse
        </button>
        <button
          onClick={async () => {
            setIsLoading(true);
            try {
              await refreshAssets();
              setUploadStatus({
                message: "Catalogue refreshed successfully",
                status: "success",
              });
              setTimeout(() => setUploadStatus(null), 3000);
            } catch (error) {
              console.error("Error refreshing catalogue:", error);
              setUploadStatus({
                message: "Failed to refresh catalogue",
                status: "error",
              });
            } finally {
              setIsLoading(false);
            }
          }}
          className="archive-tab"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="button-spinner"></span>
              Refreshing...
            </>
          ) : (
            <>
              <span>🔄</span>
              Refresh
            </>
          )}
        </button>
        {isInitialized ? (
          <>
            <button
              className={`archive-tab ${
                activeTab === "upload" ? "active" : ""
              }`}
              onClick={() => setActiveTab("upload")}
            >
              Upload
            </button>
            <button
              className={`archive-tab ${activeTab === "share" ? "active" : ""}`}
              onClick={() => setActiveTab("share")}
            >
              Share
            </button>
          </>
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

            {uploadStatus?.status === "success" &&
            uploadStatus.message.includes("Login successful") ? (
              <SpaceCreator
                spaceName={spaceName}
                onSpaceNameChange={setSpaceName}
                onCreateSpace={handleCreateSpace}
                isCreatingSpace={isCreatingSpace}
                availableSpaces={availableSpaces}
                onSpaceSelection={handleSpaceSelection}
                isLoadingSpaces={isLoadingSpaces}
                hasMoreSpaces={hasMoreSpaces}
                onLoadMoreSpaces={loadMoreSpaces}
              />
            ) : (
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
            <div className="browse-header">
              <h2 className="section-title">Artist Catalogue</h2>
            </div>

            <AssetGrid
              assets={assets}
              onAssetClick={setSelectedAsset}
              loading={loading}
              hasMore={hasMoreContent}
              onLoadMore={handleLoadMore}
            />
          </motion.div>
        )}

        {/* Upload Assets */}
        {activeTab === "upload" && (
          <motion.div
            className="archive-upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="section-title">Add to Catalogue</h2>
            <UploadForm
              onUpload={handleUpload}
              uploadStatus={uploadStatus}
              isUploading={loading}
            />
          </motion.div>
        )}

        {/* Share Access */}
        {activeTab === "share" && (
          <DelegationTab
            userSpace={userSpace}
            uploadStatus={uploadStatus}
            setUploadStatus={setUploadStatus}
            onRefresh={refreshAssets}
          />
        )}
      </div>

      {/* Asset Modal */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
};

export default ArchiveContent;
