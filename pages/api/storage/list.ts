import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message: string;
  assets?: Record<string, unknown>[];
  cursor?: string;
};

interface UploadObject {
  cid?: { toString(): string };
  uploadedAt?: string;
  created?: string;
  timestamp?: string;
  root?: { toString(): string } | string;
  name?: string;
  filename?: string;
  path?: string;
  size?: number;
  metadata?: {
    name?: string;
    type?: string;
    size?: number;
    [key: string]: unknown;
  };
  meta?: {
    name?: string;
    type?: string;
    size?: number;
    [key: string]: unknown;
  };
  properties?: {
    name?: string;
    type?: string;
    size?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Define metadata interface
interface FileMetadata {
  name?: string;
  type?: string;
  contentType?: string;
  size?: number;
  timestamp?: string;
  [key: string]: unknown;
}

// Type for the Storacha client with looser typing to handle unknown methods
interface AnyClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * API endpoint to list stored assets from a user's Storacha space
 * POST /api/storage/list
 *
 * Request body:
 * {
 *   spaceDid: string; // DID of the space
 *   email: string; // Email associated with the space
 *   cursor?: string; // Optional cursor for pagination
 *   size?: number; // Optional page size (default: 25)
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { spaceDid, email, cursor = "", size = 25 } = req.body;

    if (!spaceDid || !email) {
      return res.status(400).json({
        success: false,
        message: "spaceDid and email are required",
      });
    }

    // Create client
    console.log(`Creating Storacha client for ${email}...`);
    const client = await create();
    // Cast to a more flexible type for runtime method checks
    const anyClient = client as unknown as AnyClient;
    console.log("Client created successfully");

    // Login with email
    console.log("Starting login process...");
    await client.login(email);
    console.log("Login successful");

    // Get spaces
    const spaces = await client.spaces();
    console.log(`Found ${spaces.length} spaces`);

    // Find matching space by DID
    let space = null;
    for (const s of spaces) {
      try {
        if (s.did() === spaceDid) {
          space = s;
          console.log(`Found space with DID: ${spaceDid}`);
          break;
        }
      } catch (err) {
        console.warn("Error checking space DID:", err);
      }
    }

    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    // Cast space to any to allow for dynamic property access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spaceAny = space as any;

    // Set as current space
    await client.setCurrentSpace(space.did());
    console.log(`Set current space to: ${space.did()}`);

    // Get all uploads
    const uploads = [];
    let nextCursor = "";
    try {
      console.log("Attempting to list uploads using the Storacha API...");
      console.log(`Using cursor: ${cursor}, size: ${size}`);

      // First, try the uploadList() method which is the most recent API
      let listResp: UploadObject[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let listResult: any = null;

      try {
        // Check if the client has the uploadList method (newer versions)
        if (typeof anyClient.uploadList === "function") {
          console.log("Using client.uploadList() method");
          listResult = await anyClient.uploadList({ cursor, size });
          listResp = listResult?.uploads || [];
          nextCursor = listResult?.cursor || "";
        }
        // Check if the client has the capability.upload.list method
        else if (
          anyClient.capability &&
          anyClient.capability.upload &&
          typeof anyClient.capability.upload.list === "function"
        ) {
          console.log("Using client.capability.upload.list() method");
          listResult = await anyClient.capability.upload.list({ cursor, size });
          listResp = listResult?.uploads || listResult || [];
          nextCursor = listResult?.cursor || "";
        }
        // Check if the space object has a list/uploads method
        else if (spaceAny && typeof spaceAny.list === "function") {
          console.log("Using space.list() method");
          listResult = await spaceAny.list({ cursor, size });
          listResp = listResult?.uploads || listResult || [];
          nextCursor = listResult?.cursor || "";
        } else if (spaceAny && typeof spaceAny.uploads === "function") {
          console.log("Using space.uploads() method");
          listResult = await spaceAny.uploads({ cursor, size });
          listResp = listResult?.uploads || listResult || [];
          nextCursor = listResult?.cursor || "";
        }
        // Try UCan or Store methods which might be available
        else if (
          anyClient.store &&
          typeof anyClient.store.list === "function"
        ) {
          console.log("Using client.store.list() method");
          listResult = await anyClient.store.list({ cursor, size });
          listResp = listResult?.uploads || listResult || [];
          nextCursor = listResult?.cursor || "";
        }
        // Legacy methods
        else if (typeof anyClient.listUploads === "function") {
          console.log("Using client.listUploads() method (legacy)");
          listResult = await anyClient.listUploads({ cursor, size });
          listResp = listResult?.uploads || listResult || [];
          nextCursor = listResult?.cursor || "";
        } else if (typeof anyClient.list === "function") {
          console.log("Using client.list() method (legacy)");
          listResult = await anyClient.list({ cursor, size });
          listResp = listResult?.uploads || listResult || [];
          nextCursor = listResult?.cursor || "";
        }
        // Final attempt with raw client methods
        else {
          // Try to inspect client structure
          console.log(
            "No standard listing method found, examining client structure..."
          );
          const clientKeys = Object.keys(anyClient);
          console.log("Available client keys:", clientKeys);

          // Look for any object that might have listing capabilities
          for (const key of clientKeys) {
            if (typeof anyClient[key] === "object" && anyClient[key] !== null) {
              const subKeys = Object.keys(anyClient[key]);
              if (
                subKeys.includes("list") &&
                typeof anyClient[key].list === "function"
              ) {
                console.log(
                  `Found potential listing method at client.${key}.list`
                );
                try {
                  listResult = await anyClient[key].list({ cursor, size });
                  listResp = listResult?.uploads || listResult || [];
                  nextCursor = listResult?.cursor || "";
                  if (Array.isArray(listResp) && listResp.length > 0) {
                    console.log(
                      `Successfully listed uploads using client.${key}.list`
                    );
                    break;
                  }
                } catch (e) {
                  console.log(`Error trying client.${key}.list:`, e);
                }
              }
            }
          }

          if (listResp.length === 0) {
            console.log("No listing method found, using empty array");
          }
        }
      } catch (listMethodErr) {
        console.warn("Error calling list method:", listMethodErr);
      }

      console.log(`Found ${listResp.length} uploads`);

      for (const upload of listResp) {
        try {
          console.log("Processing upload:", upload);

          // Get CID - handle different formats
          let cid = "";
          if (upload.cid && typeof upload.cid.toString === "function") {
            cid = upload.cid.toString();
          } else if (upload.cid && typeof upload.cid === "string") {
            cid = upload.cid;
          } else if (
            upload.root &&
            typeof upload.root.toString === "function"
          ) {
            cid = upload.root.toString();
          } else if (upload.root && typeof upload.root === "string") {
            cid = upload.root;
          }

          if (!cid) {
            console.warn("Could not determine CID for upload, skipping");
            continue;
          }

          console.log(`Found upload with CID: ${cid}`);

          // Try to get filename/path from upload object
          let filename = "";
          if (upload.name) {
            filename = upload.name;
          } else if (upload.filename) {
            filename = upload.filename;
          } else if (upload.path) {
            filename = upload.path;
          }

          // Generate URLs using different formats
          // The modern subdomain format
          let url = `https://${cid}.ipfs.w3s.link`;
          if (filename) {
            url += `/${encodeURIComponent(filename)}`;
          }

          // Alternative path format
          const alternativeUrl = `https://w3s.link/ipfs/${cid}${
            filename ? `/${encodeURIComponent(filename)}` : ""
          }`;

          const uploadTime =
            upload.uploadedAt ||
            upload.created ||
            upload.timestamp ||
            new Date().toISOString();

          // Try to get metadata from different places in the response
          let metadata: FileMetadata = {};
          if (upload.metadata && typeof upload.metadata === "object") {
            metadata = upload.metadata as FileMetadata;
          } else if (upload.meta && typeof upload.meta === "object") {
            metadata = upload.meta as FileMetadata;
          } else if (
            upload.properties &&
            typeof upload.properties === "object"
          ) {
            metadata = upload.properties as FileMetadata;
          }

          // Try to determine type based on filename or metadata
          let fileType = "application/octet-stream";
          if (metadata.type) {
            fileType = metadata.type;
          } else if (metadata.contentType) {
            fileType = metadata.contentType;
          } else if (filename) {
            const extension = filename.split(".").pop()?.toLowerCase();
            if (extension) {
              if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
                fileType = `image/${extension === "jpg" ? "jpeg" : extension}`;
              } else if (["mp3", "wav", "ogg"].includes(extension)) {
                fileType = `audio/${extension}`;
              } else if (["mp4", "webm", "mov"].includes(extension)) {
                fileType = `video/${extension}`;
              } else if (["pdf"].includes(extension)) {
                fileType = "application/pdf";
              }
            }
          }

          // Create enriched metadata
          const enrichedMetadata = {
            ...metadata,
            name: metadata.name || filename || cid,
            type: metadata.type || fileType,
            size: metadata.size || upload.size || 0,
            timestamp: uploadTime,
            alternativeUrl,
            gateway: "w3s.link",
          };

          uploads.push({
            id: Date.now() + Math.random(),
            cid,
            name: enrichedMetadata.name,
            type: enrichedMetadata.type,
            size: enrichedMetadata.size || 0,
            url,
            metadata: enrichedMetadata,
            uploadedAt: uploadTime,
          });

          console.log(`Processed upload: ${enrichedMetadata.name}`);
        } catch (uploadErr) {
          console.warn("Error processing upload:", uploadErr);
        }
      }
    } catch (listErr) {
      console.warn("Error listing uploads:", listErr);
      // Even if listing fails, we'll return success with an empty array
    }

    return res.status(200).json({
      success: true,
      message: `Retrieved ${uploads.length} assets`,
      assets: uploads,
      cursor: nextCursor,
    });
  } catch (error) {
    console.error("Error listing assets:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      success: false,
      message: `Error: ${errorMessage}`,
    });
  }
}
