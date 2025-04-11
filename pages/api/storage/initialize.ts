import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message?: string;
  version?: string;
  agentDid?: string;
  isLoggedIn?: boolean;
  hasAccounts?: boolean;
  spaceCount?: number;
};

/**
 * API endpoint to initialize and get info about Storacha client
 * GET /api/storage/initialize
 *
 * This endpoint provides information about the Storacha client
 * and the user's current state without modifying anything
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    // Create client to get version info
    const client = await create();
    const agentDid = client.agent.did();

    // Check if user has accounts (is logged in)
    const accounts = await client.accounts();
    const hasAccounts = accounts && Object.keys(accounts).length > 0;

    // Check for spaces if logged in
    let spaceCount = 0;
    if (hasAccounts) {
      const spaces = await client.spaces();
      spaceCount = spaces.length;
    }

    // Return client info
    return res.status(200).json({
      success: true,
      message: "Storacha client info retrieved successfully",
      version: "1.0.0", // You can get this from package.json or client if available
      agentDid,
      isLoggedIn: hasAccounts,
      hasAccounts,
      spaceCount,
    });
  } catch (error) {
    console.error("Error initializing storage:", error);

    // Handle and return error message
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error initializing storage";
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}
