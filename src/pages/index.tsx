import Head from "next/head";
import Layout from "../../components/Layout";
import {
  useClipAnimation,
  ClipAnimationReturn,
} from "../../hooks/useClipAnimation";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { albums, eps } from "../../data/lyrics";
import DiscographyItem from "../../components/DiscographyItem";

export default function MusicPage() {
  const [activeRelease, setActiveRelease] = useState<string | null>(null);

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
      // Initial to grid transition
      initialToGrid: {
        clipPath: "inset(22% 39% round 23vw)",
        clipScale: 0.8,
        slideDuration: 1.4,
        slideEase: "power2.inOut",
        slideStaggerAmount: 0.15,
        slideStaggerFrom: "center",
        titleDuration: 1,
        titleStaggerAmount: 0.2,
        titleStaggerFrom: "center",
      },
      gridToInitial: {
        clipPath: "inset(0% 0% round 0vw)",
        clipScale: 1,
        slideDuration: 0.8,
        slideEase: "power2.inOut",
        slideStaggerAmount: 0.15,
        slideStaggerFrom: "edges",
        titleDuration: 1,
        titleStaggerAmount: 0.2,
        titleStaggerFrom: "center",
      },
      gridToContent: {
        contentSelector: ".discography-container",
        slideOpacity: 0.2,
        slideScale: 0.85,
        slideBlur: "20px",
        selectedOpacity: 0.9,
        selectedScale: 1.15,
        selectedY: -30,
      },
      contentToGrid: {
        contentSelector: ".discography-container",
      },
    },
  });

  // Handle release selection in discography view
  const handleReleaseSelect = (releaseId: string) => {
    setActiveRelease(releaseId === activeRelease ? null : releaseId);
  };

  useEffect(() => {
    console.log("Current stage:", stage);

    // Add visual cues based on the current stage
    if (stage === "grid") {
      console.log("Adding grid stage effects");

      // Find and hide the initial cover button to prevent it from blocking clicks
      const coverButton = document.querySelector(".cover__button");
      if (coverButton) {
        coverButton.setAttribute(
          "style",
          "display: none; pointer-events: none;"
        );
      }
    }

    // Fix for discography stage scrolling
    if (stage === "discography") {
      console.log("Setting up discography scrolling");

      // Ensure the content is scrollable
      const discographyContent = document.querySelector(".discography-content");
      if (discographyContent) {
        // Force the content to be scrollable
        discographyContent.setAttribute(
          "style",
          "overflow-y: scroll !important; height: calc(100vh - 80px) !important;"
        );

        // Add a small delay to ensure the content is rendered
        setTimeout(() => {
          // Force a scroll event to ensure the browser recognizes the scrollable area
          discographyContent.scrollTop = 1;
          setTimeout(() => {
            discographyContent.scrollTop = 0;
          }, 10);
        }, 100);

        // Add wheel event handler to ensure mouse wheel events are properly handled
        const handleWheel = (e: WheelEvent) => {
          // Prevent the default behavior to ensure our custom scrolling works
          e.preventDefault();

          // Manually scroll the content based on the wheel delta
          discographyContent.scrollTop += e.deltaY;
        };

        // Add the event listener
        document.addEventListener("wheel", handleWheel, { passive: false });

        // Return cleanup function
        return () => {
          document.removeEventListener("wheel", handleWheel);
        };
      }
    }
  }, [stage]);

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
        <div className="slides" ref={slidesRef}>
          {[2, 3, 1, 4, 5].map((num, index) => (
            <motion.div
              key={num}
              className={`slide ${num === 1 ? "slide--current" : ""}`}
              onClick={() => {
                if (stage === "grid") {
                  handleSlideClick(index, {
                    onCompleteCallback: () => {
                      console.log(
                        "Slide clicked, transitioning to discography view"
                      );
                    },
                  });
                }
              }}
              style={{
                cursor: stage === "grid" ? "pointer" : "default",
              }}
              whileHover={
                stage === "grid"
                  ? {
                      scale: 1.02,
                      transition: { duration: 0.2 },
                    }
                  : {}
              }
            >
              <div
                className="slide__img"
                style={{ backgroundImage: `url(/img/demo1/${num}.jpg)` }}
              />
            </motion.div>
          ))}
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ backgroundImage: "url(/img/demo1/1.jpg)" }}
          ></div>
        </div>

        <div className="cover">
          <div className="title-wrapper">
            <h2 className="cover__title" ref={titleRef} data-splitting>
              Music
            </h2>
          </div>
          <p className="cover__description">
            beaming with afro soul, latin rhythms, europa animus, funk & blues.
          </p>
          <motion.button
            className="cover__button unbutton"
            onClick={(e) => {
              // Create ripple effect
              const button = e.currentTarget;
              const ripple = document.createElement("span");
              const rect = button.getBoundingClientRect();
              const size = Math.max(rect.width, rect.height);
              const x = e.clientX - rect.left - size / 2;
              const y = e.clientY - rect.top - size / 2;

              ripple.className = "ripple";
              ripple.style.width = ripple.style.height = `${size}px`;
              ripple.style.left = `${x}px`;
              ripple.style.top = `${y}px`;

              button.appendChild(ripple);

              // Stop the flashing animation when clicked
              button.style.animation = "none";

              // Add a final flash effect
              button.animate(
                [
                  {
                    filter: "brightness(1.5)",
                    transform: "translateY(-5px) scale(1.12)",
                  },
                  {
                    filter: "brightness(1.2)",
                    transform: "translateY(-5px) scale(1.08)",
                  },
                ],
                {
                  duration: 300,
                  easing: "ease-out",
                }
              );

              // Remove ripple after animation completes
              setTimeout(() => ripple.remove(), 600);

              // Call the original toggle effect
              toggleEffect();
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: 1.2,
                ease: "easeOut",
              },
            }}
            whileTap={{
              scale: 0.95,
              y: 2,
              boxShadow:
                "0 0 0 3px rgba(245, 212, 145, 0.5), 0 5px 10px rgba(0, 0, 0, 0.3)",
            }}
          >
            <span style={{ position: "relative", zIndex: 2 }}>EXPLORE</span>
          </motion.button>
        </div>

        {/* Discography Section - appears after slide selection */}
        <AnimatePresence
          mode="wait"
          onExitComplete={() => console.log("Discography container exited")}
        >
          {stage === "discography" && (
            <motion.div
              className="discography-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{
                opacity: 0,
                transition: { duration: 0.3 },
              }}
            >
              <div className="discography-header">
                <h2>DISCOGRAPHY</h2>
                <button
                  className="discography-back"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("Back button clicked");
                    toggleEffect();
                  }}
                >
                  ← BACK TO MUSIC
                </button>
              </div>

              <div className="discography-content">
                <div className="discography-category">
                  <h3>Albums</h3>
                  <div className="discography-grid">
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

                <div className="discography-category">
                  <h3>EPs</h3>
                  <div className="discography-grid">
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
    </>
  );
}
