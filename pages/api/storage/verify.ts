import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  success: boolean;
  verified: boolean;
  message: string;
};

/**
 * API endpoint to verify if content exists on IPFS/Storacha
 * POST /api/storage/verify
 *
 * Request body:
 * {
 *   cid: string; // Content ID to verify
 *   filename?: string; // Optional filename
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
    const { cid, filename } = req.body;

    if (!cid) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "CID is required",
      });
    }

    try {
      // Construct gateway URL
      const url = filename
        ? `https://w3s.link/ipfs/${cid}/${encodeURIComponent(filename)}`
        : `https://w3s.link/ipfs/${cid}/`;

      console.log(`Verifying content at: ${url}`);

      // Make a HEAD request to check if the content exists
      const response = await fetch(url, { method: "HEAD" });
      const verified = response.ok;

      console.log(
        `Verification result for ${cid}: ${verified ? "Success" : "Failed"}`
      );

      return res.status(200).json({
        success: true,
        verified,
        message: verified
          ? "Content verified successfully"
          : `Content verification failed with status: ${response.status}`,
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
