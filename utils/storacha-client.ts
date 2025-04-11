import { create } from "@web3-storage/w3up-client";

/**
 * StorachaClient - A utility class to manage interactions with Web3.Storage
 */
export class StorachaClient {
  private email: string;
  private spaceName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private space: any;
  private spaceDid: string = "";
  private initialized: boolean = false;

  /**
   * Creates a new StorachaClient instance
   * @param email - User email for authentication
   * @param spaceName - Name of the storage space to use
   */
  constructor(email: string, spaceName: string) {
    this.email = email;
    this.spaceName = spaceName;
  }

  /**
   * Initialize the client and storage space
   * @returns Promise that resolves when initialization is complete
   */
  async init() {
    try {
      // Create client
      console.log(`Creating Storacha client for ${this.email}...`);
      this.client = await create();
      console.log("Client created successfully");

      // Try to login with email
      console.log("Starting login process...");
      await this.client.login(this.email);
      console.log("Login successful");

      // Check for existing spaces with the given name
      console.log("Checking for existing spaces...");
      const spaces = await this.client.spaces();
      console.log(`Found ${spaces.length} spaces`);

      // Try to find existing space with matching name
      for (const s of spaces) {
        try {
          // Check if name is a property or method
          const spaceName = typeof s.name === "function" ? s.name() : s.name;
          if (spaceName === this.spaceName) {
            this.space = s;
            this.spaceDid = this.space.did();
            console.log(
              `Found existing space: ${this.spaceName} (${this.spaceDid})`
            );
            break;
          }
        } catch (err) {
          console.warn("Error checking space name:", err);
        }
      }

      // Create new space if not found
      if (!this.space) {
        // Ensure payment plan is selected
        const accounts = await this.client.accounts();
        if (accounts && Object.keys(accounts).length > 0) {
          // Get the first account (using object keys since accounts might not be an array)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const account = Object.values(accounts)[0] as Record<string, any>;
          console.log("Checking payment plan...");

          // Handle payment plan verification if needed
          if (account?.plan && typeof account.plan.wait === "function") {
            await account.plan.wait();
            console.log("Payment plan verified");
          }

          // Create the space with account for recovery
          console.log(`Creating new space: ${this.spaceName}...`);
          this.space = await this.client.createSpace(this.spaceName, {
            account,
          });
          this.spaceDid = this.space.did();
          console.log(`Space created: ${this.spaceDid}`);

          // Handle space registration if the API supports it
          if (typeof this.space.register === "function") {
            console.log("Registering space...");
            await this.space.register();
            console.log("Space registered successfully");
          }
        } else {
          throw new Error(
            "No accounts found after login. Please check verification email and try again."
          );
        }
      }

      // Set as current space
      await this.client.setCurrentSpace(this.space.did());
      console.log(`Set current space to: ${this.space.did()}`);

      this.initialized = true;
      return this.spaceDid;
    } catch (error) {
      console.error("Error during StorachaClient initialization:", error);
      throw error;
    }
  }

  /**
   * Upload a file to the storage
   * @param file - File to upload
   * @param metadata - Optional metadata to associate with the file
   * @returns CID of the uploaded file
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async uploadFile(file: File, metadata?: any) {
    if (!this.initialized) {
      throw new Error("Client not initialized. Call init() first");
    }

    try {
      const uploadResult = await this.client.uploadFile(file, {
        name: file.name,
        ...metadata,
      });
      return uploadResult.cid.toString();
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  /**
   * List all stored assets
   * @returns Array of stored assets
   */
  async listAssets() {
    if (!this.initialized) {
      throw new Error("Client not initialized. Call init() first");
    }

    try {
      const uploads = await this.client.capability.iterate();
      return Array.from(uploads);
    } catch (error) {
      console.error("Error listing assets:", error);
      throw error;
    }
  }

  /**
   * Verify if a file with the given CID exists and is accessible
   * @param cid - Content ID to verify
   * @returns Boolean indicating if the file is verified
   */
  async verifyAsset(cid: string) {
    if (!this.initialized) {
      throw new Error("Client not initialized. Call init() first");
    }

    try {
      // Attempt to retrieve the status of the file
      const status = await this.client.status(cid);
      return status && status.pins && status.pins.length > 0;
    } catch (error) {
      console.error("Error verifying asset:", error);
      return false;
    }
  }

  /**
   * Get the space DID
   * @returns The DID of the current space
   */
  getSpaceDid() {
    return this.spaceDid;
  }

  /**
   * Check if the client is initialized
   * @returns Boolean indicating if the client is initialized
   */
  isInitialized() {
    return this.initialized;
  }
}
