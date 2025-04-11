import type { NextApiRequest, NextApiResponse } from "next";
import { StorachaClient } from "../../../utils/storacha-client";

type ResponseData = {
  success: boolean;
  message?: string;
  email?: string;
  spaceName?: string;
  spaceDid?: string;
};

/**
 * API endpoint to initialize Storacha client and space
 * POST /api/storage/initialize
 *
 * Request body:
 * {
 *   email: string; // email for authentication
 *   spaceName: string; // name for the space
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
    // Get email and spaceName from environment variables
    const email = process.env.NEXT_PUBLIC_STORACHA_EMAIL;
    const spaceName = process.env.NEXT_PUBLIC_STORACHA_SPACE_NAME;

    if (!email || !spaceName) {
      return res.status(400).json({
        success: false,
        message: "Email or spaceName not provided in environment variables",
      });
    }

    // Initialize Storacha client
    const client = new StorachaClient(email, spaceName);
    await client.init();

    const spaceDid = client.getSpaceDid();

    // Return success
    return res.status(200).json({
      success: true,
      email,
      spaceName,
      spaceDid,
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
