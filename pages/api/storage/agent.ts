import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message?: string;
  agentDid?: string;
};

/**
 * API endpoint to initialize the Storacha agent
 * GET /api/storage/agent
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
    // Create a client - this generates a new agent if one doesn't exist
    const client = await create();
    const agentDid = client.agent.did();

    // Return the agent DID
    return res.status(200).json({
      success: true,
      agentDid,
    });
  } catch (error) {
    console.error("Error creating Storacha agent:", error);

    // Handle and return error message
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error creating Storacha agent";
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}
