import Head from "next/head";
import Layout from "../components/Layout";
import {
  useClipAnimation,
  ClipAnimationReturn,
} from "../hooks/useClipAnimation";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { OptimizedImage } from "../components/OptimizedImage";
import dynamic from "next/dynamic";

// Dynamically import EventsContent with no server-side rendering
const EventsContent = dynamic(() => import("../components/EventsContent"), {
  ssr: false,
});

// Simplified calendar icons for floating animation
const calendarIcons = [
  { icon: "🎸", delay: 0 },
  { icon: "🎹", delay: 0.1 },
  { icon: "🎺", delay: 0.2 },
  { icon: "🎷", delay: 0.3 },
];

export default function EventsPage() {
  const [showHint, setShowHint] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const titleControls = useAnimation();
  const iconsControls = useAnimation();
  const setShowEventsDetails = useState(false)[1];
  const setSelectedEvent = useState<number | null>(null)[1];

  // Set isMounted after component mounts to avoid SSR hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Preload the main background image
  useEffect(() => {
    const preloadImage = new globalThis.Image();
    preloadImage.src = "/img/demo3/1.jpg";
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
    initialStage: "initial",
    stages: ["initial", "grid", "events"],
    callbacks: {
      onStageChange: (newStage: string, index?: number) => {
        console.log(`Events page transitioned to ${newStage} stage`);
        setShowEventsDetails(newStage === "events");
        if (index !== undefined) {
          setSelectedEvent(index);
        }
      },
    },
    defaultAnimationOptions: {
      gridToContent: {
        contentSelector: ".papa-events-container",
        slideOpacity: 0.1,
        slideScale: 0.85,
        selectedOpacity: 0.9,
        selectedScale: 1.15,
      },
      contentToGrid: {
        contentSelector: ".papa-events-container",
      },
    },
  });

  // Simplified floating animation
  useEffect(() => {
    if (stage === "grid") {
      iconsControls.start((i) => ({
        y: [-5, 5],
        transition: {
          duration: 1.5,
          ease: "easeInOut",
          delay: calendarIcons[i].delay,
          repeat: Infinity,
          repeatType: "reverse",
        },
      }));
    }
  }, [stage, iconsControls]);

  // Enhanced title click handler with simplified animation
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

  // Handle toggle effect for returning to grid
  const handleBackClick = useCallback(() => {
    toggleEffect({
      contentSelector: ".papa-events-container",
      onCompleteCallback: () => {
        console.log("Successfully returned to grid view");
      },
    });
  }, [toggleEffect]);

  return (
    <>
      <Head>
        <title>PAPA | Upcoming Events</title>
        <meta
          name="description"
          content="performances, concerts, and festival appearances."
        />
        <meta
          name="keywords"
          content="PAPA, events, concerts, performances, music festivals, live music, tour dates"
        />
        <link rel="preload" as="image" href="/img/demo3/1.jpg" />
      </Head>

      <Layout>
        <div className="slides" ref={slidesRef}>
          {[1, 2, 3, 4, 5].map((_, index) => (
            <div
              key={index}
              className={`slide ${index === 2 ? "slide--current" : ""}`}
              onClick={() => stage === "grid" && handleSlideClick(index)}
              style={{
                cursor: stage === "grid" ? "pointer" : "default",
              }}
            >
              <div className="slide__img">
                <OptimizedImage
                  src="/img/demo3/1.jpg"
                  alt={`Event slide ${index + 1}`}
                  asBackground
                  priority={index < 2}
                  quality={85}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="clip" ref={clipRef}>
          <div className="clip__img" ref={clipImageRef}>
            <OptimizedImage
              src="/img/demo3/1.jpg"
              alt="Main event image"
              asBackground
              priority
              quality={90}
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
                {calendarIcons.map((icon, i) => (
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
                      lets jam
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
              Events
            </motion.h2>
          </div>
          <p className="cover__description">
            performances, concerts, festivals
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
              <span>View</span>
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
                🕺🏾
              </motion.span>
            </motion.span>
          </motion.button>
        </div>

        {/* Events Container - appears after slide selection - Client-side only */}
        {isMounted && stage === "events" && (
          <EventsContent onBackClick={handleBackClick} />
        )}

        <style jsx global>{`
          .interactive-title {
            position: relative;
            z-index: 100;
            transition: all 0.3s ease;
            text-align: center;
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
              display: flex;
              flex-direction: column;
              align-items: center;
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
