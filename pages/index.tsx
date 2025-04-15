import Head from "next/head";
import Layout from "../components/Layout";
import { OptimizedImage } from "../components/OptimizedImage";
import {
  useClipAnimation,
  ClipAnimationReturn,
} from "../hooks/useClipAnimation";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { albums, eps } from "../data/lyrics/index.js";
import dynamic from "next/dynamic";

// Dynamically import DiscographyItem with loading state
const DiscographyItem = dynamic(() => import("../components/DiscographyItem"), {
  loading: () => (
    <div className="album-placeholder">
      <div className="loading-spinner"></div>
    </div>
  ),
});

// Music note positions for the floating animation
const musicNotes = [
  { x: -20, y: -20, rotation: -15 },
  { x: 20, y: -30, rotation: 15 },
  { x: -15, y: -40, rotation: -20 },
  { x: 25, y: -25, rotation: 25 },
];

export default function MusicPage() {
  const [activeRelease, setActiveRelease] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(true);
  const titleControls = useAnimation();
  const notesControls = useAnimation();

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
    stages: ["initial", "discography"],
    callbacks: {
      onStageChange: (newStage: string, index?: number) => {
        console.log(
          `Music page transitioned to ${newStage} stage`,
          index ? `with index ${index}` : ""
        );
        if (newStage !== "discography") {
          setActiveRelease(null);
        }

        // Add a class to the body to help with styling
        if (newStage === "discography") {
          document.body.classList.add("discography-view");
        } else {
          document.body.classList.remove("discography-view");
        }
      },
    },
    defaultAnimationOptions: {
      gridToContent: {
        contentSelector: ".discography-view-container",
        slideOpacity: 0.2,
        slideScale: 0.85,
        slideBlur: "20px",
        selectedOpacity: 0.9,
        selectedScale: 1.15,
        selectedY: -30,
      },
      contentToGrid: {
        contentSelector: ".discography-view-container",
      },
    },
  });

  // Handle release selection in discography view
  const handleReleaseSelect = (releaseId: string) => {
    setActiveRelease(releaseId === activeRelease ? null : releaseId);
  };

  // Enhanced title click handler with haptic feedback
  const handleTitleClick = useCallback(() => {
    if (stage === "initial") {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      titleControls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 },
      });

      // Add a small delay to make the animation visible
      setTimeout(() => {
        console.log("Title clicked, transitioning to discography");
        console.log("Current stage before toggleEffect:", stage);
        toggleEffect();
        console.log("Current stage after toggleEffect:", stage);
      }, 300);
    }
  }, [stage, toggleEffect, titleControls]);

  // Floating animation for music notes
  useEffect(() => {
    if (stage === "initial") {
      const floatingAnimation = async () => {
        await notesControls.start((i) => ({
          y: [0, -20, 0],
          x: [0, musicNotes[i].x, 0],
          rotate: [0, musicNotes[i].rotation, 0],
          transition: {
            duration: 2,
            ease: "easeInOut",
            delay: i * 0.2,
            repeat: Infinity,
            repeatType: "reverse",
          },
        }));
      };
      floatingAnimation();
    }
  }, [stage, notesControls]);

  // Auto-hide hint after delay
  useEffect(() => {
    if (showHint && stage === "initial") {
      const timer = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint, stage]);

  useEffect(() => {
    console.log("Current stage:", stage);
    console.log("toggleEffect function:", toggleEffect);

    // Simplified effect - only handle basic stage changes
    if (stage === "initial") {
      // Make sure the button is visible
      const coverButton = document.querySelector(".cover__button");
      if (coverButton) {
        // Apply the same styling as in the JSX
        coverButton.setAttribute(
          "style",
          `position: relative !important;
           padding: 16px 32px !important;
           font-size: clamp(1rem, 2vw, 1.25rem) !important;
           font-weight: 600 !important;
           letter-spacing: 0.05em !important;
           background: rgba(255, 255, 255, 0.1) !important;
           border: 2px solid rgba(255, 255, 255, 0.8) !important;
           border-radius: 8px !important;
           color: white !important;
           cursor: pointer !important;
           overflow: hidden !important;
           text-transform: uppercase !important;
           box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
           backdrop-filter: blur(10px) !important;
           -webkit-backdrop-filter: blur(10px) !important;
           margin: 20px auto !important;
           display: block !important;
           visibility: visible !important;
           z-index: 100 !important;
           opacity: 1 !important;`
        );
      }

      // Make title wrapper clickable
      const titleWrapper = document.querySelector(".title-wrapper");
      if (titleWrapper) {
        titleWrapper.classList.add("clickable");
        titleWrapper.setAttribute(
          "style",
          "z-index: 9999 !important; position: relative !important; pointer-events: auto !important;"
        );
      }
    } else {
      // Remove clickable styles when not in grid stage
      const titleWrapper = document.querySelector(".title-wrapper");
      if (titleWrapper) {
        titleWrapper.classList.remove("clickable");
        titleWrapper.removeAttribute("style");
      }
    }

    // Basic scrolling setup for discography stage
    if (stage === "discography") {
      const discographyContent = document.querySelector(".discography-content");
      if (discographyContent) {
        // Set basic scrolling styles
        discographyContent.setAttribute(
          "style",
          "overflow-y: auto; height: calc(100vh - 80px);"
        );
      }
    }
  }, [stage, handleSlideClick, toggleEffect]);

  return (
    <>
      <Head>
        <title>PAPA | Music</title>
        <meta
          name="description"
          content="beaming with afro inspired gospel, latino rhythms alongside that europa spiritus animus."
        />
        <meta
          name="keywords"
          content="PAPA, music, lyrics, afro, gospel, latino, british-kenyan, singer-songwriter"
        />
      </Head>

      <Layout>
        <div
          className={`slides ${stage === "initial" ? "grid" : ""}`}
          ref={slidesRef}
        >
          {[1, 1, 1, 1, 1].map((num, index) => (
            <motion.div
              key={index}
              className={`slide ${index === 2 ? "slide--current" : ""}`}
              onClick={() => stage === "initial" && toggleEffect()}
              style={{
                cursor: stage === "initial" ? "pointer" : "default",
              }}
              whileHover={
                stage === "initial"
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
                  src="/img/demo1/1.jpg"
                  alt={`Music slide ${index + 1}`}
                  asBackground
                  priority={index < 2}
                  quality={85}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="clip" ref={clipRef}>
          <div className="clip__img" ref={clipImageRef}>
            <OptimizedImage
              src="/img/demo1/1.jpg"
              alt="Main cover image"
              asBackground
              priority
              quality={90}
            />
          </div>
        </div>

        <div className="cover">
          <div
            className={`title-wrapper ${
              stage === "initial" ? "interactive" : ""
            }`}
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
            {stage === "initial" && (
              <>
                {/* Floating music notes */}
                {musicNotes.map((_, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    animate={notesControls}
                    style={{
                      position: "absolute",
                      fontSize: "24px",
                      color: "white",
                      opacity: 0.8,
                      pointerEvents: "none",
                    }}
                  >
                    ♪
                  </motion.div>
                ))}

                {/* Interactive hint */}
                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
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
                      Tap me
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            <motion.h2
              className={`cover__title ${
                stage === "initial" ? "interactive-title" : ""
              }`}
              onClick={handleTitleClick}
              ref={titleRef}
              data-splitting
              animate={{
                scale: 1,
                boxShadow: [
                  "0 0 0 rgba(255,255,255,0)",
                  "0 0 20px rgba(255,255,255,0.5)",
                  "0 0 0 rgba(255,255,255,0)",
                ],
                transition: {
                  boxShadow: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  },
                },
              }}
              whileHover={{ scale: 1.05 }}
              style={{
                cursor: stage === "initial" ? "pointer" : "default",
                padding: "20px",
                position: "relative",
                textAlign: "center",
                fontSize:
                  stage === "initial" ? "clamp(2rem, 8vw, 4rem)" : undefined,
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                userSelect: "none",
              }}
            >
              Music
            </motion.h2>
          </div>
          <p className="cover__description">
            beaming with afro soul, latin rhythms, europa animus, funk & blues.
          </p>
          <motion.button
            className="cover__button unbutton"
            onClick={(e) => {
              e.preventDefault();
              console.log("Button clicked, transitioning to discography");
              console.log("Current stage before toggleEffect:", stage);
              toggleEffect();
              console.log("Current stage after toggleEffect:", stage);
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
              initial={{ opacity: 0.5 }}
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.05, 1],
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
              <span>Explore</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{
                  x: [0, 5, 0],
                  transition: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
              >
                🕺🏾
              </motion.span>
            </motion.span>
          </motion.button>
        </div>

        {/* Discography Section - appears after slide selection */}
        <AnimatePresence
          mode="wait"
          onExitComplete={() => console.log("Discography container exited")}
        >
          {stage === "discography" && (
            <motion.div
              className="discography-view-container"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: {
                  duration: 0.5,
                  ease: "easeOut",
                },
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
                zIndex: 1000,
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                overflow: "hidden",
                padding: "20px",
                pointerEvents: "auto",
              }}
            >
              <div
                className="discography-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px 0",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  position: "sticky",
                  top: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.95)",
                  zIndex: 1001,
                }}
              >
                <h2 style={{ color: "#fff", margin: 0 }}>DISCOGRAPHY</h2>
                <button
                  className="discography-back"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("Back button clicked");
                    toggleEffect();
                  }}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "4px",
                  }}
                >
                  ← BACK TO MUSIC
                </button>
              </div>

              <div
                className="discography-content"
                style={{
                  overflowY: "auto",
                  overflowX: "hidden",
                  height: "calc(100vh - 100px)",
                  padding: "20px 0",
                  position: "relative",
                  pointerEvents: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <div
                  className="discography-category"
                  style={{
                    marginBottom: "40px",
                  }}
                >
                  <h3
                    style={{
                      color: "#fff",
                      marginBottom: "20px",
                    }}
                  >
                    Albums
                  </h3>
                  <div
                    className="discography-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(250px, 1fr))",
                      gap: "20px",
                      padding: "10px",
                      pointerEvents: "auto",
                    }}
                  >
                    {albums.map((album) => (
                      <DiscographyItem
                        key={album.id}
                        release={album}
                        isActive={activeRelease === album.id}
                        onSelect={handleReleaseSelect}
                      />
                    ))}
                  </div>
                </div>

                <div
                  className="discography-category"
                  style={{
                    marginBottom: "40px",
                  }}
                >
                  <h3
                    style={{
                      color: "#fff",
                      marginBottom: "20px",
                    }}
                  >
                    EPs
                  </h3>
                  <div
                    className="discography-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(250px, 1fr))",
                      gap: "20px",
                      padding: "10px",
                    }}
                  >
                    {eps.map((ep) => (
                      <DiscographyItem
                        key={ep.id}
                        release={ep}
                        isActive={activeRelease === ep.id}
                        onSelect={handleReleaseSelect}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        }
      `}</style>
    </>
  );
}
