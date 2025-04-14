import OpenAI from "openai";

export interface AgentConfig {
  apiKey?: string; // Optional API key for client-side use
  model: string;
  temperature: number;
  maxTokens?: number;
}

export class BaseAgent {
  protected openai: OpenAI | null = null;
  protected model: string;
  protected temperature: number;
  protected maxTokens: number;
  protected storachaClient: any; // Will be properly typed when integrated

  constructor(config: AgentConfig, storachaClient?: any) {
    // Initialize OpenAI if API key is provided
    if (config.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.apiKey,
      });
    }

    this.model = config.model || "gpt-3.5-turbo";
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 1000;
    this.storachaClient = storachaClient;
  }

  /**
   * Initialize the agent with server-side API key
   */
  async initialize(serverSideApiKey?: string): Promise<void> {
    if (!this.openai && serverSideApiKey) {
      this.openai = new OpenAI({
        apiKey: serverSideApiKey,
      });
    }
  }

  /**
   * Generate a completion using the OpenAI API
   */
  protected async generateCompletion(
    prompt: string,
    options: Partial<AgentConfig> = {}
  ): Promise<string> {
    if (!this.openai) {
      throw new Error(
        "OpenAI client not initialized. Please call initialize() first."
      );
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: options.temperature || this.temperature,
        max_tokens: options.maxTokens || this.maxTokens,
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Error generating AI completion:", error);
      throw new Error(`Failed to generate AI response: ${error}`);
    }
  }

  /**
   * Store data in Storacha if a client is available
   */
  protected async storeData(key: string, data: any): Promise<string | null> {
    if (!this.storachaClient) {
      console.warn("Storacha client not available for storing data");
      return null;
    }

    try {
      // Implementation will depend on your Storacha integration
      // This is a placeholder for the actual implementation
      console.log(`Storing data with key: ${key}`);
      // return await this.storachaClient.storeJSON(key, data);
      return "sample-cid"; // Replace with actual implementation
    } catch (error) {
      console.error("Error storing data in Storacha:", error);
      return null;
    }
  }

  /**
   * Retrieve data from Storacha if a client is available
   */
  protected async retrieveData(key: string): Promise<any | null> {
    if (!this.storachaClient) {
      console.warn("Storacha client not available for retrieving data");
      return null;
    }

    try {
      // Implementation will depend on your Storacha integration
      // This is a placeholder for the actual implementation
      console.log(`Retrieving data with key: ${key}`);
      // return await this.storachaClient.retrieveJSON(key);
      return {}; // Replace with actual implementation
    } catch (error) {
      console.error("Error retrieving data from Storacha:", error);
      return null;
    }
  }
}
