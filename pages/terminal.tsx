import React, { useState, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";
import { motion } from "framer-motion";
import { useFilecoin } from "../contexts/filecoin-context";

// Dynamically import the AIProvider with client-side only rendering
const AIProvider = dynamic(
  () => import("../contexts/ai/ai-context").then((mod) => mod.AIProvider),
  { ssr: false }
);

// Dynamically import the SocialTerminal with client-side only rendering
const SocialTerminal = dynamic(
  () =>
    import("../components/ai/SocialTerminal").then((mod) => mod.SocialTerminal),
  {
    ssr: false,
    loading: () => (
      <div className="terminal-loading">
        <div className="loading-spinner"></div>
        <p>Loading social terminal...</p>
      </div>
    ),
  }
);

const TerminalPage = () => {
  // Animation and state
  const [isMounted, setIsMounted] = useState(false);

  // Get Filecoin context for user info
  const { userSpace, isInitialized } = useFilecoin();

  // Client-side initialization
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading social terminal...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Social Terminal | PAPA</title>
        <meta
          name="description"
          content="Vote on PAPA's social media content and influence their online presence"
        />
      </Head>

      <motion.div
        className="terminal-page-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {!isInitialized ? (
          <div className="terminal-login-prompt">
            <h2>Fan Access Required</h2>
            <p>
              Log in to the archive and verify yourself as a fan to access the
              PAPA social media terminal.
            </p>
            <div className="login-buttons">
              <button onClick={() => (window.location.href = "/archive")}>
                Go to Archive
              </button>
              <button onClick={() => (window.location.href = "/verify")}>
                Fan Verification
              </button>
            </div>
          </div>
        ) : (
          <AIProvider>
            <SocialTerminal userId={userSpace?.spaceDid || "anonymous"} />
          </AIProvider>
        )}
      </motion.div>

      <style jsx>{`
        .terminal-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .terminal-login-prompt {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          max-width: 600px;
          margin: 4rem auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .terminal-login-prompt h2 {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          background: linear-gradient(to right, #00a4ff, #60efff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .terminal-login-prompt p {
          margin-bottom: 2rem;
          font-size: 1.2rem;
          line-height: 1.5;
          opacity: 0.9;
        }

        .login-buttons {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
        }

        .login-buttons button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .login-buttons button:first-child {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .login-buttons button:first-child:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }

        .login-buttons button:last-child {
          background: linear-gradient(to right, #00a4ff, #60efff);
          color: #111;
        }

        .login-buttons button:last-child:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 164, 255, 0.3);
        }

        @media (max-width: 768px) {
          .terminal-page-container {
            padding: 1rem;
          }

          .terminal-login-prompt {
            padding: 2rem 1rem;
            margin: 2rem auto;
          }

          .terminal-login-prompt h2 {
            font-size: 2rem;
          }

          .login-buttons {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </Layout>
  );
};

export default TerminalPage;
