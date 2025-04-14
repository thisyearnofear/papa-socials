import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  VerificationAgent,
  VerificationChallenge,
  VerificationResult,
} from "../../agents/verification-agent";
import {
  SocialAgent,
  PostDraft,
  GenerationTheme,
} from "../../agents/social-agent";
import { useFilecoin } from "../filecoin-context";

// Context type definition
interface AIContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Verification methods
  generateChallenge: (
    difficulty: number
  ) => Promise<VerificationChallenge | null>;
  evaluateResponses: (
    userId: string,
    challengeId: string,
    responses: Record<string, string>
  ) => Promise<VerificationResult | null>;
  checkAccess: (userId: string, requiredTier: number) => Promise<boolean>;

  // Social methods
  generatePosts: (
    theme: GenerationTheme,
    count?: number
  ) => Promise<PostDraft[]>;
  getDrafts: (
    status?: "draft" | "approved" | "posted" | "rejected" | "all",
    limit?: number
  ) => Promise<PostDraft[]>;
  voteDraft: (postId: string, increment?: boolean) => Promise<boolean>;
  updatePostStatus: (
    postId: string,
    status: "draft" | "approved" | "posted" | "rejected"
  ) => Promise<boolean>;
}

// Create context
const AIContext = createContext<AIContextType | undefined>(undefined);

// Context hook
export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    console.error(
      "useAI hook used outside of AIProvider - this will cause an error"
    );
    throw new Error("useAI must be used within an AIProvider");
  }
  return context;
}

// Provider props
interface AIProviderProps {
  children: ReactNode;
}

// Default configuration
const defaultConfig = {
  model: "gpt-3.5-turbo",
  temperature: 0.7,
};

// AIProvider component
export function AIProvider({ children }: AIProviderProps) {
  // Internal state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationAgent, setVerificationAgent] =
    useState<VerificationAgent | null>(null);
  const [socialAgent, setSocialAgent] = useState<SocialAgent | null>(null);

  // Get Filecoin context data
  const filecoinContext = useFilecoin();

  // Initialize agents when Filecoin context is available
  useEffect(() => {
    // We need to ensure the user is connected to a space before initializing agents
    if (!filecoinContext.isInitialized || !filecoinContext.userSpace) return;

    const initializeAgents = async () => {
      try {
        setIsLoading(true);

        // Initialize verification agent - using filecoinContext as a proxy for Storacha
        const vAgent = new VerificationAgent(defaultConfig, filecoinContext);
        await vAgent.initialize(process.env.NEXT_PUBLIC_OPENAI_API_KEY);
        setVerificationAgent(vAgent);

        // Initialize social agent
        const sAgent = new SocialAgent(defaultConfig, filecoinContext);
        await sAgent.initialize(process.env.NEXT_PUBLIC_OPENAI_API_KEY);
        setSocialAgent(sAgent);

        // Mark as initialized
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error("Error initializing AI agents:", err);
        setError(
          `Failed to initialize AI agents: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeAgents();
  }, [filecoinContext]);

  // Generate verification challenge
  const generateChallenge = async (
    difficulty: number
  ): Promise<VerificationChallenge | null> => {
    if (!verificationAgent) {
      setError("Verification agent not initialized");
      return null;
    }

    try {
      setIsLoading(true);
      return await verificationAgent.generateChallenge(difficulty);
    } catch (err) {
      console.error("Error generating challenge:", err);
      setError(
        `Failed to generate challenge: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Evaluate verification responses
  const evaluateResponses = async (
    userId: string,
    challengeId: string,
    responses: Record<string, string>
  ): Promise<VerificationResult | null> => {
    if (!verificationAgent) {
      setError("Verification agent not initialized");
      return null;
    }

    try {
      setIsLoading(true);
      return await verificationAgent.evaluateResponses(
        userId,
        challengeId,
        responses
      );
    } catch (err) {
      console.error("Error evaluating responses:", err);
      setError(
        `Failed to evaluate responses: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Check access level
  const checkAccess = async (
    userId: string,
    requiredTier: number
  ): Promise<boolean> => {
    if (!verificationAgent) {
      setError("Verification agent not initialized");
      return false;
    }

    try {
      return await verificationAgent.checkAccess(userId, requiredTier);
    } catch (err) {
      console.error("Error checking access:", err);
      setError(
        `Failed to check access: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  // Generate social posts
  const generatePosts = async (
    theme: GenerationTheme,
    count: number = 3
  ): Promise<PostDraft[]> => {
    if (!socialAgent) {
      setError("Social agent not initialized");
      return [];
    }

    try {
      setIsLoading(true);
      return await socialAgent.generatePosts(theme, count);
    } catch (err) {
      console.error("Error generating posts:", err);
      setError(
        `Failed to generate posts: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get post drafts
  const getDrafts = async (
    status: "draft" | "approved" | "posted" | "rejected" | "all" = "all",
    limit: number = 10
  ): Promise<PostDraft[]> => {
    if (!socialAgent) {
      setError("Social agent not initialized");
      return [];
    }

    try {
      return await socialAgent.getDrafts(status, limit);
    } catch (err) {
      console.error("Error getting drafts:", err);
      setError(
        `Failed to get drafts: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return [];
    }
  };

  // Vote on a draft
  const voteDraft = async (
    postId: string,
    increment: boolean = true
  ): Promise<boolean> => {
    if (!socialAgent) {
      setError("Social agent not initialized");
      return false;
    }

    try {
      return await socialAgent.voteDraft(postId, increment);
    } catch (err) {
      console.error("Error voting on draft:", err);
      setError(
        `Failed to vote on draft: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  // Update post status
  const updatePostStatus = async (
    postId: string,
    status: "draft" | "approved" | "posted" | "rejected"
  ): Promise<boolean> => {
    if (!socialAgent) {
      setError("Social agent not initialized");
      return false;
    }

    try {
      return await socialAgent.updatePostStatus(postId, status);
    } catch (err) {
      console.error("Error updating post status:", err);
      setError(
        `Failed to update post status: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  // Context value
  const value: AIContextType = {
    isInitialized,
    isLoading,
    error,
    generateChallenge,
    evaluateResponses,
    checkAccess,
    generatePosts,
    getDrafts,
    voteDraft,
    updatePostStatus,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}
