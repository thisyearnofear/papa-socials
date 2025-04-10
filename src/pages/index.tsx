import Head from "next/head";
import Layout from "../../components/Layout";
import Image from "next/image";
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

  // Track if title is clickable
  const [isTitleClickable, setIsTitleClickable] = useState(false);

  // Handle title click in grid stage
  const handleTitleClick = () => {
    if (stage === "grid") {
      console.log("Title clicked in grid stage");
      // Use the first slide (index 0) for transition
      handleSlideClick(0);
    }
  };

  useEffect(() => {
    console.log("Current stage:", stage);

    // Make title clickable in grid stage
    setIsTitleClickable(stage === "grid");

    // Simplified effect - only handle basic stage changes
    if (stage === "grid") {
      // Find and hide the initial cover button to prevent it from blocking clicks
      const coverButton = document.querySelector(".cover__button");
      if (coverButton) {
        coverButton.setAttribute(
          "style",
          "display: none; pointer-events: none;"
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
  }, [stage, handleSlideClick]);

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
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                <Image
                  src={`/img/demo1/${num}.jpg`}
                  alt={`Music slide ${num}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                  priority={index < 2} // Prioritize loading for first two slides
                  quality={75}
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEDQIHXG8H/QAAAABJRU5ErkJggg=="
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ position: "relative" }}
          >
            <Image
              src="/img/demo1/1.jpg"
              alt="Main cover image"
              fill
              priority={true}
              quality={90}
              sizes="100vw"
              style={{ objectFit: "cover" }}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEDQIHXG8H/QAAAABJRU5ErkJggg=="
            />
          </div>
        </div>

        <div className="cover">
          <div className="title-wrapper">
            <h2
              className={`cover__title ${
                isTitleClickable ? "pulse-title" : ""
              }`}
              onClick={handleTitleClick}
              ref={titleRef}
              data-splitting
              style={{ cursor: isTitleClickable ? "pointer" : "default" }}
            >
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

              // Remove ripple after animation completes - safely
              setTimeout(() => {
                // Check if ripple is still a child of button before removing
                if (ripple && ripple.parentNode === button) {
                  button.removeChild(ripple);
                }
              }, 600);

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
              className="discography-view-container"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                transition: {
                  duration: 0.5,
                  ease: "easeOut"
                }
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
                    marginBottom: "40px"
                  }}
                >
                  <h3 style={{ 
                    color: "#fff",
                    marginBottom: "20px"
                  }}>Albums</h3>
                  <div 
                    className="discography-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
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
                    marginBottom: "40px"
                  }}
                >
                  <h3 style={{ 
                    color: "#fff",
                    marginBottom: "20px"
                  }}>EPs</h3>
                  <div 
                    className="discography-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                      gap: "20px",
                      padding: "10px"
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
    </>
  );
}
