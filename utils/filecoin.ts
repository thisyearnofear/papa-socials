/**
 * Storacha Network (previously Filecoin/IPFS) storage integration utility
 * Browser-compatible implementation for artist archive
 */

// We'll use dynamic imports to avoid SSR issues
// Types for our utility functions
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

// Store client and space globally but populated only in browser
let client: any = null;
let space: any = null;

/**
 * Initialize the Storacha client - browser compatible
 * @param {string} email - Email address for Storacha account
 * @param {string} spaceName - Name of the space to use
 */
export async function initializeStorage(
  email: string,
  spaceName: string
): Promise<any | null> {
  // Skip on server
  if (typeof window === "undefined") {
    console.log("Skipping Storacha initialization on server");
    return null;
  }

  if (!email || !spaceName) {
    console.warn(
      "Email and space name are required for Storacha initialization"
    );
    return null;
  }

  try {
    // Load the client library dynamically to avoid SSR issues
    console.log("Loading w3up-client...");

    // Use dynamic import to load the client
    let Client;
    try {
      Client = await import("@web3-storage/w3up-client");
      console.log("w3up-client loaded successfully");
    } catch (e) {
      console.error("Failed to load w3up-client:", e);
      return null;
    }

    // Create client with browser storage
    console.log("Creating Storacha client...");
    client = await Client.create();
    console.log("Storacha client created:", client.agent.did());

    // Check if there's already a space in the client
    try {
      const spaces = await client.spaces();
      console.log(`Found ${spaces.length} spaces`);

      // Find space with matching name
      if (spaces.length > 0) {
        for (const s of spaces) {
          try {
            if (s.name() === spaceName) {
              space = s;
              console.log(
                `Using existing space: ${spaceName} (${space.did()})`
              );
              await client.setCurrentSpace(space.did());
              return client;
            }
          } catch (err) {
            console.warn("Error checking space name:", err);
          }
        }
      }
    } catch (e) {
      console.log("No existing spaces found or error fetching spaces:", e);
    }

    // Start login process with email
    console.log(`Starting login process for ${email}...`);
    try {
      // This will send an email to the user
      await client.login(email);
      console.log("Login email sent and verified");
    } catch (e: any) {
      console.error("Login failed:", e);
      throw new Error(
        `Login failed. Please check your email and verify the link. ${e.message}`
      );
    }

    // Now ensure the account has a payment plan
    try {
      const accounts = await client.accounts();
      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("Checking payment plan...");
        await account.plan.wait();
        console.log("Payment plan verified");
      } else {
        console.warn("No accounts found after login");
      }
    } catch (e: any) {
      console.error("Error checking payment plan:", e);
    }

    // Create a new space
    console.log(`Creating space: ${spaceName}...`);
    try {
      // Try to reuse existing account
      const accounts = await client.accounts();
      const account = accounts.length > 0 ? accounts[0] : undefined;

      // Create the space with the account for recovery
      space = await client.createSpace(spaceName, { account });
      console.log(`Space created: ${space.did()}`);

      // Register the space
      console.log("Registering space...");
      await space.register();
      console.log("Space registered successfully");

      // Set as current space
      await client.setCurrentSpace(space.did());
      console.log(`Set current space to: ${space.did()}`);
    } catch (e: any) {
      console.error("Error creating/registering space:", e);
      throw new Error(`Failed to create or register space: ${e.message}`);
    }

    return client;
  } catch (error) {
    console.error("Storacha initialization error:", error);
    throw error;
  }
}

/**
 * Get the Storacha client or initialize it
 */
export async function getStorageClient(): Promise<any | null> {
  // Skip on server
  if (typeof window === "undefined") {
    return null;
  }

  if (!client || !space) {
    const email = process.env.NEXT_PUBLIC_STORACHA_EMAIL;
    const spaceName = process.env.NEXT_PUBLIC_STORACHA_SPACE_NAME;

    if (!email || !spaceName) {
      console.error("Storacha environment variables missing");
      return null;
    }

    try {
      return await initializeStorage(email, spaceName);
    } catch (error) {
      console.error("Failed to initialize storage client:", error);
      return null;
    }
  }

  return client;
}

/**
 * Store a file on Storacha
 */
