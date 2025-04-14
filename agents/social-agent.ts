import { BaseAgent, AgentConfig } from "./base-agent";

export interface PostDraft {
  id: string;
  content: string;
  suggestedMedia?: string[]; // CIDs of suggested media
  votes: number;
  targetPlatforms: string[]; // e.g., "twitter", "instagram"
  status: "draft" | "approved" | "posted" | "rejected";
  createdAt: string;
  postAt?: string;
}

export interface GenerationTheme {
  topic: string;
  tone: "casual" | "professional" | "humorous" | "serious";
  includeMedia: boolean;
  platforms: string[];
}

export class SocialAgent extends BaseAgent {
  constructor(config: AgentConfig, storachaClient?: any) {
    super(config, storachaClient);
  }

  /**
   * Generate social media post drafts based on a theme
   */
  async generatePosts(
    theme: GenerationTheme,
    count: number = 3
  ): Promise<PostDraft[]> {
    try {
      // Get recent content from Storacha to reference in posts
      const recentContent = await this.retrieveData("recent_content");
      const artistAssets = await this.retrieveData("artist_assets");

      // Format artist content for the prompt
      const contentContext = recentContent
        ? JSON.stringify(recentContent).substring(0, 1000)
        : "PAPA is a music band with albums and performances.";

      // Get media assets to suggest in posts
      const mediaAssets =
        artistAssets?.filter(
          (asset: any) =>
            asset.type?.includes("image") || asset.type?.includes("video")
        ) || [];

      // Generate post prompt based on theme
      const prompt = `You are a social media manager for a music artist/band called PAPA.
      Create ${count} engaging social media posts that the artist can share.
      
      Topic: ${theme.topic}
      Tone: ${theme.tone}
      Target platforms: ${theme.platforms.join(", ")}
      ${
        theme.includeMedia
          ? "Include suggestions for images or videos to accompany posts."
          : ""
      }
      
      Recent content about the artist:
      ${contentContext}
      
      For each post, provide:
      1. The post text (appropriate length for the platform)
      2. Target platform(s)
      3. If including media, description of what the media should show
      
      Format your response as a JSON array of posts.`;

      const completionResult = await this.generateCompletion(prompt, {
        temperature: 0.9, // Higher creativity for social posts
        maxTokens: 2000,
      });

      // Parse the generated posts
      let generatedPosts: any[];
      try {
        const jsonStr = completionResult.trim().replace(/```json|```/g, "");
        generatedPosts = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse AI-generated posts:", e);
        // Fallback to default formatted posts if parsing fails
        generatedPosts = this.getDefaultPosts(theme, count);
      }

      // Format as PostDraft objects
      const drafts: PostDraft[] = generatedPosts.map((post, index) => {
        // For posts that suggest media, try to find matching media in our assets
        let suggestedMedia: string[] = [];
        if (theme.includeMedia && mediaAssets.length > 0) {
          // Simple matching - could be enhanced with more sophisticated matching
          const mediaDescription = post.mediaDescription || post.media;
          if (mediaDescription) {
            const keywords = mediaDescription.toLowerCase().split(/\s+/);

            // Find media that matches keywords in the description or metadata
            suggestedMedia = mediaAssets
              .filter((asset: any) => {
                const assetText = JSON.stringify(asset).toLowerCase();
                return keywords.some((keyword: string) =>
                  assetText.includes(keyword)
                );
              })
              .slice(0, 2) // Limit to 2 suggestions
              .map((asset: any) => asset.cid);

            // If no specific matches, suggest a random asset
            if (suggestedMedia.length === 0 && mediaAssets.length > 0) {
              const randomAsset =
                mediaAssets[Math.floor(Math.random() * mediaAssets.length)];
              suggestedMedia = [randomAsset.cid];
            }
          }
        }

        return {
          id: `post_draft_${Date.now()}_${index}`,
          content: post.text || post.content,
          suggestedMedia:
            suggestedMedia.length > 0 ? suggestedMedia : undefined,
          votes: 0,
          targetPlatforms:
            post.platforms || post.targetPlatforms || theme.platforms,
          status: "draft",
          createdAt: new Date().toISOString(),
        };
      });

      // Store drafts in Storacha for persistence
      await this.storeData(`posts/drafts/${Date.now()}`, drafts);

      return drafts;
    } catch (error) {
      console.error("Error generating social posts:", error);
      // Return fallback posts
      const defaultPosts = this.getDefaultPosts(theme, count);
      return defaultPosts.map((post, index) => ({
        id: `fallback_post_${Date.now()}_${index}`,
        content: post.text || post.content,
        votes: 0,
        targetPlatforms: post.platforms || theme.platforms,
        status: "draft",
        createdAt: new Date().toISOString(),
      }));
    }
  }

