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

// Define a specific type for status that includes "info"
type StatusType = "loading" | "success" | "error" | "info";

// Update the UploadStatus type to use our local StatusType
interface ExtendedUploadStatus {
  status: StatusType;
  message: string;
}

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
  const [uploadStatus, setUploadStatus] = useState<ExtendedUploadStatus | null>(
    null
  );
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
  const [initialLoadAttempted, setInitialLoadAttempted] =
    useState<boolean>(false);
  const [showSpaceSelector, setShowSpaceSelector] = useState<boolean>(false);

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

  // When user login is successful but no content loads, prompt to select a space
  useEffect(() => {
    if (
      isInitialized &&
      userSpace &&
      storedAssets.length === 0 &&
      !initialLoadAttempted
    ) {
      // Show space selector if we have spaces available but content isn't loading
      if (availableSpaces.length > 0) {
        setShowSpaceSelector(true);

        // Show a helpful message to guide the user
        setUploadStatus({
          message: "Please select a space to view its contents",
          status: "info",
        });
      }
    }
  }, [
    isInitialized,
    userSpace,
    storedAssets.length,
    initialLoadAttempted,
    availableSpaces.length,
  ]);

  // Force refresh of assets after login or space switch
  useEffect(() => {
    // Only run this if we're initialized and have a userSpace
    if (isInitialized && userSpace && !initialLoadAttempted) {
      // Set flag to prevent multiple refresh attempts
      setInitialLoadAttempted(true);

      // Show loading state
      setIsLoading(true);

      // Try to load assets
      refreshAssets()
        .then(() => {
          console.log("Initial assets loaded after login/space switch");
          if (storedAssets.length === 0) {
            // If still no assets, suggest space switching
            if (availableSpaces.length > 1) {
              setUploadStatus({
                message:
                  "No items found in this space. Try selecting a different space or upload new items.",
                status: "info",
              });
              setShowSpaceSelector(true);
            } else {
              setUploadStatus({
                message:
                  "No items found in this space. You can upload new items or refresh to check again.",
                status: "info",
              });
            }
            setTimeout(() => setUploadStatus(null), 5000);
          } else {
            // Hide space selector if we successfully loaded content
            setShowSpaceSelector(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load initial assets:", err);
          setUploadStatus({
            message:
              "Unable to load assets, please try selecting a different space",
            status: "error",
          });
          // Show space selector on error to help user try a different space
          setShowSpaceSelector(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [
    isInitialized,
    userSpace,
    refreshAssets,
    storedAssets.length,
    availableSpaces.length,
  ]);

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

        // Reset the initialLoadAttempted flag to ensure content loads after login
        setInitialLoadAttempted(false);

        if (userSpace) {
          setActiveTab("browse");

          // If we have multiple spaces available but no content is loading,
          // show the space selector right away to improve the UX
          if (availableSpaces.length > 1) {
            setShowSpaceSelector(true);
          }
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
    setShowSpaceSelector(false); // Hide the selector while switching

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
        // Reset the initialLoadAttempted flag to ensure content loads after switching space
        setInitialLoadAttempted(false);

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
        setShowSpaceSelector(true); // Show selector again on failure
      }
    } catch (err) {
      setUploadStatus({
        message: `Error selecting space: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
        status: "error",
      });
      setShowSpaceSelector(true); // Show selector again on error
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
        // Reset the initialLoadAttempted flag to ensure content loads after creating space
        setInitialLoadAttempted(false);

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

      // Reset initialLoadAttempted to force refresh after upload
      setInitialLoadAttempted(false);

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

  // Function to manually refresh the asset list
  const handleManualRefresh = async () => {
    setIsLoading(true);
    try {
      await refreshAssets();

      if (storedAssets.length === 0) {
        // If still no assets after refresh, suggest space switching
        if (availableSpaces.length > 1) {
          setUploadStatus({
            message:
              "No items found in this space. Try selecting a different space.",
            status: "info",
          });
          setShowSpaceSelector(true);
        } else {
          setUploadStatus({
            message: "No items found in this space. You can upload new items.",
            status: "info",
          });
        }
      } else {
        setUploadStatus({
          message: "Catalogue refreshed successfully",
          status: "success",
        });
        setShowSpaceSelector(false); // Hide space selector if content loaded
      }

      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error("Error refreshing catalogue:", error);
      setUploadStatus({
        message:
          "Failed to refresh catalogue. Try selecting a different space.",
        status: "error",
      });
      // Show space selector on error to help user try a different space
      setShowSpaceSelector(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="archive-container centered-archive">
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

      {/* Space Selector - Shown when we need user to select a space */}
      {showSpaceSelector && isInitialized && availableSpaces.length > 0 && (
        <div className="space-selector">
          <h3>Select a Space to View Content</h3>
          <p>To view your content, please select one of your spaces below:</p>
          <div className="space-list">
            {availableSpaces.map((space) => (
              <button
                key={space.did}
                className={`space-item ${
                  userSpace?.spaceDid === space.did ? "active" : ""
                }`}
                onClick={() => handleSpaceSelection(space.did)}
                disabled={loading}
              >
                <span className="space-name">{space.name}</span>
                {userSpace?.spaceDid === space.did && (
                  <span className="space-current">(Current)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="archive-tabs">
        <button
          className={`archive-tab ${activeTab === "browse" ? "active" : ""}`}
          onClick={() => setActiveTab("browse")}
        >
          Browse
        </button>
        <button
          onClick={handleManualRefresh}
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

            {isInitialized && assets.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-state-icon">📁</div>
                <h3>No items in catalogue</h3>
                <p>
                  This space is empty. You can upload new items or refresh to
                  check again.
                </p>
                <div className="empty-state-actions">
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="empty-state-button"
                  >
                    Upload New Items
                  </button>
                  <button
                    onClick={handleManualRefresh}
                    className="empty-state-button secondary"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <AssetGrid
                assets={assets}
                onAssetClick={setSelectedAsset}
                loading={loading}
                hasMore={hasMoreContent}
                onLoadMore={handleLoadMore}
              />
            )}
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
