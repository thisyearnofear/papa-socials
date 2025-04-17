import Head from "next/head";
import Layout from "../components/Layout";
import {
  useClipAnimation,
  ClipAnimationReturn,
} from "../hooks/useClipAnimation";
import React, { useEffect, useCallback, useState } from "react";
import { bandMembers } from "../data/band-members";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { OptimizedImage } from "../components/OptimizedImage";
import dynamic from "next/dynamic";

// Dynamically import the BandMemberContent component to avoid hydration issues
const BandMemberContent = dynamic(
  () =>
    import("../components/BandMemberContent").then(
      (mod) => mod.BandMemberContent
    ),
  { ssr: false }
);

// Simplified instrument icons for floating animation
const instrumentIcons = [
  { icon: "🎸", delay: 0 },
  { icon: "🥁", delay: 0.1 },
  { icon: "🎹", delay: 0.2 },
  { icon: "🎺", delay: 0.3 },
];

export default function BandPage() {
  const [selectedMember, setSelectedMember] = React.useState<number | null>(
    null
  );
  const [showHint, setShowHint] = React.useState(true);
  const [isCoverHidden, setIsCoverHidden] = React.useState(false); // Keep this false so the cover is shown
  const [showMemberDetails, setShowMemberDetails] = React.useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const titleControls = useAnimation();
  const iconsControls = useAnimation();

  // Preload the first band member image
  useEffect(() => {
    if (bandMembers.length > 0) {
      const preloadImage = new globalThis.Image();
      preloadImage.src = bandMembers[0].image;
      // No need to track loaded state if we're not using it
    }
  }, []);

  const {
    clipRef,
    clipImageRef,
    slidesRef,
    titleRef,
    toggleEffect,
    handleSlideClick,
    stage,
  }: ClipAnimationReturn = useClipAnimation({
    initialStage: "grid",
    stages: ["initial", "grid", "members"],
    callbacks: {
      onStageChange: (newStage: string, index?: number) => {
        console.log(`Band page transitioned to ${newStage} stage`, index);

        if (newStage === "initial") {
          // We shouldn't normally go to initial stage since we start in grid
          setIsCoverHidden(true);
          setSelectedMember(null);
          setShowMemberDetails(false);
        } else if (newStage === "grid") {
          // This is our starting stage
          setIsCoverHidden(false); // Show the cover
          setSelectedMember(null);
          setShowMemberDetails(false);
          console.log("In grid stage, ready for members view");
        } else if (newStage === "members") {
          setShowMemberDetails(true);
          console.log("Show member details set to true");
          // If an index was provided, set the selected member
          if (index !== undefined && bandMembers[index]) {
            console.log("Setting selected member to:", bandMembers[index].id);
            setSelectedMember(bandMembers[index].id);
          }
        } else {
          setIsCoverHidden(false);
          setShowMemberDetails(false);
        }
      },
    },
    defaultAnimationOptions: {
      initialToGrid: {
        clipPath: "inset(0% 0% round 0vw)",
        clipScale: 0.9,
        slideDuration: 0.4, // Faster duration for quick transition
        slideEase: "power2.out",
        slideStaggerAmount: 0.02, // Minimal staggering
        slideStaggerFrom: "start",
        titleDuration: 0.3, // Faster title animation
        titleStaggerAmount: 0.02, // Minimal staggering
        titleStaggerFrom: "start",
      },
      gridToContent: {
        contentSelector: ".band-member-container",
        slideOpacity: 0.1,
        slideScale: 0.85,
        selectedOpacity: 0.9,
        selectedScale: 1.15,
      },
      contentToGrid: {
        contentSelector: ".band-member-container",
      },
    },
  });

  // Simplified floating animation
  useEffect(() => {
    if (stage === "grid") {
      // Now we start in the grid stage
      iconsControls.start((i) => ({
        y: [-5, 5],
        transition: {
          duration: 1.5,
          ease: "easeInOut",
          delay: instrumentIcons[i].delay,
          repeat: Infinity,
          repeatType: "reverse",
        },
      }));
    }
  }, [stage, iconsControls]);

  // Enhanced title click handler with simplified animation
  const handleTitleClick = useCallback(() => {
    if (stage === "grid") {
      // Now we start in the grid stage
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      titleControls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 },
      });

      console.log("Title clicked, transitioning to members");

      // Since we're already in the grid stage, go directly to members view
      handleSlideClick(0, {
        contentSelector: ".band-member-container",
        onCompleteCallback: () => {
          console.log("Completed transition to members view");
          // Make sure the member details are shown
          setShowMemberDetails(true);
          // Set the selected member
          if (bandMembers[0]) {
            setSelectedMember(bandMembers[0].id);
          }
        },
      });
    }
  }, [
    stage,
    titleControls,
    handleSlideClick,
    setShowMemberDetails,
    setSelectedMember,
    // bandMembers is not needed as a dependency since it's not changing
  ]);

  // Auto-hide hint after delay
  useEffect(() => {
    if (showHint && stage === "grid") {
      // Now we start in the grid stage
      const timer = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint, stage]);

  useEffect(() => {
    const coverButton = document.querySelector(".cover__button");
    if (coverButton) {
      // Hide cover button in initial stage
      if (stage === "initial") {
        coverButton.setAttribute(
          "style",
          "display: none; pointer-events: none;"
        );
      } else {
        // Reset cover button style
        coverButton.setAttribute("style", "");
      }
    }
  }, [stage]);

  const handleMemberClick = useCallback(
    (index: number) => {
      if (stage === "initial") {
        console.log("Clicking band member:", index);
        // Set selected member ID before the transition
        setSelectedMember(bandMembers[index].id);
        console.log("Selected member set to:", bandMembers[index].id);

        // Go directly to members view
        toggleEffect({
          onCompleteCallback: () => {
            console.log("Transition complete for index:", index);
            // State should already be set
          },
        });
      }
    },
    [stage, toggleEffect]
  );

  const handleBackClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("Back button clicked");
      toggleEffect({
        contentSelector: ".band-member-container",
        onCompleteCallback: () => {
          console.log("Toggle effect complete");
          setSelectedMember(null);
        },
      });
    },
    [toggleEffect]
  );

  // For debugging
  useEffect(() => {
    console.log("Current state:", {
      stage,
      selectedMember,
      showMemberDetails,
      isCoverHidden,
    });
  }, [stage, selectedMember, showMemberDetails, isCoverHidden]);

  // Debug element existence
  useEffect(() => {
    if (stage === "members") {
      // Check if the container exists when it should
      const containers = document.querySelectorAll(".band-member-container");
      console.log("Current containers in DOM:", containers.length);
      containers.forEach((container, i) => {
        console.log(
          `Container ${i} display:`,
          window.getComputedStyle(container).display
        );
      });
    }
  }, [stage]);

  // Set isBrowser to true once component mounts
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Ensure the band-member-container exists even for CSS transitions
  useEffect(() => {
    const DEBUG_CONTAINERS = false; // Set to true to log container info

    // Set up MutationObserver to log when band-member-container is added/removed from DOM
    if (DEBUG_CONTAINERS) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            const containers = document.querySelectorAll(
              ".band-member-container"
            );
            console.log(
              `[MutationObserver] Band member containers: ${containers.length}`
            );
          }
        });
      });

      // Start observing the document with the configured parameters
      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    }
  }, []);

  // Debug the current stage and selected member
  useEffect(() => {
    console.log(
      `Band page state update - stage: ${stage}, selectedMember: ${selectedMember}`
    );
  }, [stage, selectedMember]);

  return (
    <>
      <Head>
        <title>PAPA | The Band</title>
        <meta
          name="description"
          content="Meet the talented musicians who collaborate with PAPA to create the unique sound that blends afro inspired gospel, latino rhythms, and European influences. Explore PAPA's discography including albums Distance, Legacy, Rafiki, Down In The Dirt and EPs Zeno and Paradox."
        />
        <meta
          name="keywords"
          content="PAPA, band members, musicians, collaborators, afro gospel, latino rhythms, music artists, Distance, Legacy, Rafiki, Down In The Dirt, Zeno, Paradox, lyrics"
        />
        {/* Preload the first band member image */}
        {bandMembers.length > 0 && (
          <link rel="preload" as="image" href={bandMembers[0].image} />
        )}
      </Head>

      <Layout>
        {/* Band Members Grid */}
        <div className="slides" ref={slidesRef}>
          {bandMembers.map((member, index) => (
            <div
              key={member.id}
              className={`slide ${index === 0 ? "slide--current" : ""}`}
              onClick={() => handleMemberClick(index)}
              style={{
                cursor: stage === "initial" ? "pointer" : "default",
              }}
            >
              <div className="slide__img">
                <OptimizedImage
                  src={member.image}
                  alt={`${member.name}'s photo`}
                  asBackground
                  priority={index === 0}
                  quality={85}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{
              backgroundImage: `url(${bandMembers[0]?.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
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
                {instrumentIcons.map((icon, i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    animate={iconsControls}
                    style={{
                      position: "absolute",
                      fontSize: "20px",
                      opacity: 0.8,
                      pointerEvents: "none",
                      willChange: "transform",
                    }}
                  >
                    {icon.icon}
                  </motion.div>
                ))}

                {/* Interactive hint with simplified animation */}
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
                      jambo
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
              animate={titleControls}
              whileHover={
                stage === "initial"
                  ? {
                      scale: 1.05,
                      transition: { duration: 0.2 },
                    }
                  : {}
              }
              style={{
                cursor: stage === "initial" ? "pointer" : "default",
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
              Jim Jams
            </motion.h2>
          </div>
          <p className="cover__description">
            A dash of drums here, a pinch of horn there, tablespoon of boiling
            Memphis guitar sprinkled everywhere.
          </p>
          {!isCoverHidden && (
            <motion.button
              className="cover__button unbutton"
              onClick={(e) => {
                e.preventDefault();
                console.log("Button clicked, transitioning to members");

                // Since we're already in the grid stage, go directly to members view
                handleSlideClick(0, {
                  contentSelector: ".band-member-container",
                  onCompleteCallback: () => {
                    console.log("Completed transition to members view");
                    // Make sure the member details are shown
                    setShowMemberDetails(true);
                    // Set the selected member
                    if (bandMembers[0]) {
                      setSelectedMember(bandMembers[0].id);
                    }
                  },
                });
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
                margin: "20px auto",
                display: "block",
                zIndex: 9999,
                pointerEvents: "auto",
                visibility: "visible",
                opacity: 1,
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
                  zIndex: 0,
                }}
              />
              <motion.span
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  fontSize: "clamp(1rem, 2vw, 1.25rem)",
                  fontWeight: "600",
                  letterSpacing: "0.05em",
                  color: "white",
                }}
              >
                <span>Meet</span>
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
                  👨‍🎤
                </motion.span>
              </motion.span>
            </motion.button>
          )}
        </div>

        {/* Always include a hidden band-member-container for animations - only on client */}
        {isBrowser && stage !== "members" && (
          <div
            className="band-member-container"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0,
              visibility: "hidden",
              pointerEvents: "none",
              display: "none",
              zIndex: -1,
            }}
          />
        )}

        {/* Band Member Details - appears after slide selection - only on client */}
        {isBrowser && stage === "members" && selectedMember && (
          <BandMemberContent
            selectedMember={selectedMember}
            bandMembers={bandMembers}
            handleBackClick={handleBackClick}
            setSelectedMember={setSelectedMember}
          />
        )}

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

          .member-card.selected {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
          }

          .band-member-container {
            isolation: isolate;
          }

          .band-member-container::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            z-index: -1;
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

            .selected-member {
              flex-direction: column;
            }

            .band-member-image {
              height: 300px !important;
            }

            .band-member-container {
              margin: 0;
              padding-bottom: 60px;
            }

            .band-member-header {
              padding: 15px;
            }

            .back-button {
              font-size: 14px;
              padding: 6px 12px;
            }
          }
        `}</style>
      </Layout>
    </>
  );
}
