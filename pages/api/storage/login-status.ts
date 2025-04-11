import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message?: string;
  isLoggedIn: boolean;
};

/**
 * API endpoint to check if the user is logged in with Storacha
 * GET /api/storage/login-status
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow GET method
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({
        success: false,
        message: "Method not allowed",
        isLoggedIn: false,
      });
  }

  try {
    // Create a client
    const client = await create();

    // Check if the client has any accounts
    // If it does, then the user is logged in
    const accounts = await client.accounts();
    const isLoggedIn = accounts && Object.keys(accounts).length > 0;

    // Return the login status
    return res.status(200).json({
      success: true,
      isLoggedIn,
    });
  } catch (error) {
    console.error("Error checking login status:", error);

    // Handle and return error message
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error checking login status";
    return res.status(500).json({
      success: false,
      message: errorMessage,
      isLoggedIn: false,
    });
  }
}
