import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({
        exists: false,
        error: "Missing or invalid URL parameter",
      });
    }

    // Validate URL is from allowed domains
    const allowedDomains = [
      "w3s.link",
      "ipfs.io",
      "ipfs.tech",
      "nftstorage.link",
      "dweb.link",
      "cf-ipfs.com",
    ];

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    if (!allowedDomains.some((d) => domain.includes(d))) {
      return res.status(403).json({
        exists: false,
        error: "URL domain not allowed for security reasons",
      });
    }

    // Perform HEAD request to check if resource exists
    try {
      // Use a timeout instead of AbortController to avoid type issues
      const fetchPromise = fetch(url, { method: "HEAD" });

      // Create a timeout promise
      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 5000)
      );

      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (response.ok) {
        const contentType = response.headers.get("content-type") || null;
        const contentLength = response.headers.get("content-length") || null;

        return res.status(200).json({
          exists: true,
          contentType,
          contentLength: contentLength ? parseInt(contentLength, 10) : null,
        });
      } else {
        // Even if the HEAD request fails, try to guess the content type from the URL
        const extension = url.split(".").pop()?.toLowerCase();
        let guessedType = null;

        if (extension) {
          const mimeTypes: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            mp4: "video/mp4",
            mp3: "audio/mpeg",
            pdf: "application/pdf",
            txt: "text/plain",
          };

          guessedType = mimeTypes[extension] || null;
        }

        return res.status(200).json({
          exists: false,
          statusCode: response.status,
          statusText: response.statusText,
          guessedType,
        });
      }
    } catch (fetchError: unknown) {
      console.error("Fetch error in proxy-head:", fetchError);
      // If the fetch fails (e.g., timeout, network error), return a structured error
      // that the client can handle gracefully
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : String(fetchError);
      const isTimeout = errorMessage.includes("timeout");

      return res.status(200).json({
        exists: false,
        error: errorMessage,
        isTimeout,
        // Try to extract file type from URL as a fallback
        guessedType: guessFileTypeFromUrl(url),
      });
    }
  } catch (error) {
    console.error("Error in proxy-head API:", error);
    return res.status(500).json({
      exists: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
}

// Helper function to guess file type from URL
function guessFileTypeFromUrl(url: string): string | null {
  try {
    const extension = url.split(".").pop()?.toLowerCase();
    if (!extension) return null;

    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      mp4: "video/mp4",
      mp3: "audio/mpeg",
      pdf: "application/pdf",
      txt: "text/plain",
    };

    return mimeTypes[extension] || null;
  } catch {
    return null;
  }
}
