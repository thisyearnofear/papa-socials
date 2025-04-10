import Head from "next/head";
import Layout from "../../components/Layout";
import {
  useClipAnimation,
  ClipAnimationReturn,
} from "../../hooks/useClipAnimation";
import SocialLinks from "../../components/SocialLinks";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import Image from "next/image";

// Social media icons for floating animation
const socialIcons = [
  { icon: "👴🏿", x: -20, y: -20, rotation: -15 },
  { icon: "👴🏾", x: 20, y: -30, rotation: 15 },
  { icon: "👴", x: -15, y: -40, rotation: -20 },
  { icon: "👵🏿", x: 25, y: -25, rotation: 25 },
];

export default function SocialPage() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const titleControls = useAnimation();
  const iconsControls = useAnimation();
  const {
    clipRef,
    clipImageRef,
    slidesRef,
    titleRef,
    toggleEffect,
    handleSlideClick,
    stage,
  }: ClipAnimationReturn = useClipAnimation({
    // Default stages for social page - match the music page flow
    initialStage: "initial",
    stages: ["initial", "grid", "social"],
    // Add callbacks for stage changes to handle UI updates
    callbacks: {
      onStageChange: (newStage: string) => {
        console.log(`Social page transitioned to ${newStage} stage`);
        // Only show social feeds when in the 'social' stage
        setShowSocialFeeds(newStage === "social");
      },
    },
    // Custom animation options specific to social page
    defaultAnimationOptions: {
      gridToContent: {
        // Customize the grid to content transition for social feeds
        contentSelector: ".social-feeds-container",
        slideOpacity: 0.1,
        slideScale: 0.85,
        selectedOpacity: 0.9,
        selectedScale: 1.15,
      },
      contentToGrid: {
        contentSelector: ".social-feeds-container",
      },
    },
  });

  // Add a separate state to control social feeds visibility
  // State is used in the onStageChange callback
  const [, setShowSocialFeeds] = useState(false);

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

      handleSlideClick(0);
    }
  }, [stage, handleSlideClick, titleControls]);

  // Floating animation for social icons
  useEffect(() => {
    if (stage === "grid") {
      const floatingAnimation = async () => {
        await iconsControls.start((i) => ({
          y: [0, -20, 0],
          x: [0, socialIcons[i].x, 0],
          rotate: [0, socialIcons[i].rotation, 0],
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

  // Load social media scripts
  useEffect(() => {
    // Load Instagram widget script
    const instagramScript = document.createElement("script");
    instagramScript.src = "https://cdn.lightwidget.com/widgets/lightwidget.js";
    instagramScript.async = true;
    document.body.appendChild(instagramScript);

    // Create a cleanup function that can only be called once
    let hasCleanedUp = false;
    const cleanup = () => {
      if (hasCleanedUp) return;
      hasCleanedUp = true;

      try {
        if (instagramScript && instagramScript.parentNode) {
          // Remove event listeners first
          instagramScript.onload = null;
          instagramScript.onerror = null;

          // Remove script
          instagramScript.parentNode.removeChild(instagramScript);
        }
      } catch (error) {
        console.warn("Failed to clean up Instagram script:", error);
      }
    };

    // Return cleanup function
    return cleanup;
  }, []);

  // Debug stage changes and add visual cues
  useEffect(() => {
    console.log("Current stage:", stage);

    // Add visual cues based on the current stage
    if (stage === "grid") {
      console.log("Adding clickable title effects for grid stage");

      // Find and hide the initial cover button to prevent it from blocking clicks
      const coverButton = document.querySelector(".cover__button");
      if (coverButton) {
        coverButton.setAttribute(
          "style",
          "display: none; pointer-events: none;"
        );
      }

      // Store ref values in variables to avoid issues in cleanup function
      const titleElementRef = titleRef.current;
      const slidesContainerRef = slidesRef.current;

      // Add pulsing effect to the title to indicate it's clickable
      if (titleElementRef) {
        titleElementRef.classList.add("pulse-title");
      }

      // Make sure the title wrapper is clickable
      const titleWrapper = document.querySelector(".title-wrapper");
      if (titleWrapper) {
        titleWrapper.classList.add("clickable");
        // Use !important to override any other styles
        titleWrapper.setAttribute(
          "style",
          "z-index: 9999 !important; position: relative !important; pointer-events: auto !important;"
        );

        // Add a direct click event listener
        const clickHandler = () => {
          console.log("Title wrapper clicked directly");
          if (stage === "grid") {
            handleSlideClick(0);
          }
        };

        titleWrapper.addEventListener("click", clickHandler);

        // Store the handler for cleanup
        return () => {
          titleWrapper.removeEventListener("click", clickHandler);

          if (titleElementRef) {
            titleElementRef.classList.remove("pulse-title");
          }

          if (titleWrapper) {
            titleWrapper.classList.remove("clickable");
            titleWrapper.removeAttribute("style");
          }
        };
      }

      // Force the grid class to be applied to the slides container
      if (
        slidesContainerRef &&
        !slidesContainerRef.classList.contains("grid")
      ) {
        console.log("Forcing grid class on slides container");
        slidesContainerRef.classList.add("grid");
      }

      // Make sure any potential blocking elements are not blocking
      const slides = document.querySelectorAll(".slides__slide");
      slides.forEach((slide) => {
        slide.setAttribute("style", "pointer-events: none;");
      });
    }

    // Default cleanup function if the titleWrapper wasn't found
    return () => {};
  }, [stage, titleRef, handleSlideClick, slidesRef]);

  // Preload the cover image
  useEffect(() => {
    const preloadImage = new globalThis.Image();
    preloadImage.src = "/img/demo2/1.jpg";
    preloadImage.onload = () => setImageLoaded(true);
  }, []);

  return (
    <>
      <Head>
        <title>PAPA | Connect</title>
        <meta
          name="description"
          content="Connect with PAPA across social media platforms and join the community for exclusive updates and content."
        />
        <meta
          name="keywords"
          content="PAPA, social media, connect, community, music artist"
        />
        {/* Add preload hints for critical images */}
        <link rel="preload" href="/img/demo2/1.jpg" as="image" />
      </Head>

      <Layout>
        <div
          className={`slides ${stage === "grid" ? "grid" : ""}`}
          ref={slidesRef}
        >
          {[1, 1, 1, 1, 1].map((num, index) => (
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
                      scale: 1.03,
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
                      transition: { duration: 0.3 },
                    }
                  : {}
              }
            >
              <div
                className="slide__img"
                style={{
                  backgroundImage: `url(/img/demo2/1.jpg)`,
                  opacity: 1,
                  visibility: "visible",
                }}
              />
            </motion.div>
          ))}
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ position: "relative", width: "100%", height: "100%" }}
          >
            <Image
              src="/img/demo2/1.jpg"
              alt="Connect with PAPA"
              fill
              priority={true}
              quality={85}
              style={{
                objectFit: "cover",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.3s ease-in",
              }}
              sizes="100vw"
              onLoadingComplete={() => setImageLoaded(true)}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
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
                {/* Floating social icons */}
                {socialIcons.map((icon, i) => (
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
                      say hello
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
              Community
            </motion.h2>
          </div>

          <p className="cover__description">
            join the community for exclusive updates and content.
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
              <span>Connect</span>
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
                👊
              </motion.span>
            </motion.span>
          </motion.button>
        </div>

        {/* Social Feeds Container - appears after slide selection */}
        <AnimatePresence>
          {stage === "social" && (
            <motion.div
              className="social-feeds-container"
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
                  delay: 0.2, // Slight delay to ensure slide animation completes
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
              <div className="social-header">
                <button
                  className="social-back"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleEffect({
                      contentSelector: ".social-feeds-container",
                      onCompleteCallback: () => {
                        setShowSocialFeeds(false);
                        console.log("Successfully returned to grid view");
                      },
                    } as const);
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
                <h2>SOCIAL MEDIA</h2>
              </div>

              <div className="social-content">
                <div className="social-section">
                  <h3>LATEST VIDEOS</h3>
                  <div className="video-grid">
                    <div className="video-item">
                      <iframe
                        width="100%"
                        height="315"
                        src="https://www.youtube.com/embed/videoseries?si=IIJqDgSnqLTinvpN&list=PLZWdgN4q31gxh9x-0CmRYAnY3l1kwBgqQ"
                        title="PAPA Music Videos"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      ></iframe>
                      <h4>Music Videos</h4>
                    </div>
                    <div className="video-item">
                      <iframe
                        width="100%"
                        height="315"
                        src="https://www.youtube.com/embed/videoseries?si=ETJ6YL7qztjceoG5&list=PLZWdgN4q31gzgcD3mmFaOlQfH0tVCakYV"
                        title="PAPA Live Performances"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      ></iframe>
                      <h4>Live Performances</h4>
                    </div>
                  </div>
                </div>

                <div className="social-section">
                  <h3>INSTAGRAM</h3>
                  <div className="instagram-container">
                    <iframe
                      src="https://embedsocial.com/api/pro_hashtag/b23de1b71f79c3f908e907fe03337529e3eb0f4b"
                      width="900px"
                      height="1200px"
                    />
                  </div>
                </div>

                <div className="social-section">
                  <h3>CONNECT WITH PAPA</h3>
                  <div className="social-links-grid">
                    <SocialLinks />
                  </div>
                </div>
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
