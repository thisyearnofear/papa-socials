import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message?: string;
};

/**
 * API endpoint to login with email for Storacha
 * POST /api/storage/login
 *
 * Request body:
 * {
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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Create a client
    const client = await create();

    // Start the login process
    console.log(`Starting login for email: ${email}`);

    // Validate email format
    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Must be a valid email address.",
      });
    }

    // This sends an email to the user with a verification link
    // The promise resolves when the user clicks the link
    await client.login(email as `${string}@${string}`);

    console.log("Login successful");

    // Return success
    return res.status(200).json({
      success: true,
      message: "Login successful. You can now create spaces or upload content.",
    });
  } catch (error) {
    console.error("Error during login:", error);

    // Handle and return error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error during login";
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}