export async function storeFile(
  file: File | Blob,
  metadata: AssetMetadata = {}
): Promise<StorageResult> {
  // Skip on server
  if (typeof window === "undefined") {
    throw new Error("storeFile can only be called in browser environment");
  }

  try {
    const storageClient = await getStorageClient();
    if (!storageClient || !space) {
      throw new Error(
        "Storage client not initialized. Please check your configuration."
      );
    }

    // Create a File object if needed
    const fileToStore =
      file instanceof File
        ? file
        : new File([file], metadata.name || "file", {
            type: metadata.type || "application/octet-stream",
          });

    // Create metadata file
    const metadataFile = new File(
      [
        JSON.stringify({
          ...metadata,
          name: fileToStore.name,
          type: fileToStore.type,
          size: fileToStore.size,
          lastModified:
            fileToStore instanceof File ? fileToStore.lastModified : Date.now(),
          timestamp: Date.now(),
        }),
      ],
      "metadata.json",
      { type: "application/json" }
    );

    console.log(`Uploading file: ${fileToStore.name}...`);

    // Prepare directory upload with both files
    const files = [fileToStore, metadataFile];
    const dirName = `${metadata.name || fileToStore.name}-${Date.now()}`;

    // Upload the directory
    console.log(`Creating directory: ${dirName} with ${files.length} files`);
    const directoryCid = await storageClient.uploadDirectory(files);
    const cid = directoryCid.toString();
    console.log(`Upload complete with CID: ${cid}`);

    // Generate gateway URL
    const url = `https://w3s.link/ipfs/${cid}/${encodeURIComponent(
      fileToStore.name
    )}`;
    console.log(`Gateway URL: ${url}`);

    return {
      cid,
      metadata: {
        ...metadata,
        name: fileToStore.name,
        type: fileToStore.type,
        size: fileToStore.size,
      },
      url,
    };
  } catch (error) {
    console.error("Error storing file on Storacha:", error);
    throw error;
  }
}

/**
 * Store multiple files on Storacha
 */
export async function storeFiles(
  files: File[],
  metadata: AssetMetadata = {}
): Promise<StorageResults> {
  // Skip on server
  if (typeof window === "undefined") {
    throw new Error("storeFiles can only be called in browser environment");
  }

  try {
    const storageClient = await getStorageClient();
    if (!storageClient || !space) {
      throw new Error(
        "Storage client not initialized. Please check your configuration."
      );
    }

    // Create a metadata file
    const metadataFile = new File(
      [
        JSON.stringify({
          ...metadata,
          files: files.map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
          })),
          timestamp: Date.now(),
        }),
      ],
      "metadata.json",
      { type: "application/json" }
    );

    console.log(`Uploading ${files.length} files...`);

    // Prepare all files including metadata
    const allFiles = [...files, metadataFile];
    const dirName = metadata.name || `upload-${Date.now()}`;

    // Upload the directory
    console.log(`Creating directory: ${dirName} with ${allFiles.length} files`);
    const directoryCid = await storageClient.uploadDirectory(allFiles);
    const cid = directoryCid.toString();
    console.log(`Upload complete with CID: ${cid}`);

    // Generate gateway URLs for each file
    const urls = files.map(
      (file) => `https://w3s.link/ipfs/${cid}/${encodeURIComponent(file.name)}`
    );

    return {
      cid,
      metadata: {
        ...metadata,
        files: files.map((file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
        })),
      },
      urls,
    };
  } catch (error) {
    console.error("Error storing files on Storacha:", error);
    throw error;
  }
}

/**
 * Retrieve metadata for a stored item
 */
export async function retrieveMetadata(cid: string): Promise<AssetMetadata> {
  try {
    const url = `https://w3s.link/ipfs/${cid}/metadata.json`;
    console.log(`Fetching metadata from: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Failed to retrieve metadata: ${res.status} ${res.statusText}`
      );
    }

    return await res.json();
  } catch (error) {
    console.error("Error retrieving metadata from Storacha:", error);
    throw error;
  }
}

/**
 * Verify that a file exists on IPFS
 */
export async function verifyStorage(
  cid: string,
  filename?: string
): Promise<boolean> {
  try {
    const url = filename
      ? `https://w3s.link/ipfs/${cid}/${encodeURIComponent(filename)}`
      : `https://w3s.link/ipfs/${cid}/`;

    console.log(`Verifying storage at: ${url}`);
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch (error) {
    console.error("Error verifying storage on Storacha:", error);
    return false;
  }
}
