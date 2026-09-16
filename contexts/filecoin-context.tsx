import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { StorageClient, immutable } from "@lens-chain/storage-client";
import { chains } from "@lens-chain/sdk/viem";

// Grove chain — testnet (37111) for dev, override via env for mainnet (232)
const GROVE_CHAIN_ID =
  Number(process.env.NEXT_PUBLIC_GROVE_CHAIN_ID) || chains.testnet.id;

// --- Types kept for backward compat ---
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
  cid: string; // Grove storageKey
  metadata: AssetMetadata;
  url: string; // gatewayUrl
  uri?: string; // lens:// uri
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
  uri?: string;
}

export interface UserSpace {
  spaceDid: string;
  spaceName: string;
  email: string;
}

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

const FilecoinContext = createContext<FilecoinContextType | undefined>(
  undefined
);

export function useFilecoin() {
  const context = useContext(FilecoinContext);
  if (context === undefined) {
    throw new Error("useFilecoin must be used within a FilecoinProvider");
  }
  return context;
}

interface FilecoinProviderProps {
  children: ReactNode;
}

// Singleton Grove client — no auth needed for immutable
let groveClient: ReturnType<typeof StorageClient.create> | null = null;
function getGroveClient() {
  if (!groveClient) groveClient = StorageClient.create();
  return groveClient;
}

const GROVE_ASSETS_KEY = "grove_assets";
const GROVE_SPACE_KEY = "grove_space";

export function FilecoinProvider({ children }: FilecoinProviderProps) {
  const isBrowser = typeof window !== "undefined";

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [storedAssets, setStoredAssets] = useState<FilecoinAsset[]>([]);
  const [userSpace, setUserSpace] = useState<UserSpace | null>(null);
  const [agentDid] = useState<string | null>(`grove:${GROVE_CHAIN_ID}`);

  // Init: Grove is immediate — no email/space ceremony
  useEffect(() => {
    if (!isBrowser) return;
    try {
      getGroveClient();
      const saved = localStorage.getItem(GROVE_ASSETS_KEY);
      if (saved) setStoredAssets(JSON.parse(saved));
      const savedSpace = localStorage.getItem(GROVE_SPACE_KEY);
      if (savedSpace) {
        setUserSpace(JSON.parse(savedSpace));
      } else {
        // Provide a default pseudo-space so existing UI (Browse/Upload) works without login
        const defaultSpace: UserSpace = {
          spaceDid: `grove:immutable:${GROVE_CHAIN_ID}`,
          spaceName: "Grove Archive",
          email: "grove@lens.xyz",
        };
        setUserSpace(defaultSpace);
        localStorage.setItem(GROVE_SPACE_KEY, JSON.stringify(defaultSpace));
      }
      setIsInitialized(true);
    } catch (e) {
      console.error("Grove init failed", e);
      setError("Failed to initialize Grove client");
    } finally {
      setIsLoading(false);
    }
  }, [isBrowser]);

  const persistAssets = (assets: FilecoinAsset[]) => {
    if (!isBrowser) return;
    localStorage.setItem(GROVE_ASSETS_KEY, JSON.stringify(assets));
  };

  // Stubs kept for backward compat — Grove immutable needs no email verification
  const loginWithEmail = async (email: string): Promise<boolean> => {
    const space: UserSpace = {
      spaceDid: `grove:immutable:${GROVE_CHAIN_ID}`,
      spaceName: "Grove Archive",
      email: email || "grove@lens.xyz",
    };
    setUserSpace(space);
    if (isBrowser) localStorage.setItem(GROVE_SPACE_KEY, JSON.stringify(space));
    setIsInitialized(true);
    return true;
  };

  const createUserSpace = async (
    email: string,
    spaceName: string
  ): Promise<UserSpace | null> => {
    const space: UserSpace = {
      spaceDid: `grove:immutable:${GROVE_CHAIN_ID}:${spaceName}`,
      spaceName,
      email,
    };
    setUserSpace(space);
    if (isBrowser) localStorage.setItem(GROVE_SPACE_KEY, JSON.stringify(space));
    setIsInitialized(true);
    return space;
  };

  const switchSpace = async (
    spaceDid: string,
    email: string,
    spaceName: string
  ): Promise<boolean> => {
    const space: UserSpace = { spaceDid, email, spaceName };
    setUserSpace(space);
    if (isBrowser) localStorage.setItem(GROVE_SPACE_KEY, JSON.stringify(space));
    return true;
  };

  const getAvailableSpaces = async (
    _email: string,
    _cursor?: string
  ): Promise<{ spaces: Array<{ did: string; name: string }>; cursor?: string }> => {
    // Grove immutable has no spaces — return the single pseudo-space
    return {
      spaces: [
        { did: `grove:immutable:${GROVE_CHAIN_ID}`, name: "Grove Archive" },
      ],
    };
  };

  const checkLoginStatus = async (): Promise<boolean> => true;
  const logout = () => {
    // Keep assets, reset space to default
    const defaultSpace: UserSpace = {
      spaceDid: `grove:immutable:${GROVE_CHAIN_ID}`,
      spaceName: "Grove Archive",
      email: "grove@lens.xyz",
    };
    setUserSpace(defaultSpace);
    if (isBrowser) localStorage.setItem(GROVE_SPACE_KEY, JSON.stringify(defaultSpace));
  };

  const uploadFile = async (
    file: File,
    metadata: AssetMetadata = {}
  ): Promise<StorageResult | null> => {
    if (!isInitialized) {
      setError("Grove client not initialized");
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const client = getGroveClient();
      const acl = immutable(GROVE_CHAIN_ID);
      // Grove handles files up to 125MB
      if (file.size > 125 * 1024 * 1024) {
        throw new Error("File exceeds Grove 125MB limit");
      }
      const res = await client.uploadFile(file, { acl });
      // Optional: wait for propagation (usually <5s) but don't block UI
      // await res.waitForPropagation();

      const result: StorageResult = {
        cid: res.storageKey,
        url: res.gatewayUrl,
        uri: res.uri,
        metadata,
      };

      const newAsset: FilecoinAsset = {
        id: Date.now(),
        cid: res.storageKey,
        name: file.name,
        type: file.type,
        size: file.size,
        url: res.gatewayUrl,
        uri: res.uri,
        metadata,
        uploadedAt: new Date().toISOString(),
      };
      const updated = [...storedAssets, newAsset];
      setStoredAssets(updated);
      persistAssets(updated);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Grove upload failed: ${msg}`);
      console.error("Grove upload error", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFiles = async (
    files: File[],
    metadata: AssetMetadata = {}
  ): Promise<StorageResults | null> => {
    setIsLoading(true);
    try {
      const results: StorageResult[] = [];
      for (const f of files) {
        const r = await uploadFile(f, metadata);
        if (!r) throw new Error(`Failed to upload ${f.name}`);
        results.push(r);
      }
      return {
        cid: results[0].cid,
        metadata: results[0].metadata,
        urls: results.map((r) => r.url),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Batch upload failed: ${msg}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAsset = async (asset: FilecoinAsset): Promise<boolean> => {
    try {
      const res = await fetch(asset.url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  };

  const refreshAssets = async (): Promise<void> => {
    if (!isBrowser) return;
    setIsLoading(true);
    try {
      const saved = localStorage.getItem(GROVE_ASSETS_KEY);
      if (saved) setStoredAssets(JSON.parse(saved));
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreAssets = async (): Promise<boolean> => false;

  const value: FilecoinContextType = {
    isInitialized,
    isLoading,
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
    <FilecoinContext.Provider value={value}>{children}</FilecoinContext.Provider>
  );
}
