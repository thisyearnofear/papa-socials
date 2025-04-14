import type { NextApiRequest, NextApiResponse } from "next";
import { SocialAgent } from "../../../agents/social-agent";
import OpenAI from "openai";
import { GenerationTheme, PostDraft } from "../../../agents/social-agent";

// In-memory storage for social post drafts
const postDraftsStore: Record<string, PostDraft[]> = {};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Make sure this is a POST request
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    // Create a social agent just for this request
    const agent = new SocialAgent(
      {
        model: "gpt-3.5-turbo",
        temperature: 0.9, // Higher creativity for social posts
      },
      null // We'll handle storage separately in this API route
    );

    // Initialize with the server-side API key
    await agent.initialize(process.env.OPENAI_API_KEY);

    // Get the request body
    const { action, userId, theme, count, postId, status, increment } =
      req.body;

    // Handle different actions
    switch (action) {
      case "generate":
        // Generate social media post drafts
        if (!theme) {
          return res.status(400).json({
            success: false,
            message: "Missing theme for post generation",
          });
        }

        try {
          // Generate posts
          const generationTheme: GenerationTheme = {
            topic: theme.topic || "New music",
            tone: theme.tone || "casual",
            includeMedia: theme.includeMedia !== false, // Default to true
            platforms: theme.platforms || ["twitter", "instagram"],
          };

          const posts = await generatePosts(agent, generationTheme, count || 3);

          // Save posts to store
          const draftSetId = `drafts_${Date.now()}`;
          postDraftsStore[draftSetId] = posts;

          return res.status(200).json({
            success: true,
            posts,
            draftSetId,
          });
        } catch (error) {
          console.error("Error generating posts:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to generate social posts",
          });
        }

      case "getDrafts":
        // Get post drafts with a certain status
        try {
          const requestedStatus = req.body.status || "all";
          const limit = parseInt(req.body.limit || "10", 10);

          // Get all drafts
          const allDrafts: PostDraft[] = [];
          for (const draftSet of Object.values(postDraftsStore)) {
            allDrafts.push(...draftSet);
          }

          // Filter by status if not "all"
          const filteredDrafts =
            requestedStatus === "all"
              ? allDrafts
              : allDrafts.filter((draft) => draft.status === requestedStatus);

          // Sort by votes (descending) and creation time (newest first)
          const sortedDrafts = filteredDrafts.sort((a, b) => {
            if (a.votes !== b.votes) return b.votes - a.votes;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });

          return res.status(200).json({
            success: true,
            drafts: sortedDrafts.slice(0, limit),
            total: filteredDrafts.length,
          });
        } catch (error) {
          console.error("Error getting drafts:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to get post drafts",
          });
        }

      case "voteDraft":
        // Vote on a post draft
        if (!postId) {
          return res.status(400).json({
            success: false,
            message: "Missing postId",
          });
        }

        try {
          // Find the draft across all sets
          let foundDraft: PostDraft | null = null;
          let foundDraftSetId: string | null = null;

          for (const [draftSetId, drafts] of Object.entries(postDraftsStore)) {
            const draft = drafts.find((d) => d.id === postId);
            if (draft) {
              foundDraft = draft;
              foundDraftSetId = draftSetId;
              break;
            }
          }

          if (!foundDraft || !foundDraftSetId) {
            return res.status(404).json({
              success: false,
              message: "Draft not found",
            });
          }

          // Update the vote count
          foundDraft.votes += increment !== false ? 1 : -1;

          return res.status(200).json({
            success: true,
            postId,
            newVoteCount: foundDraft.votes,
          });
        } catch (error) {
          console.error("Error voting on draft:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to vote on draft",
          });
        }

      case "updateStatus":
        // Update a post's status
        if (!postId || !status) {
          return res.status(400).json({
            success: false,
            message: "Missing postId or status",
          });
        }

        try {
          // Find the draft across all sets
          let foundDraft: PostDraft | null = null;
          let foundDraftSetId: string | null = null;

          for (const [draftSetId, drafts] of Object.entries(postDraftsStore)) {
            const draft = drafts.find((d) => d.id === postId);
            if (draft) {
              foundDraft = draft;
              foundDraftSetId = draftSetId;
              break;
            }
          }

          if (!foundDraft || !foundDraftSetId) {
            return res.status(404).json({
              success: false,
              message: "Draft not found",
            });
          }

          // Update the status
          foundDraft.status = status as
            | "draft"
            | "approved"
            | "posted"
            | "rejected";

          // If approved, set a post time
          if (status === "approved") {
            // Set post time to 24 hours from now
            foundDraft.postAt = new Date(
              Date.now() + 24 * 60 * 60 * 1000
            ).toISOString();
          }

          return res.status(200).json({
            success: true,
            post: foundDraft,
          });
        } catch (error) {
          console.error("Error updating draft status:", error);
          return res.status(500).json({
            success: false,
            message: "Failed to update draft status",
          });
        }

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action",
        });
    }
  } catch (error) {
    console.error("Error in social API:", error);
    return res.status(500).json({
      success: false,
      message: "Server error processing social request",
    });
  }
}

// Helper function to generate posts
async function generatePosts(
  agent: SocialAgent,
  theme: GenerationTheme,
  count: number
): Promise<PostDraft[]> {
  // Mock artist content for generating relevant posts
  const artistContent = {
    recentContent: {
      latestRelease: {
        title: "New Summer Single",
        date: "2023-07-15",
        description: "A catchy summer anthem about road trips and memories",
      },
      upcomingShows: [
        { venue: "The Echo", city: "Los Angeles", date: "2023-08-20" },
        {
          venue: "Bottom of the Hill",
          city: "San Francisco",
          date: "2023-09-15",
        },
      ],
      recentNews:
        "PAPA is back in the studio working on their third full-length album",
    },
  };

  // Mock implementation - in a real app, this would use the actual agent
  // and retrieve content from your storage
  return [
    {
      id: `post_draft_${Date.now()}_1`,
      content: `Excited to announce our new summer single is out now! Stream it everywhere and let us know what you think. #NewMusic #PAPA`,
      suggestedMedia: [
        "bafybeig6hejoldrf5oumqkwtsknxyjxhj2gnc3xo5gmjb4noc6ivxihg3m",
      ],
      votes: 0,
      targetPlatforms: ["twitter", "instagram"],
      status: "draft",
      createdAt: new Date().toISOString(),
    },
    {
      id: `post_draft_${Date.now()}_2`,
      content: `LA - we're coming back to The Echo on August 20th! Tickets on sale this Friday. Who's joining us?`,
      suggestedMedia: [
        "bafybeihrhmymvbfcjtcl7yfvkqbo6visuzpqhjmfvyjl5kpwshla2hswna",
      ],
      votes: 0,
      targetPlatforms: ["instagram", "facebook"],
      status: "draft",
      createdAt: new Date().toISOString(),
    },
    {
      id: `post_draft_${Date.now()}_3`,
      content: `Back in the studio this week working on LP3. These new songs are taking us in exciting directions. Can't wait to share more soon.`,
      votes: 0,
      targetPlatforms: ["twitter", "instagram", "facebook"],
      status: "draft",
      createdAt: new Date().toISOString(),
    },
  ].slice(0, count);
}
