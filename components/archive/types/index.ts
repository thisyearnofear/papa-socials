export interface Asset {
  cid: string;
  size: number;
  metadata: AssetMetadata;
  added: string;
  lastAccessed: string;
}

export interface AssetMetadata {
  title?: string;
  description?: string;
  creator?: string;
  date?: string;
  tags?: string[];
  type?: string;
}

export interface UploadStatus {
  status: "loading" | "success" | "error";
  message: string;
}

// UserSpace interface is now imported directly from filecoin-context
