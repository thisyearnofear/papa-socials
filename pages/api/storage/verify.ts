import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  verified: boolean;
  message: string;
};

interface AnyClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * API endpoint to verify if content exists on IPFS/Storacha
 * POST /api/storage/verify
 *
 * Request body:
 * {
 *   cid: string; // Content ID to verify
 *   filename?: string; // Optional filename
 *   spaceDid?: string; // Optional space DID
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      verified: false,
      message: "Method not allowed",
    });
  }

  try {
    const { cid, filename, spaceDid } = req.body;

    if (!cid) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "CID is required",
      });
    }

    try {
      let verified = false;

      // First, try to verify using the client if spaceDid is provided
      if (spaceDid) {
        try {
          console.log(`Verifying content with spaceDid: ${spaceDid}`);

          // Create client
          const client = await create();
          // Cast to a more flexible type for runtime method checks
          const anyClient = client as unknown as AnyClient;

          // Try different verification methods depending on the client version
          try {
            // Check if we can use capability methods to verify
            if (
              anyClient.capability &&
              typeof anyClient.capability.get === "function"
            ) {
              const result = await anyClient.capability.get(cid);
              verified = !!result;
              console.log(
                `Capability check result: ${JSON.stringify(result || {})}`
              );
            }
            // Try the status method if available
            else if (typeof anyClient.status === "function") {
              const status = await anyClient.status(cid);
              verified = status && status.pins && status.pins.length > 0;
              console.log(
                `Status check result: ${JSON.stringify(status || {})}`
              );
            }
          } catch (verifyErr) {
            console.warn("API verification failed:", verifyErr);
          }
        } catch (clientErr) {
          console.warn(
            "Client verification failed, falling back to gateway check:",
            clientErr
          );
        }
      }

      // If not verified yet or no spaceDid, fall back to gateway check
      if (!verified) {
        // Construct gateway URL
        const url = filename
          ? `https://w3s.link/ipfs/${cid}/${encodeURIComponent(filename)}`
          : `https://w3s.link/ipfs/${cid}/`;

        console.log(`Verifying content at gateway: ${url}`);

        // Make a HEAD request to check if the content exists
        const response = await fetch(url, { method: "HEAD" });
        verified = response.ok;

        console.log(
          `Gateway verification result for ${cid}: ${
            verified ? "Success" : "Failed"
          }`
        );
      }

      return res.status(200).json({
        success: true,
        verified,
        message: verified
          ? "Content verified successfully"
          : "Content verification failed",
      });
    } catch (error) {
      console.error("Error verifying content:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({
        success: false,
        verified: false,
        message: `Error verifying content: ${errorMessage}`,
      });
    }
  } catch (error) {
    console.error("Server error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown server error";
    return res.status(500).json({
      success: false,
      verified: false,
      message: `Server error: ${errorMessage}`,
    });
  }
}
