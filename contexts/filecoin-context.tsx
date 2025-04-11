import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Asset and metadata interfaces
export interface AssetMetadata {
  title?: string;
  description?: string;
  creator?: string;
  date?: string;
  tags?: string[];
  type?: string;
  [key: string]: unknown;
}

export interface StorageResult {
  cid: string;
  metadata: AssetMetadata;
  url: string;
}

export interface StorageResults {
  cid: string;
  metadata: AssetMetadata;
  urls: string[];
}

export interface FilecoinAsset {
  id: number;
  cid: string;
  name: string;
  type: string;
  size: number;
  url: string;
  metadata: AssetMetadata;
  uploadedAt: string;
}

// User space information
export interface UserSpace {
  spaceDid: string;
  spaceName: string;
  email: string;
}

// Context type definition
interface FilecoinContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  userSpace: UserSpace | null;
  storedAssets: FilecoinAsset[];
  agentDid: string | null;
  createUserSpace: (
    email: string,
    spaceName: string
  ) => Promise<UserSpace | null>;
  loginWithEmail: (email: string) => Promise<boolean>;
  uploadFile: (
    file: File,
    metadata?: AssetMetadata
  ) => Promise<StorageResult | null>;
  uploadFiles: (
    files: File[],
    metadata?: AssetMetadata
  ) => Promise<StorageResults | null>;
  verifyAsset: (asset: FilecoinAsset) => Promise<boolean>;
  refreshAssets: () => Promise<void>;
  loadMoreAssets: () => Promise<boolean>;
  getAvailableSpaces: (
    email: string,
    cursor?: string
  ) => Promise<{
    spaces: Array<{ did: string; name: string }>;
    cursor?: string;
  }>;
  checkLoginStatus: () => Promise<boolean>;
  logout: () => void;
  switchSpace: (
    spaceDid: string,
    email: string,
    spaceName: string
  ) => Promise<boolean>;
}

// Create context
const FilecoinContext = createContext<FilecoinContextType | undefined>(
  undefined
);

// Context hook
export function useFilecoin() {
  const context = useContext(FilecoinContext);
  if (context === undefined) {
    console.error(
      "useFilecoin hook used outside of FilecoinProvider - this will cause an error"
    );
    throw new Error("useFilecoin must be used within a FilecoinProvider");
  }
  return context;
}

// Provider props
interface FilecoinProviderProps {
  children: ReactNode;
}

