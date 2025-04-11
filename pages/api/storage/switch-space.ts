import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message?: string;
};

/**
 * API endpoint to switch to a specific space
 * POST /api/storage/switch-space
 *
 * Request body:
 * {
 *   spaceDid: string;
 *   email: string;
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { spaceDid, email } = req.body;

    if (!spaceDid || !email) {
      return res.status(400).json({
        success: false,
        message: "spaceDid and email are required",
      });
    }

    // Create client
    console.log(`Creating Storacha client for ${email}...`);
    const client = await create();
    console.log("Client created successfully");

    // Login with email
    console.log("Starting login process...");
    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Must be a valid email address.",
      });
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
        message: "Space not found. Please verify the space DID is correct.",
      });
    }

    // Set as current space
    await client.setCurrentSpace(space.did());
    console.log(`Set current space to: ${space.did()}`);

    return res.status(200).json({
      success: true,
      message: "Successfully switched to the specified space",
    });
  } catch (error) {
    console.error("Error switching space:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      success: false,
      message: `Error: ${errorMessage}`,
    });
  }
}
