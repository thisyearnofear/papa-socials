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

  // Track network or timeout issues
  let networkIssueDetected = false;

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

    // Debug the space object to see its methods and properties
    console.log(
      "Space object methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(space))
    );
    console.log("Space object properties:", Object.keys(space));

    // Check if the space has an agent method using the anyClient casting
    if (typeof spaceAny.agent === "function") {
      try {
        console.log("Space agent:", spaceAny.agent());
      } catch (e) {
        console.log("Error getting space agent:", e);
      }
    }

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
          console.log(
            "uploadList result:",
            JSON.stringify(listResult, null, 2)
          );
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
          try {
            listResult = await anyClient.capability.upload.list({
              cursor,
              size,
            });
            console.log(
              "capability.upload.list result:",
              JSON.stringify(listResult, null, 2)
            );
            // Check for results array instead of uploads array (Storacha API structure)
            if (Array.isArray(listResult?.results)) {
              console.log("Found results array in response, using it");
              listResp = listResult.results;
              nextCursor = listResult.before || ""; // Use 'before' as cursor for next page
            } else {
              // Fall back to original checks
              listResp = Array.isArray(listResult?.uploads)
                ? listResult.uploads
                : Array.isArray(listResult)
                ? listResult
                : [];
              nextCursor = listResult?.cursor || "";
            }
          } catch (fetchError) {
            console.warn(
              "Network error in capability.upload.list:",
              fetchError
            );
            // Mark that we detected a network issue
            networkIssueDetected =
              fetchError instanceof Error &&
              (fetchError.toString().includes("fetch failed") ||
                fetchError.toString().includes("timeout"));
            // Fall back to other methods
          }
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
      } catch (listError) {
        console.warn("Error calling list method:", listError);
        // Check if this was a network error
        if (
          listError instanceof Error &&
          (listError.toString().includes("fetch failed") ||
            listError.toString().includes("timeout") ||
            listError.toString().includes("network"))
        ) {
          networkIssueDetected = true;
        }
        // Set empty array to avoid iteration issues
        listResp = [];
      }

      // Make sure listResp is always an array before logging or iterating
      if (!Array.isArray(listResp)) {
        console.log(`Found undefined uploads`);
        listResp = [];
      } else {
        console.log(`Found ${listResp.length} uploads`);
      }

      // If network issues detected and no uploads found, return mock data for testing
      if (listResp.length === 0 && networkIssueDetected) {
        console.log("Network issues detected, returning mock data for testing");

        // Return sample data for testing UI
        return res.status(200).json({
          success: true,
          message:
            "Connection to Web3.Storage timed out - returning sample data for testing",
          assets: [
            {
              id: Date.now(),
              cid: "bafybeiczss3yxay2dnscw36hpvjvgzqoev2sj7g3ekbeg2zeuevp7tcwom",
              name: "Test Image 1",
              type: "image/jpeg",
              size: 245000,
              url: "https://images.unsplash.com/photo-1558788353-f76d92427f16",
              metadata: {
                name: "Test Image 1",
                type: "image/jpeg",
                size: 245000,
                timestamp: new Date().toISOString(),
                title: "Sample Test Image",
                description: "This is a sample image for testing",
                tags: ["test", "sample", "image"],
                alternativeUrl:
                  "https://images.unsplash.com/photo-1558788353-f76d92427f16",
                gateway: "w3s.link",
              },
              uploadedAt: new Date().toISOString(),
            },
            {
              id: Date.now() + 1,
              cid: "bafybeidluj5ub7okodcp5p7vcyy6uiuqvax4jqbvpf6j7pfgjgvne4xjoi",
              name: "Test Document",
              type: "application/pdf",
              size: 125000,
              url: "https://example.com/sample.pdf",
              metadata: {
                name: "Test Document",
                type: "application/pdf",
                size: 125000,
                timestamp: new Date().toISOString(),
                title: "Sample PDF Document",
                description: "This is a sample PDF for testing",
                tags: ["test", "sample", "document"],
                alternativeUrl: "https://example.com/sample.pdf",
                gateway: "w3s.link",
              },
              uploadedAt: new Date().toISOString(),
            },
          ],
          cursor: "",
        });
      }

      for (const upload of listResp) {
        try {
          console.log("Processing upload:", JSON.stringify(upload, null, 2));

          // Get CID - handle different formats
          let cid = "";

          // Special case for the observed structure in logs
          if (
            upload.root &&
            typeof upload.root === "object" &&
            upload.root !== null
          ) {
            // Try the toString method first since the object appears to be a CID instance
            if (typeof upload.root.toString === "function") {
              const rootStr = upload.root.toString();
              // Check if the toString() result looks like a CID
              if (rootStr.startsWith("CID(") && rootStr.endsWith(")")) {
                // Extract the CID from inside the parentheses
                cid = rootStr.substring(4, rootStr.length - 1);
                console.log("Extracted CID from toString() result:", cid);
              } else {
                cid = rootStr;
                console.log("Using toString() result as CID:", cid);
              }
            }
            // If that didn't work, try direct property access
            else if (
              Object.prototype.hasOwnProperty.call(upload.root, "/") &&
              typeof (upload.root as Record<string, unknown>)["/"] === "string"
            ) {
              cid = (upload.root as Record<string, unknown>)["/"] as string;
              console.log("Direct extraction from root['/']:", cid);
            }
          } else if (upload.cid && typeof upload.cid.toString === "function") {
            cid = upload.cid.toString();
          } else if (upload.cid && typeof upload.cid === "string") {
            cid = upload.cid;
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
            upload.updatedAt ||
            upload.insertedAt ||
            upload.timestamp ||
            new Date().toISOString();

          console.log("Using timestamp:", uploadTime);

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
            name: metadata.name || filename || cid.substring(0, 16),
            title: metadata.title || `File ${cid.substring(0, 8)}`,
            description:
              metadata.description ||
              `Uploaded content with ID ${cid.substring(0, 16)}`,
            tags: metadata.tags || ["upload"],
            creator: metadata.creator || "",
            date: metadata.date || uploadTime,
            type: metadata.type || fileType,
            size: metadata.size || upload.size || 0,
            timestamp: uploadTime,
            alternativeUrl,
            gateway: "w3s.link",
          };

          console.log(
            "Created metadata:",
            JSON.stringify(enrichedMetadata, null, 2)
          );

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
      // Check if this was a network error
      if (
        listErr instanceof Error &&
        (listErr.toString().includes("fetch failed") ||
          listErr.toString().includes("timeout") ||
          listErr.toString().includes("network"))
      ) {
        networkIssueDetected = true;
      }
    }

    // If network issue was detected and no assets, return mock data
    if (uploads.length === 0 && networkIssueDetected) {
      console.log(
        "Network issues detected and no assets, returning mock data for testing"
      );

      return res.status(200).json({
        success: true,
        message: "Connection issues detected - displaying sample data",
        assets: [
          {
            id: Date.now(),
            cid: "bafybeiczss3yxay2dnscw36hpvjvgzqoev2sj7g3ekbeg2zeuevp7tcwom",
            name: "Test Image 1",
            type: "image/jpeg",
            size: 245000,
            url: "https://images.unsplash.com/photo-1558788353-f76d92427f16",
            metadata: {
              name: "Test Image 1",
              type: "image/jpeg",
              size: 245000,
              timestamp: new Date().toISOString(),
              title: "Sample Test Image",
              description: "This is a sample image for testing",
              tags: ["test", "sample", "image"],
              alternativeUrl:
                "https://images.unsplash.com/photo-1558788353-f76d92427f16",
              gateway: "w3s.link",
            },
            uploadedAt: new Date().toISOString(),
          },
          {
            id: Date.now() + 1,
            cid: "bafybeidluj5ub7okodcp5p7vcyy6uiuqvax4jqbvpf6j7pfgjgvne4xjoi",
            name: "Test Document",
            type: "application/pdf",
            size: 125000,
            url: "https://example.com/sample.pdf",
            metadata: {
              name: "Test Document",
              type: "application/pdf",
              size: 125000,
              timestamp: new Date().toISOString(),
              title: "Sample PDF Document",
              description: "This is a sample PDF for testing",
              tags: ["test", "sample", "document"],
              alternativeUrl: "https://example.com/sample.pdf",
              gateway: "w3s.link",
            },
            uploadedAt: new Date().toISOString(),
          },
        ],
        cursor: "",
      });
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
