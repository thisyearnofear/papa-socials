import type { NextApiRequest, NextApiResponse } from "next";
import { create } from "@web3-storage/w3up-client";

type ResponseData = {
  success: boolean;
  message?: string;
  spaceDid?: string;
  spaceName?: string;
  email?: string;
};

// Type for flexible space objects
interface AnySpace {
  did(): string;
  name?: string;
  register?: () => Promise<void>;
  [key: string]: unknown;
}

// Type for account objects with any properties
interface AnyAccount {
  plan?: { wait?: () => Promise<void> };
  [key: string]: unknown;
}

// Type for client with dynamic properties
interface StorageClient {
  accounts: () => Promise<Record<string, AnyAccount>>;
  login: (email: string) => Promise<void>;
  spaces: () => Promise<AnySpace[]>;
  createSpace: (
    name: string,
    options: { account: AnyAccount }
  ) => Promise<AnySpace>;
  setCurrentSpace: (did: string) => Promise<void>;
  [key: string]: unknown;
}

/**
 * API endpoint to create a Storacha space
 * POST /api/storage/create-space
 *
 * Request body:
 * {
 *   email: string;
 *   spaceName: string;
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST method
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { email, spaceName } = req.body;

    if (!email || !spaceName) {
      return res.status(400).json({
        success: false,
        message: "Email and spaceName are required",
      });
    }

    // Create a client with type assertion to allow property access
    const client = await create();
    // Cast client to StorageClient to access potential dynamic properties
    const anyClient = client as unknown as StorageClient;

    // Login with email if not already logged in
    const accounts = await client.accounts();
    if (!accounts || Object.keys(accounts).length === 0) {
      console.log(`No accounts found. Logging in with email: ${email}`);
      await client.login(email);
      console.log("Login successful");
    }

    // Check for existing spaces with the given name
    console.log("Checking for existing spaces...");
    const spaces = await client.spaces();
    console.log(`Found ${spaces.length} spaces`);

    let space: AnySpace | null = null;

    // Check if the space already exists
    for (const s of spaces) {
      try {
        // Access name property safely without calling as function
        const nameValue = s.name;
        if (nameValue === spaceName) {
          space = s as unknown as AnySpace;
          console.log(`Found existing space: ${spaceName} (${s.did()})`);
          break;
        }
      } catch (err) {
        console.warn("Error checking space name:", err);
      }
    }

    if (!space) {
      // Get the first account (using object keys since accounts might not be an array)
      const updatedAccounts = await client.accounts();
      if (!updatedAccounts || Object.keys(updatedAccounts).length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No accounts found after login. Please check verification email and try again.",
        });
      }

      // Use explicit typing for account to avoid type issues
      const accountObj = Object.values(updatedAccounts)[0] as AnyAccount;

      // Ensure payment plan is selected
      console.log("Checking payment plan...");
      try {
        if (
          accountObj?.plan?.wait &&
          typeof accountObj.plan.wait === "function"
        ) {
          await accountObj.plan.wait();
          console.log("Payment plan verified");
        }
      } catch (error) {
        console.warn("Error checking payment plan:", error);
        // Continue anyway as this might not be critical
      }

      // Create the space with account for recovery
      console.log(`Creating new space: ${spaceName}...`);

      // Use explicit any typing to bypass TypeScript limitations with dynamic API
      space = (await anyClient.createSpace(spaceName, {
        account: accountObj,
      })) as AnySpace;

      console.log(`Space created: ${space.did()}`);

      // Try to register the space if the method exists
      try {
        if (typeof space.register === "function") {
          console.log("Registering space...");
          await space.register();
          console.log("Space registered successfully");
        }
      } catch (regError) {
        console.warn("Failed to register space:", regError);
        // Continue anyway as this might not be critical
      }
    }

    // Set as current space using the any client to bypass type restrictions
    await anyClient.setCurrentSpace(space.did());
    console.log(`Set current space to: ${space.did()}`);

    // Return space details
    return res.status(200).json({
      success: true,
      spaceDid: space.did(),
      spaceName,
      email,
    });
  } catch (error) {
    console.error("Error creating space:", error);

    // Handle and return error message
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error creating space";
    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}
