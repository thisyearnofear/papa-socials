import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";
import * as formidable from "formidable";
import fs from "fs";
import path from "path";

// Disable the default body parser to handle form data
export const config = {
  api: {
    bodyParser: false,
  },
};

type ResponseData = {
  success: boolean;
  message: string;
  cid?: string;
  url?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Parse form data with files
 */
const parseForm = async (req: NextApiRequest) => {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>(
    (resolve, reject) => {
      const form = new formidable.IncomingForm({
        keepExtensions: true,
        maxFileSize: 100 * 1024 * 1024, // 100MB limit
      });

      form.parse(
        req,
        (
          err: Error | null,
          fields: formidable.Fields,
          files: formidable.Files
        ) => {
          if (err) return reject(err);
          resolve({ fields, files });
        }
      );
    }
  );
};

/**
 * API endpoint to upload files to Storacha
 * POST /api/storage/upload
 *
 * Form data:
 * - email: Email used for authentication
 * - spaceName: Name of the space
 * - spaceDid: DID of the space
 * - file: File to upload
 * - metadata: JSON string of metadata
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // Parse form data
    const { fields, files } = await parseForm(req);

    const email = fields.email?.[0] || "";
    const spaceName = fields.spaceName?.[0] || "";
    const spaceDid = fields.spaceDid?.[0] || "";
    const metadataStr = fields.metadata?.[0] || "{}";

    // Parse metadata
    let metadata: Record<string, unknown> = {};
    try {
      metadata = JSON.parse(metadataStr);
    } catch {
      console.warn("Failed to parse metadata JSON, using empty object");
    }

    if (!email || !spaceName || !spaceDid) {
      return res.status(400).json({
        success: false,
        message: "Email, spaceName, and spaceDid are required",
      });
    }

    // Get the uploaded file
    const uploadedFile = files.file?.[0];
    if (!uploadedFile) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Create Storacha client and authenticate
    console.log(`Creating Storacha client for ${email}...`);
    const client = await create();
    console.log("Client created successfully");

    try {
      // Login with email
      console.log("Starting login process...");
      if (!email || !email.includes("@")) {
        throw new Error("Invalid email format. Must be a valid email address.");
      }
      await client.login(email as `${string}@${string}`);
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
          message: "Space not found. Please initialize a space first.",
        });
      }

      // Set as current space
      await client.setCurrentSpace(space.did());
      console.log(`Set current space to: ${space.did()}`);

      // Read file data
      const fileData = fs.readFileSync(uploadedFile.filepath);
      const fileName =
        uploadedFile.originalFilename || path.basename(uploadedFile.filepath);
      const fileType = uploadedFile.mimetype || "application/octet-stream";

      // Create File object
      const file = new File([fileData], fileName, { type: fileType });

      // Create metadata file
      const metadataWithFileInfo = {
        ...metadata,
        name: fileName,
        type: fileType,
        size: uploadedFile.size,
        timestamp: Date.now(),
      };

      const metadataFile = new File(
        [JSON.stringify(metadataWithFileInfo)],
        "metadata.json",
        { type: "application/json" }
      );

      // Upload files
      console.log(`Uploading file: ${fileName}...`);
      const filesToUpload = [file, metadataFile];

      // Upload the directory
      const directoryCid = await client.uploadDirectory(filesToUpload);
      const cid = directoryCid.toString();
      console.log(`Upload complete with CID: ${cid}`);

      // Generate gateway URL
      const url = `https://w3s.link/ipfs/${cid}/${encodeURIComponent(
        fileName
      )}`;
      console.log(`Gateway URL: ${url}`);

      // Clean up temporary file
      if (fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath);
      }

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        cid,
        url,
        metadata: metadataWithFileInfo,
      });
    } catch (error) {
      console.error("Error during file upload:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error during upload";
      return res.status(500).json({
        success: false,
        message: `Error: ${errorMessage}`,
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown server error";
    return res.status(500).json({
      success: false,
      message: `Server error: ${errorMessage}`,
    });
  }
}
