import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message: string;
  agentDid?: string;
};

/**
 * API endpoint to get the current client's agent DID
 * GET /api/storage/delegation/get-agent-did
 *
 * This is useful for clients who need to request a delegation from a space owner.
 * They can provide their agent DID to the space owner, who can then delegate permissions.
 */
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
    // Create a new client to get the agent DID
    const client = await create();
    const agentDid = client.agent.did();

    console.log(`Generated agent DID: ${agentDid}`);

    return res.status(200).json({
      success: true,
      message: "Agent DID retrieved successfully",
      agentDid,
    });
  } catch (error) {
    console.error("Error retrieving agent DID:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      success: false,
      message: `Error: ${errorMessage}`,
    });
  }
}
