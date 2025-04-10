import Head from "next/head";
import Layout from "../../components/Layout";
import {
  useClipAnimation,
  ClipAnimationReturn,
} from "../../hooks/useClipAnimation";
import React, { useEffect, useCallback } from "react";
import { bandMembers } from "../../data/band-members";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

// Music instrument icons for floating animation
const instrumentIcons = [
  { icon: "🎸", x: -20, y: -20, rotation: -15 },
  { icon: "🥁", x: 20, y: -30, rotation: 15 },
  { icon: "🎹", x: -15, y: -40, rotation: -20 },
  { icon: "🎺", x: 25, y: -25, rotation: 25 },
];

export default function BandPage() {
  const [selectedMember, setSelectedMember] = React.useState<number | null>(
    null
  );
  const [showHint, setShowHint] = React.useState(true);
  const [isCoverHidden, setIsCoverHidden] = React.useState(false);
  const titleControls = useAnimation();
  const iconsControls = useAnimation();

  // Use the refactored hook with custom options for band/discography page
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
    stages: ["initial", "grid", "discography"],
    callbacks: {
      onStageChange: (newStage: string) => {
        console.log(`Band page transitioned to ${newStage} stage`);

        // Update state based on stage
        if (newStage === "grid") {
          setIsCoverHidden(true);
        } else {
          setIsCoverHidden(false);
        }
      },
    },
    defaultAnimationOptions: {
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

  // Enhanced title click handler with haptic feedback
  const handleTitleClick = useCallback(() => {
    if (stage === "grid") {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

      titleControls.start({
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 },
      });

      handleSlideClick(0, {
        onCompleteCallback: () => {
          setSelectedMember(bandMembers[0]?.id || null);
        },
      });
    }
  }, [stage, handleSlideClick, titleControls]);

  // Floating animation for instrument icons
  useEffect(() => {
    if (stage === "grid") {
      const floatingAnimation = async () => {
        await iconsControls.start((i) => ({
          y: [0, -20, 0],
          x: [0, instrumentIcons[i].x, 0],
          rotate: [0, instrumentIcons[i].rotation, 0],
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
  }, [stage, iconsControls]);

  // Auto-hide hint after delay
  useEffect(() => {
    if (showHint && stage === "grid") {
      const timer = setTimeout(() => setShowHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint, stage]);

  useEffect(() => {
    const coverButton = document.querySelector(".cover__button");
    if (coverButton) {
      // Hide cover button in grid stage
      if (stage === "grid") {
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
      </Head>

      <Layout>
        {/* Band Members Grid */}
        <div className="slides" ref={slidesRef}>
          {bandMembers.map((member, index) => (
            <div
              key={member.id}
              className={`slide ${index === 0 ? "slide--current" : ""}`}
              onClick={() => {
                if (stage === "grid") {
                  handleSlideClick(index, {
                    onCompleteCallback: () => {
                      setSelectedMember(member.id);
                    },
                  });
                }
              }}
              style={{
                cursor: stage === "grid" ? "pointer" : "default",
              }}
            >
              <div
                className="slide__img"
                style={{ backgroundImage: `url(${member.image})` }}
              >
                {stage === "grid" && (
                  <div className="slide__info">
                    <h3>{member.name}</h3>
                    <p>{member.instrument}</p>
                  </div>
                )}
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
                {/* Floating instrument icons */}
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
                    }}
                  >
                    {icon.icon}
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
                      meet us
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
              The Jim Jams
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
                boxShadow:
                  "0 4px 15px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                margin: "0",
                minWidth: "180px",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                WebkitAppearance: "none",
                appearance: "none",
                transform: "translateZ(0)",
                willChange: "transform, opacity",
                isolation: "isolate",
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
                  animate={{
                    x: [0, 5, 0],
                    transition: {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }}
                  style={{
                    fontSize: "1.2em",
                    lineHeight: 1,
                  }}
                >
                  ✌️
                </motion.span>
              </motion.span>
            </motion.button>
          )}
        </div>

        {/* Band Member Details - appears after slide selection */}
        <AnimatePresence mode="wait">
          {stage === "discography" && selectedMember && (
            <motion.div
              className="band-member-container"
              style={{
                pointerEvents: "auto",
                opacity: 0.8,
                marginLeft: "20px",
                marginRight: "20px",
              }}
              initial={{
                opacity: 0,
                y: 50,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  duration: 0.9,
                  ease: "easeOut",
                  delay: 0.2,
                },
              }}
              exit={{
                opacity: 0,
                y: -50,
                scale: 0.95,
                transition: {
                  duration: 0.6,
                  ease: "easeInOut",
                },
              }}
            >
              <div className="band-member-header">
                <button
                  className="back-button"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleEffect({
                      contentSelector: ".band-member-container",
                      onCompleteCallback: () => {
                        setSelectedMember(null);
                        console.log("Successfully returned to grid view");
                      },
                    });
                  }}
                  style={{
                    position: "absolute",
                    right: "20px",
                    top: "20px",
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    border: "1px solid white",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "4px",
                    zIndex: 1000,
                  }}
                >
                  Back
                </button>
                <h2>BAND MEMBER</h2>
              </div>
              <div className="band-member-content">
                {bandMembers.find((member) => member.id === selectedMember) && (
                  <div className="band-member-details">
                    <div
                      className="band-member-image"
                      style={{
                        backgroundImage: `url(${
                          bandMembers.find(
                            (member) => member.id === selectedMember
                          )?.image
                        })`,
                      }}
                    />
                    <div className="band-member-info">
                      <h3>
                        {
                          bandMembers.find(
                            (member) => member.id === selectedMember
                          )?.name
                        }
                      </h3>
                      <p>
                        {
                          bandMembers.find(
                            (member) => member.id === selectedMember
                          )?.instrument
                        }
                      </p>
                      {bandMembers.find(
                        (member) => member.id === selectedMember
                      )?.isGroupPhoto && (
                        <p className="group-photo-label">Group Photo</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
      </Layout>
    </>
  );
}