  /**
   * Vote on a post draft
   */
  async voteDraft(postId: string, increment: boolean = true): Promise<boolean> {
    try {
      // Get current drafts
      const allDrafts = (await this.retrieveData("posts/drafts")) || {};

      // Find the draft by ID
      let foundDraft: PostDraft | null = null;
      let draftCollection: string | null = null;

      // Look through each collection of drafts
      for (const [collection, drafts] of Object.entries(allDrafts)) {
        const draft = (drafts as PostDraft[]).find((d) => d.id === postId);
        if (draft) {
          foundDraft = draft;
          draftCollection = collection;
          break;
        }
      }

      if (!foundDraft || !draftCollection) {
        return false;
      }

      // Update the vote count
      foundDraft.votes += increment ? 1 : -1;

      // Store the updated drafts
      await this.storeData(
        `posts/drafts/${draftCollection}`,
        allDrafts[draftCollection]
      );

      return true;
    } catch (error) {
      console.error("Error voting on draft:", error);
      return false;
    }
  }

  /**
   * Update a post's status
   */
  async updatePostStatus(
    postId: string,
    status: "draft" | "approved" | "posted" | "rejected"
  ): Promise<boolean> {
    try {
      // Similar logic to voteDraft to find and update the post
      const allDrafts = (await this.retrieveData("posts/drafts")) || {};

      let foundDraft: PostDraft | null = null;
      let draftCollection: string | null = null;

      // Look through each collection of drafts
      for (const [collection, drafts] of Object.entries(allDrafts)) {
        const draft = (drafts as PostDraft[]).find((d) => d.id === postId);
        if (draft) {
          foundDraft = draft;
          draftCollection = collection;
          break;
        }
      }

      if (!foundDraft || !draftCollection) {
        return false;
      }

      // Update the status
      foundDraft.status = status;

      // If approved, set a post time
      if (status === "approved") {
        // Set post time to 24 hours from now
        foundDraft.postAt = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString();
      }

      // Store the updated drafts
      await this.storeData(
        `posts/drafts/${draftCollection}`,
        allDrafts[draftCollection]
      );

      return true;
    } catch (error) {
      console.error("Error updating post status:", error);
      return false;
    }
  }

  /**
   * Get drafts with a certain status
   */
  async getDrafts(
    status: "draft" | "approved" | "posted" | "rejected" | "all" = "all",
    limit: number = 10
  ): Promise<PostDraft[]> {
    try {
      const allDrafts = (await this.retrieveData("posts/drafts")) || {};

      // Flatten all drafts from different collections
      const flatDrafts: PostDraft[] = [];
      for (const drafts of Object.values(allDrafts)) {
        flatDrafts.push(...(drafts as PostDraft[]));
      }

      // Filter by status if not "all"
      const filteredDrafts =
        status === "all"
          ? flatDrafts
          : flatDrafts.filter((draft) => draft.status === status);

      // Sort by votes (descending) and creation time (newest first)
      const sortedDrafts = filteredDrafts.sort((a, b) => {
        if (a.votes !== b.votes) return b.votes - a.votes;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      return sortedDrafts.slice(0, limit);
    } catch (error) {
      console.error("Error getting drafts:", error);
      return [];
    }
  }

  /**
   * Create default posts as a fallback
   */
  private getDefaultPosts(theme: GenerationTheme, count: number): any[] {
    const defaultPosts = [
      {
        text: "Excited to be working on new music for you all! Stay tuned for updates soon. #PAPA #NewMusic",
        platforms: ["twitter", "instagram"],
      },
      {
        text: "Looking back at our last tour and feeling grateful for all our amazing fans. What city should we visit next?",
        platforms: ["instagram", "facebook"],
        mediaDescription: "tour performance photo",
      },
      {
        text: "Our latest album is now available on all streaming platforms! Listen now and let us know your favorite track.",
        platforms: ["twitter", "facebook", "instagram"],
        mediaDescription: "album cover",
      },
    ];

    return defaultPosts.slice(0, count);
  }
}
