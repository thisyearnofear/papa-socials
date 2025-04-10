import React, { useState, useEffect } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";

// Dynamically import both the provider and content with client-side only rendering
const FilecoinProvider = dynamic(
  () =>
    import("../contexts/filecoin-context").then((mod) => mod.FilecoinProvider),
  { ssr: false }
);

const FilecoinArchiveContent = dynamic(
  () => import("../components/FilecoinArchiveContent"),
  { ssr: false }
);

const FilecoinPage = () => {
  // Make sure we're in the browser before rendering
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>PAPA Artist Archive | Filecoin Storage</title>
        <meta
          name="description"
          content="Decentralized artist archive built on Filecoin"
        />
      </Head>

      <Layout>
        {isMounted ? (
          <FilecoinProvider>
            <FilecoinArchiveContent />
          </FilecoinProvider>
        ) : (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading decentralized archive...</p>
          </div>
        )}
      </Layout>

      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: white;
        }

        .loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 4px solid white;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
};

export default FilecoinPage;
