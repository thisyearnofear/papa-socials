import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAI } from "../../contexts/ai/ai-context";
import { PostDraft, GenerationTheme } from "../../agents/social-agent";

interface SocialTerminalProps {
  // onComplete is defined for future implementation but not currently used
  // userId is used for tracking interactions
  userId?: string;
}

export const SocialTerminal: React.FC<SocialTerminalProps> = () => {
  // State management
  const [posts, setPosts] = useState<PostDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"drafts" | "approved" | "posted">(
    "drafts"
  );
  const [generationTheme, setGenerationTheme] = useState<GenerationTheme>({
    topic: "New music",
    tone: "casual",
    includeMedia: true,
    platforms: ["twitter", "instagram"],
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Get AI methods
  const {
    generatePosts,
    getDrafts,
    voteDraft,
    updatePostStatus,
    isLoading: aiIsLoading,
  } = useAI();

  // Fetch posts based on active tab - define before use
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const posts = await getDrafts(
        activeTab === "drafts"
          ? "draft"
          : activeTab === "approved"
          ? "approved"
          : "posted"
      );

      setPosts(posts);
    } catch (err) {
      setError("Error fetching posts. Please try again.");
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, getDrafts]); // Add dependencies

  // Load posts on component mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Generate new posts
  const handleGeneratePosts = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const newPosts = await generatePosts(generationTheme, 3);

      if (activeTab === "drafts" && newPosts.length > 0) {
        setPosts((prevPosts) => [...newPosts, ...prevPosts]);
      }
      setShowThemeModal(false);
    } catch (err) {
      setError("Error generating posts. Please try again.");
      console.error("Error generating posts:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle voting on a post
  const handleVote = async (postId: string, increment: boolean = true) => {
    try {
      const success = await voteDraft(postId, increment);
      if (success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, votes: post.votes + (increment ? 1 : -1) }
              : post
          )
        );
      }
    } catch (err) {
      console.error("Error voting on post:", err);
    }
  };

  // Update post status
  const handleUpdateStatus = async (
    postId: string,
    status: "draft" | "approved" | "posted" | "rejected"
  ) => {
    try {
      const success = await updatePostStatus(postId, status);
      if (success) {
        setPosts((prevPosts) =>
          prevPosts.filter((post) => {
            if (post.id === postId) {
              if (
                (activeTab === "drafts" && status !== "draft") ||
                (activeTab === "approved" && status !== "approved") ||
                (activeTab === "posted" && status !== "posted")
              ) {
                return false;
              }
              return { ...post, status };
            }
            return true;
          })
        );
      }
    } catch (err) {
      console.error("Error updating post status:", err);
    }
  };

  // Render theme selection modal
  const renderThemeModal = () => {
    return (
      <div
        className="theme-modal-overlay"
        onClick={() => setShowThemeModal(false)}
      >
        <motion.div
          className="theme-modal"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3>Generate New Posts</h3>
          <div className="theme-form">
            <div className="form-group">
              <label>Topic</label>
              <select
                value={generationTheme.topic}
                onChange={(e) =>
                  setGenerationTheme((prev) => ({
                    ...prev,
                    topic: e.target.value,
                  }))
                }
              >
                <option value="New music">New Music</option>
                <option value="Tour announcement">Tour Announcement</option>
                <option value="Backstage moments">Backstage Moments</option>
                <option value="Fan appreciation">Fan Appreciation</option>
                <option value="Studio updates">Studio Updates</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tone</label>
              <select
                value={generationTheme.tone}
                onChange={(e) =>
                  setGenerationTheme((prev) => ({
                    ...prev,
                    tone: e.target.value as
                      | "casual"
                      | "professional"
                      | "humorous"
                      | "serious",
                  }))
                }
              >
                <option value="casual">Casual</option>
                <option value="professional">Professional</option>
                <option value="humorous">Humorous</option>
                <option value="serious">Serious</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={generationTheme.includeMedia}
                  onChange={(e) =>
                    setGenerationTheme((prev) => ({
                      ...prev,
                      includeMedia: e.target.checked,
                    }))
                  }
                />
                Include Media Suggestions
              </label>
            </div>

            <div className="form-group">
              <label>Platforms</label>
              <div className="checkbox-group">
                {["twitter", "instagram", "facebook"].map((platform) => (
                  <label key={platform} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={generationTheme.platforms.includes(platform)}
                      onChange={(e) => {
                        const newPlatforms = e.target.checked
                          ? [...generationTheme.platforms, platform]
                          : generationTheme.platforms.filter(
                              (p) => p !== platform
                            );
                        setGenerationTheme((prev) => ({
                          ...prev,
                          platforms: newPlatforms,
                        }));
                      }}
                    />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="modal-cancel"
              onClick={() => setShowThemeModal(false)}
            >
              Cancel
            </button>
            <button
              className="modal-generate"
              onClick={handleGeneratePosts}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate Posts"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // Render a single post card
  const renderPostCard = (post: PostDraft) => {
    const platformIcons = {
      twitter: "🐦",
      instagram: "📷",
      facebook: "👍",
    };

    return (
      <motion.div
        className="post-card"
        key={post.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="post-header">
          <div className="post-platforms">
            {post.targetPlatforms.map((platform) => (
              <span key={platform} className="platform-icon" title={platform}>
                {platformIcons[platform as keyof typeof platformIcons]}
              </span>
            ))}
          </div>
          <div className="post-date">
            {new Date(post.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="post-content">{post.content}</div>

        {post.suggestedMedia && post.suggestedMedia.length > 0 && (
          <div className="post-media">
            <span className="media-label">Suggested Media:</span>
            <div className="media-cids">
              {post.suggestedMedia.map((cid, index) => (
                <a
                  key={index}
                  href={`https://w3s.link/ipfs/${cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="media-cid"
                >
                  View Media {index + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="post-actions">
          <div className="post-votes">
            <button
              className="vote-down"
              onClick={() => handleVote(post.id, false)}
              aria-label="Vote down"
            >
              👎
            </button>
            <span className="vote-count">{post.votes}</span>
            <button
              className="vote-up"
              onClick={() => handleVote(post.id, true)}
              aria-label="Vote up"
            >
              👍
            </button>
          </div>

          <div className="post-status-actions">
            {activeTab === "drafts" && (
              <button
                className="status-button approve"
                onClick={() => handleUpdateStatus(post.id, "approved")}
              >
                Approve
              </button>
            )}
            {activeTab === "approved" && (
              <button
                className="status-button post"
                onClick={() => handleUpdateStatus(post.id, "posted")}
              >
                Post Now
              </button>
            )}
            {(activeTab === "drafts" || activeTab === "approved") && (
              <button
                className="status-button reject"
                onClick={() => handleUpdateStatus(post.id, "rejected")}
              >
                Reject
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Show loading state
  if ((loading || aiIsLoading) && !isGenerating) {
    return (
      <div className="terminal-loading">
        <div className="loading-spinner"></div>
        <p>Loading social content...</p>
      </div>
    );
  }

  return (
    <div className="social-terminal">
      <div className="terminal-header">
        <h2>Social Post Terminal</h2>
        <p className="terminal-description">
          Vote on generated social media content for PAPA
        </p>
      </div>

      <div className="terminal-tabs">
        <button
          className={`terminal-tab ${activeTab === "drafts" ? "active" : ""}`}
          onClick={() => setActiveTab("drafts")}
        >
          Drafts
        </button>
        <button
          className={`terminal-tab ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          Approved
        </button>
        <button
          className={`terminal-tab ${activeTab === "posted" ? "active" : ""}`}
          onClick={() => setActiveTab("posted")}
        >
          Posted
        </button>
        <button
          className="terminal-generate-button"
          onClick={() => setShowThemeModal(true)}
        >
          + Generate New Posts
        </button>
      </div>

      {error && <div className="terminal-error-message">{error}</div>}

      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts-message">
            <p>No posts found in this category.</p>
            {activeTab === "drafts" && (
              <button onClick={() => setShowThemeModal(true)}>
                Generate New Posts
              </button>
            )}
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => renderPostCard(post))}
          </div>
        )}
      </div>

      {/* Theme selection modal */}
      <AnimatePresence>{showThemeModal && renderThemeModal()}</AnimatePresence>
    </div>
  );
};
