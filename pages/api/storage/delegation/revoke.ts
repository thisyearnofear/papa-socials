import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";

type ResponseData = {
  success: boolean;
  message?: string;
  newSpaceDid?: string;
};

/**
 * Handles access control by creating a new space with fresh permissions.
 * This is more reliable than trying to revoke individual delegations.
 *
 * The approach:
 * 1. Create a new space with a new key pair
 * 2. Authorize it with the user's email
 * 3. Return the new space DID to the client
 * 4. Client can then migrate content to the new space
 *
 * This ensures:
 * - Clean break from previous delegations
 * - No lingering permissions
 * - Fresh start with known good state
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
    const { spaceDid, email } = req.body;

    if (!spaceDid || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    // Initialize the client
    const store = new StoreMemory();
    const client = await create({ store });

    try {
      // Ensure we're authenticated
      const accounts = await client.accounts();
      if (!accounts || Object.keys(accounts).length === 0) {
        await client.login(email as `${string}@${string}`);
      }

      // Get all spaces
      const spaces = await client.spaces();
      const oldSpace = spaces.find((space) => space.did() === spaceDid);

      if (!oldSpace) {
        throw new Error("Space not found");
      }

      // Create a new space with a new key pair
      const spaceName = `${oldSpace.name}-new`;
      const newSpace = await client.createSpace(spaceName);

      // Set the new space as current and authorize it
      await client.setCurrentSpace(newSpace.did());
      await client.authorize(email as `${string}@${string}`);

      return res.status(200).json({
        success: true,
        message: "New space created with fresh access control",
        newSpaceDid: newSpace.did(),
      });
    } catch (processError) {
      console.error("Error creating new space:", processError);
      return res.status(400).json({
        success: false,
        message:
          processError instanceof Error
            ? processError.message
            : "Error creating new space",
      });
    }
  } catch (error) {
    console.error("Error managing access:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to manage access",
    });
  }
}
