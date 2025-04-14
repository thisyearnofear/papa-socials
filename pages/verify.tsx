import React, { useState, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";
import { useClipAnimation } from "../hooks/useClipAnimation";
import { motion } from "framer-motion";
import { useFilecoin } from "../contexts/filecoin-context";

// Dynamically import the AIProvider with client-side only rendering
const AIProvider = dynamic(
  () => import("../contexts/ai/ai-context").then((mod) => mod.AIProvider),
  { ssr: false }
);

// Dynamically import the VerificationPortal with client-side only rendering
const VerificationPortal = dynamic(
  () =>
    import("../components/ai/VerificationPortal").then(
      (mod) => mod.VerificationPortal
    ),
  {
    ssr: false,
    loading: () => (
      <div className="verification-loading">
        <div className="loading-spinner"></div>
        <p>Loading verification portal...</p>
      </div>
    ),
  }
);

const VerifyPage = () => {
  // Animation and state
  const [isMounted, setIsMounted] = useState(false);
  const { clipPathValue, isAnimating } = useClipAnimation();
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Get Filecoin context for user info
  const { userSpace, isInitialized } = useFilecoin();

  // Client-side initialization
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleVerificationComplete = (result: any) => {
    console.log("Verification result:", result);
    setVerificationResult(result);

    // If verification was successful, redirect to archive after delay
    if (result.success && result.accessGranted) {
      setTimeout(() => {
        window.location.href = "/archive";
      }, 3000);
    }
  };

  if (!isMounted) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading fan verification...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Fan Verification | PAPA</title>
        <meta
          name="description"
          content="Verify yourself as a PAPA fan to access exclusive content"
        />
        <link rel="stylesheet" href="/styles/verification.css" />
      </Head>

      <motion.div
        className="verify-page-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="verify-page-header">
          <h1>Fan Verification</h1>
          <p>Prove you're a true PAPA fan to access exclusive content</p>
        </div>

        {!isInitialized ? (
          <div className="verification-login-prompt">
            <p>Please log in to the archive first to verify your fan status.</p>
            <button onClick={() => (window.location.href = "/archive")}>
              Go to Archive
            </button>
          </div>
        ) : (
          <AIProvider>
            <VerificationPortal
              difficulty={1}
              userId={userSpace?.spaceDid || "anonymous"}
              onComplete={handleVerificationComplete}
            />
          </AIProvider>
        )}
      </motion.div>

      <style jsx>{`
        .verify-page-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
        }

        .verify-page-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .verify-page-header h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
          background: linear-gradient(to right, #00a4ff, #60efff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .verify-page-header p {
          font-size: 1.2rem;
          opacity: 0.8;
        }

        .verification-login-prompt {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .verification-login-prompt p {
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }

        .verification-login-prompt button {
          background: linear-gradient(to right, #00a4ff, #60efff);
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          color: #111;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .verification-login-prompt button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 164, 255, 0.3);
        }
      `}</style>
    </Layout>
  );
};

export default VerifyPage;
