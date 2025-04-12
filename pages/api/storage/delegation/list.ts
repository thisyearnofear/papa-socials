import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";

interface DelegationInfo {
  id: string;
  audience: string;
  expiration: number;
  capabilities: string[];
}

type ResponseData = {
  success: boolean;
  message?: string;
  delegations?: DelegationInfo[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { email, spaceDid } = req.query;

    if (
      !email ||
      !spaceDid ||
      Array.isArray(email) ||
      Array.isArray(spaceDid)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid email and spaceDid are required",
      });
    }

    // Initialize the client
    const store = new StoreMemory();
    const client = await create({ store });

    // Ensure we're authenticated
    const accounts = await client.accounts();
    if (!accounts || Object.keys(accounts).length === 0) {
      await client.login(email as `${string}@${string}`);
    }

    // Get all spaces
    const spaces = await client.spaces();
    const targetSpace = spaces.find((space) => space.did() === spaceDid);

    if (!targetSpace) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    // Set as current space
    await client.setCurrentSpace(targetSpace.did());

    // For now, return an empty list as we need to implement the correct delegation listing
    // This will be updated once we have the proper API access
    return res.status(200).json({
      success: true,
      message: "Delegation listing not yet implemented",
      delegations: [],
    });
  } catch (error) {
    console.error("Error listing delegations:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to list delegations",
    });
  }
}
