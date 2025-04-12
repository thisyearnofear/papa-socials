import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";
import * as Delegation from "@ucanto/core/delegation";

type ResponseData = {
  success: boolean;
  message: string;
  spaceDid?: string;
  spaceName?: string;
};

/**
 * API endpoint to apply a delegation received from a space owner
 * POST /api/storage/delegation/use
 *
 * Request body:
 * {
 *   delegation: string; // Base64 encoded delegation
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
    const { delegation: delegationBase64 } = req.body;

    if (!delegationBase64) {
      return res.status(400).json({
        success: false,
        message: "delegation is required",
      });
    }

    // Convert base64 string to Uint8Array
    const delegationBytes = Buffer.from(delegationBase64, "base64");

    // Create client
    console.log("Creating Storacha client...");
    const client = await create();
    console.log(
      "Client created successfully with agent DID:",
      client.agent.did()
    );

    // Extract the delegation from the archive
    console.log("Extracting delegation from archive...");
    const extractResult = await Delegation.extract(delegationBytes);
    if (!extractResult.ok) {
      throw new Error(
        "Failed to extract delegation: " + extractResult.error.message
      );
    }
    const delegation = extractResult.ok;

    // Add the space using the delegation
    console.log("Adding space with delegation...");
    const space = await client.addSpace(delegation);
    console.log("Space added successfully with DID:", space.did());

    // Set as current space
    await client.setCurrentSpace(space.did());
    console.log(`Set current space to: ${space.did()}`);

    // Get space name - use a simpler approach
    let spaceName = "Shared Space";
    try {
      // Try to access space properties directly if possible
      if (space && typeof space.name === "function") {
        // @ts-expect-error - Next API type incompatibility
        spaceName = space.name();
      } else if (space && typeof space.meta === "function") {
        const meta = space.meta();
        if (meta && meta.name) {
          spaceName = meta.name;
        }
      }
    } catch (e) {
      console.warn("Could not get space name:", e);
    }

    return res.status(200).json({
      success: true,
      message: "Delegation applied successfully",
      spaceDid: space.did(),
      spaceName,
    });
  } catch (error) {
    console.error("Error applying delegation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      success: false,
      message: `Error: ${errorMessage}`,
    });
  }
}
