import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message?: string;
};

/**
 * API endpoint to verify a Storacha space
 * POST /api/storage/verify-space
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

    // Create a client
    const client = await create();

    // Login with email if not already logged in
    const accounts = await client.accounts();
    if (!accounts || Object.keys(accounts).length === 0) {
      console.log(`No accounts found. Logging in with email: ${email}`);

      // Validate email format
      if (!email.includes("@")) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format. Must be a valid email address.",
        });
      }

      await client.login(email as `${string}@${string}`);
      console.log("Login successful");
    }

    // Check for spaces that match the DID
    console.log("Checking for space...");
    const spaces = await client.spaces();

    // Look for the space with the matching DID
    let spaceFound = false;
    for (const space of spaces) {
      try {
        const did = space.did();
        if (did === spaceDid) {
          spaceFound = true;
          console.log(`Verified space: ${spaceDid}`);
          break;
        }
      } catch (err) {
        console.warn("Error checking space DID:", err);
      }
    }

    if (!spaceFound) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: "Space verified successfully",
    });
  } catch (error) {
    console.error("Error verifying space:", error);

    // Handle and return error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error verifying space";
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}
