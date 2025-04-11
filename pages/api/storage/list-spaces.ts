import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message?: string;
  spaces?: Array<{
    did: string;
    name: string;
  }>;
  cursor?: string;
};

/**
 * API endpoint to list all spaces for a given email
 * POST /api/storage/list-spaces
 *
 * Request body:
 * {
 *   email: string; // The email address to check for spaces
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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Create client and login
    console.log(`Creating Storacha client for ${email}...`);
    const client = await create();

    console.log("Starting login process...");
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email format. Must be a valid email address.");
    }
    await client.login(email as `${string}@${string}`);
    console.log("Login successful");

    // Get spaces
    const spaces = await client.spaces();
    console.log(
      `Found ${spaces.length} spaces:`,
      spaces.map((s) => s.did())
    );

    // Format spaces for response
    const formattedSpaces = spaces.map((space) => {
      // Try to extract the name from the space object
      let spaceName = "Unnamed Space";
      try {
        // Check if the space object has any properties that might indicate a name
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const spaceAny = space as any;

        // Extract space name from metadata if available
        if (spaceAny.metadata && spaceAny.metadata.name) {
          spaceName = spaceAny.metadata.name;
        }
        // If no metadata name, try to use the last part of the DID as the name
        else {
          const didParts = space.did().split(":");
          spaceName = didParts[didParts.length - 1].substring(0, 8);
        }
      } catch (err) {
        console.warn("Error extracting space name:", err);
      }

      return {
        did: space.did(),
        name: spaceName,
      };
    });

    return res.status(200).json({
      success: true,
      spaces: formattedSpaces,
      cursor: "", // Empty cursor means no more items, otherwise return a next page token
    });
  } catch (error) {
    console.error("Error listing spaces:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      success: false,
      message: `Error: ${errorMessage}`,
    });
  }
}