// FilecoinProvider component
export function FilecoinProvider({ children }: FilecoinProviderProps) {
  // Check if we're in the browser
  const isBrowser = typeof window !== "undefined";

  // State
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storedAssets, setStoredAssets] = useState<FilecoinAsset[]>([]);
  const [userSpace, setUserSpace] = useState<UserSpace | null>(null);
  const [agentDid, setAgentDid] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [currentCursor, setCurrentCursor] = useState<string>("");

  // Initialize agent and check for existing space
  useEffect(() => {
    if (!isBrowser) {
      console.log("Skipping FilecoinProvider initialization in SSR context");
      return;
    }

    console.log("FilecoinProvider initializing in browser context...");

    // Initialize the client and get the agent DID
    const initializeAgent = async () => {
      try {
        // Create the client and get the agent DID
        const response = await fetch("/api/storage/agent", {
          method: "GET",
        });

        if (!response.ok) {
          console.warn("Failed to initialize agent");
          return;
        }

        const data = await response.json();
        setAgentDid(data.agentDid);

        // Load stored assets
        loadAssetsFromStorage();

        // Check if we have a user space in localStorage
        const savedSpace = localStorage.getItem("user_space");
        if (savedSpace) {
          try {
            const parsedSpace = JSON.parse(savedSpace);
            setUserSpace(parsedSpace);

            // Verify the space is still valid
            const spaceVerified = await verifyUserSpace(parsedSpace);
            if (spaceVerified) {
              setIsInitialized(true);
            }
          } catch (err) {
            console.error("Error parsing saved space:", err);
          }
        }

        setIsLoadingInitial(false);
      } catch (err) {
        console.error("Error initializing agent:", err);
        setIsLoadingInitial(false);
        setError("Failed to initialize Storacha client");
      }
    };

    initializeAgent();
  }, [isBrowser]);

  // Load assets from localStorage
  const loadAssetsFromStorage = () => {
    if (!isBrowser) return;

    try {
      const savedAssets = localStorage.getItem("filecoin_assets");
      if (savedAssets) {
        const parsedAssets = JSON.parse(savedAssets);
        setStoredAssets(parsedAssets);
        console.log("Loaded stored assets from localStorage");
      } else {
        setStoredAssets([]);
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Error loading stored assets:", err);
      setStoredAssets([]);
      setIsLoading(false);
    }
  };

  // Verify a user space is still valid
  const verifyUserSpace = async (space: UserSpace): Promise<boolean> => {
    try {
      const response = await fetch("/api/storage/verify-space", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spaceDid: space.spaceDid,
          email: space.email,
        }),
      });

      const data = await response.json();
      return data.success === true;
    } catch (err) {
      console.error("Error verifying user space:", err);
      return false;
    }
  };

  // Save assets to localStorage
  const saveStoredAssets = (assets: FilecoinAsset[]) => {
    if (!isBrowser) return;

    try {
      localStorage.setItem("filecoin_assets", JSON.stringify(assets));
    } catch (err) {
      console.error("Error saving stored assets:", err);
    }
  };

  // Check login status
  const checkLoginStatus = async (): Promise<boolean> => {
    if (!isBrowser) return false;

    try {
      const response = await fetch("/api/storage/login-status", {
        method: "GET",
      });

      const data = await response.json();
      return data.isLoggedIn === true;
    } catch (err) {
      console.error("Error checking login status:", err);
      return false;
    }
  };

  // Login with email
  const loginWithEmail = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`Attempting to login with email: ${email}`);
      const response = await fetch("/api/storage/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to login.");
        return false;
      }

      console.log("Login successful, checking for existing spaces...");
      // After successful login, check for existing spaces associated with this email
      try {
        console.log(`Fetching spaces for ${email}...`);
        const spacesResponse = await fetch("/api/storage/list-spaces", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!spacesResponse.ok) {
          const errorData = await spacesResponse.json();
          console.error("Error from list-spaces API:", errorData);
          throw new Error(errorData.message || "Failed to list spaces");
        }

        const spacesData = await spacesResponse.json();
        console.log("Spaces API response:", spacesData);

        if (
          spacesData.success &&
          spacesData.spaces &&
          spacesData.spaces.length > 0
        ) {
          console.log(
            `Found ${spacesData.spaces.length} spaces:`,
            spacesData.spaces
          );
          // Use the first space by default
          const space = spacesData.spaces[0];
          console.log(`Using space: ${space.name} (${space.did})`);

          setUserSpace({
            spaceDid: space.did,
            spaceName: space.name,
            email: email,
          });
          setIsInitialized(true);

          // Save space to localStorage
          if (isBrowser) {
            localStorage.setItem(
              "user_space",
              JSON.stringify({
                spaceDid: space.did,
                spaceName: space.name,
                email: email,
              })
            );
          }

          // Load assets for this space
          await refreshAssets();
        } else {
          console.log("No spaces found for this email");
        }
      } catch (err) {
        console.error("Error checking for existing spaces:", err);
        // Continue with login process even if space check fails
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to login: ${errorMessage}`);
      console.error("Error logging in:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a user space
  const createUserSpace = async (
    email: string,
    spaceName: string
  ): Promise<UserSpace | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/storage/create-space", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, spaceName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create space.");
        return null;
      }

      const newSpace: UserSpace = {
        spaceDid: data.spaceDid,
        spaceName: data.spaceName,
        email: data.email,
      };

      setUserSpace(newSpace);
      setIsInitialized(true);

      // Save space to localStorage
      if (isBrowser) {
        localStorage.setItem("user_space", JSON.stringify(newSpace));
      }

      return newSpace;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to create space: ${errorMessage}`);
      console.error("Error creating space:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload a single file
  const uploadFile = async (
    file: File,
    metadata: AssetMetadata = {}
  ): Promise<StorageResult | null> => {
    if (!isInitialized || !userSpace) {
      setError(
        "Storacha client not initialized. Please create or connect to a space first."
      );
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", userSpace.email);
      formData.append("spaceName", userSpace.spaceName);
      formData.append("spaceDid", userSpace.spaceDid);
      formData.append("metadata", JSON.stringify(metadata));

      // Upload via API
      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to upload file.");
        return null;
      }

      // Create result object
      const result: StorageResult = {
        cid: data.cid,
        metadata: data.metadata,
        url: data.url,
      };

      // Add to stored assets
      const newAsset: FilecoinAsset = {
        id: Date.now(),
        cid: result.cid,
        name: file.name,
        type: file.type,
        size: file.size,
        url: result.url,
        metadata: result.metadata,
        uploadedAt: new Date().toISOString(),
      };

      const updatedAssets = [...storedAssets, newAsset];
      setStoredAssets(updatedAssets);
      saveStoredAssets(updatedAssets);

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to upload file: ${errorMessage}`);
      console.error("Error uploading file:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload multiple files
  const uploadFiles = async (
    files: File[],
    metadata: AssetMetadata = {}
  ): Promise<StorageResults | null> => {
    if (!isInitialized || !userSpace) {
      setError(
        "Storacha client not initialized. Please create or connect to a space first."
      );
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const uploadPromises = files.map((file) => uploadFile(file, metadata));
      const results = await Promise.all(uploadPromises);

      // Check if any upload failed
      if (results.some((result) => result === null)) {
        setError("One or more files failed to upload");
        return null;
      }

      // Create result object with all URLs
      const firstResult = results[0];
      if (!firstResult) return null;

      return {
        cid: firstResult.cid,
        metadata: firstResult.metadata,
        urls: results.map((r) => r!.url),
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to upload files: ${errorMessage}`);
      console.error("Error uploading files:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify an asset exists on IPFS
  const verifyAsset = async (asset: FilecoinAsset): Promise<boolean> => {
    if (!isInitialized || !userSpace) {
      return false;
    }

    try {
      const response = await fetch("/api/storage/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cid: asset.cid,
          filename: asset.name,
          spaceDid: userSpace.spaceDid,
        }),
      });

      const data = await response.json();
      return data.verified === true;
    } catch (err) {
      console.error("Error verifying asset:", err);
      return false;
    }
  };

  // Refresh assets list with retry logic
  const refreshAssets = async (): Promise<void> => {
    if (!isInitialized || !userSpace) {
      console.log("Cannot refresh assets: Not initialized or no user space");
      return;
    }

    setIsLoading(true);
    try {
      console.log(
        `Refreshing assets for space: ${userSpace.spaceName} (${userSpace.spaceDid})`
      );

      // Reset cursor for new fetch
      setCurrentCursor("");

      // Using cursor-based pagination as per Storacha docs
      let allAssets: FilecoinAsset[] = [];

      // Implement retry logic with exponential backoff
      const maxRetries = 3;
      let retryCount = 0;
      let retryDelay = 1000; // Start with 1 second delay
      let success = false;
      let lastError: Error | null = null;

      while (retryCount < maxRetries && !success) {
        try {
          // If this is a retry, log it
          if (retryCount > 0) {
            console.log(
              `Retry attempt ${retryCount} after ${retryDelay}ms delay...`
            );
          }

          // Make the API request
          const response = await fetch("/api/storage/list", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              spaceDid: userSpace.spaceDid,
              email: userSpace.email,
              cursor: "",
              size: 25, // Get 25 items per page as recommended in docs
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch assets");
          }

          const data = await response.json();

          if (data.assets && Array.isArray(data.assets)) {
            allAssets = data.assets;
            // Store cursor for loadMoreAssets
            setCurrentCursor(data.cursor || "");
            console.log(
              `Retrieved ${data.assets.length} assets from API, nextCursor: ${
                data.cursor || "none"
              }`
            );
            success = true;
          } else {
            console.warn("No assets found or invalid response format");
            // If we got a response but with no assets, still consider it a success
            // This is better than retrying when there simply are no assets
            success = true;
            allAssets = [];
          }
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`Attempt ${retryCount + 1} failed:`, lastError);

          // Only retry if it seems like a network error
          if (
            lastError.message.includes("network") ||
            lastError.message.includes("timeout") ||
            lastError.message.includes("fetch failed")
          ) {
            retryCount++;
            if (retryCount < maxRetries) {
              // Wait with exponential backoff before retrying
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
              retryDelay *= 2; // Double the delay for next retry
            }
          } else {
            // Not a network error, don't retry
            break;
          }
        }
      }

      if (!success && lastError) {
        throw lastError;
      }

      console.log(`Retrieved total of ${allAssets.length} assets from API`);
      setStoredAssets(allAssets);
      saveStoredAssets(allAssets);
      console.log("Assets refreshed successfully");
    } catch (err) {
      console.error("Error refreshing assets:", err);
      setError(
        `Failed to load assets: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      // Fall back to localStorage
      loadAssetsFromStorage();
    } finally {
      setIsLoading(false);
    }
  };

  // Load more assets using the current cursor with retry logic
  const loadMoreAssets = async (): Promise<boolean> => {
    if (!isInitialized || !userSpace || !currentCursor) {
      console.log(
        "Cannot load more assets: Not initialized, no user space, or no cursor"
      );
      return false;
    }

    setIsLoading(true);
    try {
      console.log(
        `Loading more assets for space: ${userSpace.spaceName} (${userSpace.spaceDid}) with cursor: ${currentCursor}`
      );

      // Implement retry logic with exponential backoff
      const maxRetries = 3;
      let retryCount = 0;
      let retryDelay = 1000; // Start with 1 second delay
      let success = false;
      let lastError: Error | null = null;
      let data: any = null;

      while (retryCount < maxRetries && !success) {
        try {
          // If this is a retry, log it
          if (retryCount > 0) {
            console.log(
              `Retry attempt ${retryCount} after ${retryDelay}ms delay...`
            );
          }

          const response = await fetch("/api/storage/list", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              spaceDid: userSpace.spaceDid,
              email: userSpace.email,
              cursor: currentCursor,
              size: 25, // Get 25 items per page as recommended in docs
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to fetch assets");
          }

          data = await response.json();
          success = true;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`Attempt ${retryCount + 1} failed:`, lastError);

          // Only retry if it seems like a network error
          if (
            lastError.message.includes("network") ||
            lastError.message.includes("timeout") ||
            lastError.message.includes("fetch failed")
          ) {
            retryCount++;
            if (retryCount < maxRetries) {
              // Wait with exponential backoff before retrying
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
              retryDelay *= 2; // Double the delay for next retry
            }
          } else {
            // Not a network error, don't retry
            break;
          }
        }
      }

      if (!success) {
        if (lastError) throw lastError;
        return false;
      }

      if (data.assets && Array.isArray(data.assets)) {
        console.log(`Retrieved ${data.assets.length} more assets from API`);

        // Update cursor for next load
        setCurrentCursor(data.cursor || "");

        // Add new assets to the existing ones
        const updatedAssets = [...storedAssets, ...data.assets];
        setStoredAssets(updatedAssets);
        saveStoredAssets(updatedAssets);

        console.log("Additional assets loaded successfully");
        return !!data.cursor; // Return true if there are more assets to load
      } else {
        console.warn("No additional assets found or invalid response format");
        return false;
      }
    } catch (err) {
      console.error("Error loading more assets:", err);
      setError(
        `Failed to load more assets: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setIsInitialized(false);
    setUserSpace(null);
    localStorage.removeItem("user_space");
  };

  // Switch to a different space
  const switchSpace = async (
    spaceDid: string,
    email: string,
    spaceName: string
  ): Promise<boolean> => {
    if (!spaceDid || !email || !spaceName) {
      setError("Space information is incomplete");
      return false;
    }

    setIsLoading(true);
    try {
      console.log(`Switching to space: ${spaceName} (${spaceDid})`);

      // Use the switch-space API endpoint
      const response = await fetch("/api/storage/switch-space", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spaceDid,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to switch space");
      }

      // Update state with the new space
      const newSpace: UserSpace = {
        spaceDid,
        spaceName,
        email,
      };

      setUserSpace(newSpace);
      setIsInitialized(true);

      // Save to localStorage
      if (isBrowser) {
        localStorage.setItem("user_space", JSON.stringify(newSpace));
      }

      // Load assets for the new space
      await refreshAssets();

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to switch space: ${errorMessage}`);
      console.error("Error switching space:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Add the implementation for getAvailableSpaces
  const getAvailableSpaces = async (
    email: string,
    cursor: string = ""
  ): Promise<{
    spaces: Array<{ did: string; name: string }>;
    cursor?: string;
  }> => {
    if (!email) {
      return { spaces: [] };
    }

    try {
      const response = await fetch("/api/storage/list-spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          cursor,
          size: 25,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch spaces");
      }

      const data = await response.json();
      if (data.success && data.spaces && Array.isArray(data.spaces)) {
        return {
          spaces: data.spaces,
          cursor: data.cursor,
        };
      }
      return { spaces: [] };
    } catch (err) {
      console.error("Error fetching spaces:", err);
      return { spaces: [] };
    }
  };

  // Context value
  const value: FilecoinContextType = {
    isInitialized,
    isLoading: isLoading || isLoadingInitial,
    error,
    userSpace,
    storedAssets,
    agentDid,
    createUserSpace,
    loginWithEmail,
    uploadFile,
    uploadFiles,
    verifyAsset,
    refreshAssets,
    loadMoreAssets,
    getAvailableSpaces,
    checkLoginStatus,
    logout,
    switchSpace,
  };

  return (
    <FilecoinContext.Provider value={value}>
      {children}
    </FilecoinContext.Provider>
  );
}
