import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFilecoin } from "../contexts/filecoin-context";
import { AIProvider } from "../contexts/ai/ai-context";
import ArchiveContent from "./ArchiveContent";
import { VerificationPortal } from "./ai/VerificationPortal";
import { SocialTerminal } from "./ai/SocialTerminal";

interface IntegratedArchiveProps {
  onBackClick: () => void;
}

// Sample images for thumbnails since IPFS is not loading correctly
const sampleImages = [
  "/img/archive/bg.jpg",
  "/icons/ISF.png",
  "/images/papa_band.jpg",
  "/images/papa_cover.jpg",
  "/images/papa_stage.jpg",
  "/images/papa_studio.jpg",
];

const IntegratedArchive: React.FC<IntegratedArchiveProps> = ({
  onBackClick,
}) => {
  // State for managing which sections are expanded
  const [activeSection, setActiveSection] = useState<string>("verification");
  const [verificationComplete, setVerificationComplete] =
    useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showArchiveDetails, setShowArchiveDetails] = useState<boolean>(false);

  // Get user information from Filecoin context
  const { userSpace, isInitialized } = useFilecoin();

  // Handle verification completion
  const handleVerificationComplete = (result: any) => {
    console.log("Verification result:", result);
    setVerificationResult(result);
    setVerificationComplete(true);

    // If verification was successful, show a success message and enable other sections
    if (result.success && result.accessGranted) {
      setActiveSection("social");
    }
  };

  // Simplified archive component
  const SimplifiedArchive = () => {
    return (
      <div className="simplified-archive">
        <div className="archive-info">
          <div className="archive-status">
            {isInitialized ? (
              <div className="status connected">
                <span className="status-icon">✓</span>
                <span>Connected to {userSpace?.spaceName || "Archive"}</span>
              </div>
            ) : (
              <div className="status disconnected">
                <span className="status-icon">⚠</span>
                <span>Not connected to any archive</span>
              </div>
            )}
          </div>

          <div className="archive-gallery">
            {sampleImages.map((img, index) => (
              <div
                key={index}
                className="gallery-item"
                onClick={() => setActiveSection("archive")}
              >
                <div
                  className="gallery-thumbnail"
                  style={{ backgroundImage: `url(${img})` }}
                >
                  <div className="gallery-overlay">
                    <span className="gallery-icon">🔍</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="archive-actions">
            <button
              className="action-button view-button"
              onClick={() => setActiveSection("archive")}
            >
              <span className="button-icon">🗃️</span>
              View Full Archive
            </button>
            {!isInitialized && (
              <button
                className="action-button connect-button"
                onClick={() => setActiveSection("archive")}
              >
                <span className="button-icon">🔌</span>
                Connect to Archive
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="integrated-archive">
      {/* Header with back button and title */}
      <header className="archive-header">
        <button className="archive-back-button" onClick={onBackClick}>
          ← Back
        </button>
        <h1 className="archive-title">PAPA Digital Archive</h1>
        <div className="archive-header-spacer"></div>
      </header>

      {/* Vertical stack of components */}
      <div className="archive-stack">
        {/* Section 1: Internal Terminal - Verification Portal */}
        <motion.section
          className="archive-panel internal-terminal"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="panel-header">
            <h2>Fan Verification Terminal</h2>
            <button
              className="toggle-button"
              onClick={() =>
                setActiveSection(
                  activeSection === "verification" ? "archive" : "verification"
                )
              }
            >
              {activeSection === "verification" ? "Minimize" : "Expand"}
            </button>
          </div>

          <motion.div
            className="panel-content conversational-ui"
            animate={{
              height: activeSection === "verification" ? "auto" : "100px",
              overflow: activeSection === "verification" ? "auto" : "hidden",
            }}
            transition={{ duration: 0.4 }}
          >
            {isInitialized ? (
              <AIProvider>
                <div className="verification-portal-wrapper">
                  <VerificationPortal
                    difficulty={1}
                    userId={userSpace?.spaceDid || "anonymous"}
                    onComplete={handleVerificationComplete}
                  />
                </div>
              </AIProvider>
            ) : (
              <div className="verification-login-prompt">
                <p>
                  Connect to the archive to verify your fan status and unlock
                  all features.
                </p>
                <button
                  className="connect-button"
                  onClick={() => setActiveSection("archive")}
                >
                  Connect to Archive
                </button>
              </div>
            )}
          </motion.div>
        </motion.section>

        {/* Section 2: Data Repository - Archive Content */}
        <motion.section
          className="archive-panel data-repository"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="panel-header">
            <h2>Digital Asset Archive</h2>
            <button
              className="toggle-button"
              onClick={() =>
                setActiveSection(
                  activeSection === "archive" ? "verification" : "archive"
                )
              }
            >
              {activeSection === "archive" ? "Minimize" : "Expand"}
            </button>
          </div>

          <motion.div
            className="panel-content"
            animate={{
              height: activeSection === "archive" ? "auto" : "200px",
              overflow: activeSection === "archive" ? "auto" : "hidden",
            }}
            transition={{ duration: 0.4 }}
          >
            {activeSection !== "archive" ? (
              <SimplifiedArchive />
            ) : (
              <div className="archive-content-wrapper">
                <ArchiveContent onBackClick={() => {}} />
              </div>
            )}
          </motion.div>
        </motion.section>

        {/* Section 3: External Terminal - Social Media */}
        <motion.section
          className="archive-panel external-terminal"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="panel-header">
            <h2>Social Media Terminal</h2>
            <button
              className="toggle-button"
              onClick={() =>
                setActiveSection(
                  activeSection === "social" ? "verification" : "social"
                )
              }
              disabled={
                !verificationComplete && !verificationResult?.accessGranted
              }
            >
              {activeSection === "social" ? "Minimize" : "Expand"}
            </button>
          </div>

          <motion.div
            className="panel-content conversational-ui"
            animate={{
              height: activeSection === "social" ? "auto" : "100px",
              overflow: activeSection === "social" ? "auto" : "hidden",
            }}
            transition={{ duration: 0.4 }}
          >
            {(verificationComplete && verificationResult?.accessGranted) ||
            true ? (
              <AIProvider>
                <div className="social-terminal-wrapper">
                  <SocialTerminal userId={userSpace?.spaceDid || "anonymous"} />
                </div>
              </AIProvider>
            ) : (
              <div className="social-terminal-locked">
                <div className="locked-icon">🔒</div>
                <p>
                  Complete fan verification to unlock social media content
                  generation.
                </p>
                <button
                  className="verify-now-button"
                  onClick={() => setActiveSection("verification")}
                >
                  Verify Now
                </button>
              </div>
            )}
          </motion.div>
        </motion.section>
      </div>

      {/* Styles */}
      <style jsx>{`
        .integrated-archive {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          flex-direction: column;
          color: white;
          padding: 0 1rem;
        }

        .archive-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 2rem;
        }

        .archive-title {
          font-size: 1.8rem;
          margin: 0;
          text-align: center;
          background: linear-gradient(to right, #00a4ff, #60efff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }

        .archive-back-button {
          padding: 0.5rem 1rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .archive-back-button:hover {
          background: rgba(0, 0, 0, 0.5);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .archive-header-spacer {
          width: 80px; /* Balance the header with back button */
        }

        .archive-stack {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .archive-panel {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          position: relative;
          width: 100%;
        }

        .archive-panel:hover {
          border-color: rgba(255, 255, 255, 0.2);
        }

        .internal-terminal {
          border-left: 4px solid rgba(0, 255, 170, 0.5);
        }

        .data-repository {
          border-left: 4px solid rgba(255, 216, 0, 0.5);
        }

        .external-terminal {
          border-left: 4px solid rgba(255, 64, 129, 0.5);
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel-header h2 {
          margin: 0;
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.9);
        }

        .toggle-button {
          padding: 0.4rem 0.8rem;
          background: rgba(0, 164, 255, 0.15);
          border: 1px solid rgba(0, 164, 255, 0.3);
          color: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s ease;
        }

        .toggle-button:hover {
          background: rgba(0, 164, 255, 0.25);
        }

        .toggle-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .panel-content {
          overflow: auto;
          padding: 0;
          position: relative;
        }

        .conversational-ui {
          /* Add styles to make the UI more conversational */
          background: rgba(0, 0, 0, 0.2);
          border-radius: 0 0 12px 12px;
        }

        /* Simplified Archive Styles */
        .simplified-archive {
          padding: 1.5rem;
          height: 100%;
        }

        .archive-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .archive-status {
          text-align: center;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .status.connected {
          background: rgba(0, 200, 83, 0.15);
          border: 1px solid rgba(0, 200, 83, 0.3);
        }

        .status.disconnected {
          background: rgba(255, 100, 100, 0.15);
          border: 1px solid rgba(255, 100, 100, 0.3);
        }

        .status-icon {
          font-size: 1.1rem;
        }

        .archive-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .gallery-item {
          cursor: pointer;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 1;
          transition: transform 0.2s ease;
        }

        .gallery-item:hover {
          transform: translateY(-4px);
        }

        .gallery-thumbnail {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          background-color: rgba(0, 0, 0, 0.2);
          position: relative;
        }

        .gallery-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .gallery-item:hover .gallery-overlay {
          opacity: 1;
        }

        .gallery-icon {
          font-size: 1.5rem;
        }

        .archive-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.2rem;
          border-radius: 30px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background: rgba(0, 0, 0, 0.5);
          transform: translateY(-2px);
        }

        .view-button {
          background: rgba(255, 216, 0, 0.15);
          border: 1px solid rgba(255, 216, 0, 0.3);
        }

        .view-button:hover {
          background: rgba(255, 216, 0, 0.25);
        }

        .connect-button {
          background: rgba(0, 164, 255, 0.15);
          border: 1px solid rgba(0, 164, 255, 0.3);
        }

        .connect-button:hover {
          background: rgba(0, 164, 255, 0.25);
        }

        .button-icon {
          font-size: 1.2rem;
        }

        /* Archive Content Wrapper */
        .archive-content-wrapper {
          height: 100%;
          overflow: auto;
        }

        /* Verification & Social styles */
        .verification-portal-wrapper,
        .social-terminal-wrapper {
          height: 100%;
          overflow: auto;
          padding: 0.5rem;
        }

        .verification-login-prompt,
        .social-terminal-locked {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .locked-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          opacity: 0.7;
        }

        .verify-now-button {
          background: linear-gradient(45deg, #0088ff, #00a4ff);
          color: white;
          border: none;
          border-radius: 30px;
          padding: 0.5rem 1.5rem;
          margin-top: 1rem;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .verify-now-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 164, 255, 0.3);
        }

        @media (max-width: 768px) {
          .integrated-archive {
            padding: 0 0.5rem;
          }

          .archive-title {
            font-size: 1.5rem;
          }

          .panel-header {
            padding: 0.8rem 1rem;
          }

          .panel-header h2 {
            font-size: 1rem;
          }

          .archive-stack {
            gap: 1rem;
          }

          .archive-panel {
            border-radius: 8px;
          }

          .archive-gallery {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          }
        }
      `}</style>
    </div>
  );
};

export default IntegratedArchive;
