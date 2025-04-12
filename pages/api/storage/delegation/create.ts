import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";
import * as DID from "@ipld/dag-ucan/did";

type ResponseData = {
  success: boolean;
  message: string;
  delegation?: Uint8Array;
  delegationId?: string;
};

/**
 * API endpoint to create a delegation for another user's agent DID
 * POST /api/storage/delegation/create
 *
 * Request body:
 * {
 *   spaceDid: string; // DID of the space
 *   email: string; // Email associated with the space
 *   audienceDid: string; // Target DID to delegate permissions to
 *   abilities: string[]; // Abilities to delegate (e.g. ['space/blob/add'])
 *   expirationHours?: number; // Optional: how long the delegation should be valid (default: 24h)
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
    const {
      spaceDid,
      email,
      audienceDid,
      abilities,
      expirationHours = 24,
    } = req.body;

    if (!spaceDid || !email || !audienceDid) {
      return res.status(400).json({
        success: false,
        message: "spaceDid, email, and audienceDid are required",
      });
    }

    if (!abilities || !Array.isArray(abilities) || abilities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "abilities must be an array of permissions",
      });
    }

    // Verify abilities are valid
    const validAbilities = [
      "space/info",
      "space/blob/add",
      "space/index/add",
      "space/index/list",
      "upload/add",
      "upload/list",
      "upload/remove",
      "filecoin/offer",
      "filecoin/list",
      "filecoin/info",
    ];

    const invalidAbilities = abilities.filter(
      (ability) => !validAbilities.includes(ability)
    );
    if (invalidAbilities.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid abilities: ${invalidAbilities.join(", ")}`,
      });
    }

    // Create client
    console.log(`Creating Storacha client for ${email}...`);
    const client = await create();
    console.log("Client created successfully");

    // Login with email
    console.log("Starting login process...");
    await client.login(email);
    console.log("Login successful");

    // Get spaces
    const spaces = await client.spaces();
    console.log(`Found ${spaces.length} spaces`);

    // Find matching space by DID
    let space = null;
    for (const s of spaces) {
      try {
        if (s.did() === spaceDid) {
          space = s;
          console.log(`Found space with DID: ${spaceDid}`);
          break;
        }
      } catch (err) {
        console.warn("Error checking space DID:", err);
      }
    }

    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Space not found",
      });
    }

    // Set as current space
    await client.setCurrentSpace(space.did());
    console.log(`Set current space to: ${space.did()}`);

    // Parse the audience DID
    const audience = DID.parse(audienceDid);

    // Set expiration time (default 24 hours from now)
    const expiration =
      Math.floor(Date.now() / 1000) + 60 * 60 * expirationHours;

    console.log(
      `Creating delegation for ${audienceDid} with abilities: ${abilities.join(
        ", "
      )}`
    );
    console.log(`Delegation will expire in ${expirationHours} hours`);

    // Create the delegation
    const delegation = await client.createDelegation(audience, abilities, {
      expiration,
    });

    // Get the delegation ID (CID)
    const delegationId = delegation.cid.toString();
    console.log(`Delegation created with ID: ${delegationId}`);

    // Serialize the delegation
    const archive = await delegation.archive();
    if (!archive.ok) {
      throw new Error("Failed to archive delegation");
    }

    console.log(
      `Delegation serialized successfully. Size: ${archive.ok.byteLength} bytes`
    );

    // Return the delegation as a Uint8Array along with its ID
    return res.status(200).json({
      success: true,
      message: "Delegation created successfully",
      delegation: archive.ok,
      delegationId: delegationId,
    });
  } catch (error) {
    console.error("Error creating delegation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({
      success: false,
      message: `Error: ${errorMessage}`,
    });
  }
}
