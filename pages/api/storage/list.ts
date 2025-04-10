import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  success: boolean;
  message: string;
  assets?: Record<string, unknown>[];
};

/**
 * API endpoint to list stored assets
 * POST /api/storage/list
 *
 * Since we don't have a server-side database for this demo,
 * we'll use localStorage on the client side to track assets.
 * This endpoint just acknowledges the request.
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

  // This endpoint is just a placeholder since we're storing asset data in localStorage
  // In a production environment, you would store this data in a database
  return res.status(200).json({
    success: true,
    message: "Asset listing should be handled client-side for this demo",
  });
}
