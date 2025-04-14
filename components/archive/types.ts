export interface AssetMetadata {
  title?: string;
  description?: string;
  creator?: string;
  date?: string;
  type?: string;
  tags?: string[];
  size?: number;
  version?: string;
  license?: string;
  location?: string;
  customFields?: Record<string, string>;
  name?: string;
  alternativeUrl?: string;
  gateway?: string;
  timestamp?: string;
}

export interface Asset {
  cid: string;
  size?: number;
  metadata?: AssetMetadata;
  added?: string; // ISO date string when the asset was added
  lastAccessed?: string; // ISO date string when the asset was last accessed
}

export interface UploadStatus {
  status: "loading" | "success" | "error" | "info";
  message: string;
}

export interface UserSpace {
  id: string;
  name: string;
  owner: string;
}

export interface SpaceConnectionStatus {
  isConnected: boolean;
  currentSpace: UserSpace | null;
  availableSpaces: UserSpace[];
}
