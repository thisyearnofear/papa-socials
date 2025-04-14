import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "../components/Layout";
import { OptimizedImage } from "../components/OptimizedImage";
import {
  useClipAnimation,
  ClipAnimationReturn,
} from "../hooks/useClipAnimation";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

// Archive-related icons for floating animation
const archiveIcons = [
  { icon: "🗃️", delay: 0 },
  { icon: "📁", delay: 0.1 },
  { icon: "🖼️", delay: 0.2 },
  { icon: "🎵", delay: 0.3 },
];

// Dynamically import the new IntegratedArchive component with client-side only rendering
const IntegratedArchive = dynamic(
  () => import("../components/IntegratedArchive"),
  {
    ssr: false,
    loading: () => (
      <div className="loading-container archive-preload">
        <div className="loading-spinner"></div>
        <p>Preparing interactive experience...</p>
      </div>
    ),
  }
);

const ArchivePage = () => {
  // Make sure we're in the browser before rendering
  const [isMounted, setIsMounted] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [isContentPreloaded, setIsContentPreloaded] = useState(false);
  const titleControls = useAnimation();
  const iconsControls = useAnimation();

  const {
    clipRef,
    clipImageRef,
    slidesRef,
    titleRef,
    toggleEffect,
    stage,
    handleSlideClick,
  }: ClipAnimationReturn = useClipAnimation({
    initialStage: "initial",
    stages: ["initial", "grid", "archive"],
    callbacks: {
      onStageChange: (newStage: string) => {
        console.log(`Archive page transitioned to ${newStage} stage`);
      },
    },
    defaultAnimationOptions: {
      gridToContent: {
        contentSelector: ".archive-container",
        slideOpacity: 0.1,
        slideScale: 0.85,
        selectedOpacity: 0.9,
        selectedScale: 1.15,
      },
      contentToGrid: {
        contentSelector: ".archive-container",
      },
    },
  });

  useEffect(() => {
    setIsMounted(true);

    // Preload the content after a short delay
    const preloadTimer = setTimeout(() => {
      setIsContentPreloaded(true);
    }, 1000);

    return () => clearTimeout(preloadTimer);
  }, []);

  // Floating animation for archive icons
  useEffect(() => {
    if (stage === "grid") {
      iconsControls.start((i) => ({
        y: [-5, 5],
        transition: {
          duration: 1.5,
          ease: "easeInOut",
          delay: archiveIcons[i].delay,
          repeat: Infinity,
          repeatType: "reverse",
        },
      }));
    }
  }, [stage, iconsControls]);

  // Enhanced title click handler with animation
  const handleTitleClick = useCallback(() => {
    if (stage === "grid") {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      titleControls.start({
        scale: 1.05,
        transition: { duration: 0.2 },
      });

      handleSlideClick(0);
    }
  }, [stage, handleSlideClick, titleControls]);

  // Auto-hide hint after delay
  useEffect(() => {
    if (showHint && stage === "grid") {
      const timer = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint, stage]);

  // Handle back to grid from archive
  const handleBackToGrid = useCallback(() => {
    toggleEffect({
      contentSelector: ".archive-container",
    });
  }, [toggleEffect]);

  return (
    <>
      <Head>
        <title>PAPA | Interactive Archive</title>
        <meta
          name="description"
          content="Explore PAPA's interactive archive featuring fan verification, artist catalogue, and social media hub"
        />
      </Head>

      <Layout>
        <div
          className={`slides ${stage === "grid" ? "grid" : ""}`}
          ref={slidesRef}
        >
          {[1, 1, 1, 1, 1].map((_, index) => (
            <motion.div
              key={index}
              className={`slide ${index === 2 ? "slide--current" : ""}`}
              onClick={() => stage === "grid" && handleSlideClick(index)}
              style={{
                cursor: stage === "grid" ? "pointer" : "default",
              }}
              whileHover={
                stage === "grid"
                  ? {
                      scale: 1.02,
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
                      transition: { duration: 0.3 },
                    }
                  : {}
              }
            >
              <div className="slide__img">
                <OptimizedImage
                  src="/img/archive/bg.jpg"
                  alt={`Archive slide ${index + 1}`}
                  asBackground
                  priority={index < 2}
                  quality={85}
                  fallbackSrc="/img/demo1/1.jpg"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="clip" ref={clipRef}>
          <div className="clip__img" ref={clipImageRef}>
            <OptimizedImage
              src="/img/archive/bg.jpg"
              alt="Main archive image"
              asBackground
              priority
              quality={90}
              fallbackSrc="/img/demo1/1.jpg"
            />
          </div>
        </div>

        <div className="cover">
          <div
            className={`title-wrapper ${stage === "grid" ? "interactive" : ""}`}
            style={{
              position: "relative",
              padding: "20px",
              minHeight: "120px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {stage === "grid" && (
              <>
                {/* Floating archive icons */}
                {archiveIcons.map((icon, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    animate={iconsControls}
                    style={{
                      position: "absolute",
                      fontSize: "24px",
                      opacity: 0.8,
                      pointerEvents: "none",
                      willChange: "transform",
                    }}
                  >
                    {icon.icon}
                  </motion.div>
                ))}

                {/* Interactive hint */}
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        position: "absolute",
                        top: "-30px",
                        color: "white",
                        fontSize: "14px",
                        textAlign: "center",
                        width: "100%",
                        pointerEvents: "none",
                      }}
                    >
                      explore the interactive archive
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            <motion.h2
              className={`cover__title ${
                stage === "grid" ? "interactive-title" : ""
              }`}
              onClick={handleTitleClick}
              ref={titleRef}
              data-splitting
              animate={titleControls}
              whileHover={
                stage === "grid"
                  ? {
                      scale: 1.05,
                      transition: { duration: 0.2 },
                    }
                  : {}
              }
              style={{
                cursor: stage === "grid" ? "pointer" : "default",
                padding: "20px",
                position: "relative",
                textAlign: "center",
                fontSize:
                  stage === "grid" ? "clamp(2rem, 8vw, 4rem)" : undefined,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              }}
            >
              Archive
            </motion.h2>
          </div>
          <p className="cover__description">
            fan verification, artist catalogue, social media hub
          </p>
          <motion.button
            className="cover__button unbutton"
            onClick={(e) => {
              e.preventDefault();
              toggleEffect();
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.8,
                ease: "easeOut",
              },
            }}
            whileHover={{
              scale: 1.05,
              y: -5,
              transition: { duration: 0.2 },
            }}
            whileTap={{
              scale: 0.95,
              y: 0,
            }}
            style={{
              position: "relative",
              padding: "16px 32px",
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              fontWeight: "600",
              letterSpacing: "0.05em",
              background: "rgba(255, 255, 255, 0.1)",
              border: "2px solid rgba(255, 255, 255, 0.8)",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              overflow: "hidden",
              textTransform: "uppercase",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <motion.div
              className="button-highlight"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.5, 1, 0.5],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              style={{
                position: "absolute",
                top: "-100%",
                left: "-100%",
                right: "-100%",
                bottom: "-100%",
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <motion.span
              style={{
                position: "relative",
                zIndex: 1,
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Enter Archive</span>
              <motion.span
                animate={{
                  x: [0, 5, 0],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                🔎
              </motion.span>
            </motion.span>
          </motion.button>
        </div>

        {/* Archive Content */}
        <AnimatePresence mode="wait">
          {isMounted && stage === "archive" && (
            <motion.div
              className="archive-container"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.5 },
              }}
              exit={{
                opacity: 0,
                transition: { duration: 0.3 },
              }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: "20px",
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                zIndex: 1000,
                overflow: "auto",
              }}
            >
              {/* Integrated Archive component that combines all functionality */}
              <IntegratedArchive onBackClick={handleBackToGrid} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preload the integrated archive content */}
        {isMounted && isContentPreloaded && stage !== "archive" && (
          <div className="preloaded-content" style={{ display: "none" }}>
            <IntegratedArchive onBackClick={handleBackToGrid} />
          </div>
        )}

        {/* Loading state only if we're not showing animations yet */}
        {!isMounted && !stage && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading archive data...</p>
          </div>
        )}
      </Layout>

      <style jsx global>{`
        .interactive-title {
          position: relative;
          z-index: 100;
          transition: all 0.3s ease;
        }

        .interactive-title::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -10px;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: white;
          transition: width 0.3s ease;
        }

        .interactive-title:hover::after {
          width: 80%;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
          color: white;
        }

        .archive-preload {
          height: 200px;
          margin-top: 50px;
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

        @media (max-width: 768px) {
          .interactive {
            padding: 30px;
          }

          .interactive-title {
            padding: 15px 30px !important;
          }

          .interactive::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(
              circle at center,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 70%
            );
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .interactive:active::before {
            opacity: 1;
          }

          .archive-container {
            padding: 10px;
          }
        }
      `}</style>
    </>
  );
};

export default ArchivePage;
