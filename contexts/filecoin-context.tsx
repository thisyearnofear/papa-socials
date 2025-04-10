import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define asset metadata interface
export interface AssetMetadata {
  [key: string]: any;
  name?: string;
  type?: string;
  size?: number;
  lastModified?: number;
  timestamp?: number;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

// Define storage result interfaces
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

// Define FilecoinAsset interface
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

// Define context type
interface FilecoinContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  storedAssets: FilecoinAsset[];
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [storedAssets, setStoredAssets] = useState<FilecoinAsset[]>([]);
  const [spaceDid, setSpaceDid] = useState<string>("");

  // Load stored assets on mount and initialize
  useEffect(() => {
    if (!isBrowser) {
      console.log("Skipping FilecoinProvider initialization in SSR context");
      return;
    }

    console.log("FilecoinProvider initializing in browser context...");

    try {
      loadStoredAssets();

      // Attempt to initialize on mount
      const initializeOnMount = async () => {
        const initialized = await initializeStorage();
        console.log("Initialization result:", initialized);
      };

      initializeOnMount().catch((err) => {
        console.error("Error during initialization:", err);
      });
    } catch (error) {
      console.error("Error in FilecoinProvider useEffect:", error);
    }
  }, [isBrowser]);

  // Initialize storage via API
  const initializeStorage = async (): Promise<boolean> => {
    if (isInitialized) return true;

    setIsLoading(true);
    setError(null);

    try {
      const email = process.env.NEXT_PUBLIC_STORACHA_EMAIL;
      const spaceName = process.env.NEXT_PUBLIC_STORACHA_SPACE_NAME;

      if (!email || !spaceName) {
        setError(
          "Storacha configuration not found. Please check your environment variables."
        );
        return false;
      }

      console.log("Initializing with email:", email, "and space:", spaceName);

      const response = await fetch("/api/storage/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, spaceName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to initialize storage.");
        return false;
      }

      setSpaceDid(data.spaceDid || "");
      setIsInitialized(true);
      console.log(
        "Storage initialized successfully with spaceDid:",
        data.spaceDid
      );
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to initialize storage: ${errorMessage}`);
      console.error("Error initializing storage:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load stored assets from localStorage
  const loadStoredAssets = () => {
    if (!isBrowser) return;

    try {
      const savedAssets = localStorage.getItem("filecoin_assets");
      if (savedAssets) {
        setStoredAssets(JSON.parse(savedAssets));
        console.log("Loaded stored assets from localStorage");
      }
    } catch (err) {
      console.error("Error loading stored assets:", err);
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

  // Upload a single file
  const uploadFile = async (
    file: File,
    metadata: AssetMetadata = {}
  ): Promise<StorageResult | null> => {
    // Ensure storage is initialized
    if (!isInitialized) {
      const initialized = await initializeStorage();
      if (!initialized) {
        return null;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", process.env.NEXT_PUBLIC_STORACHA_EMAIL || "");
      formData.append(
        "spaceName",
        process.env.NEXT_PUBLIC_STORACHA_SPACE_NAME || ""
      );
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
    // For simplicity, we'll upload files one by one
    // In a real application, you might want to modify the API to handle multiple files
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
    try {
      const response = await fetch("/api/storage/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cid: asset.cid,
          filename: asset.name,
        }),
      });

      const data = await response.json();
      return data.verified === true;
    } catch (err) {
      console.error("Error verifying asset:", err);
      return false;
    }
  };

  // Refresh assets list
  const refreshAssets = async (): Promise<void> => {
    loadStoredAssets();
  };

  // Context value
  const value: FilecoinContextType = {
    isInitialized,
    isLoading,
    error,
    storedAssets,
    uploadFile,
    uploadFiles,
    verifyAsset,
    refreshAssets,
  };

  return (
    <FilecoinContext.Provider value={value}>
      {children}
    </FilecoinContext.Provider>
  );
}
