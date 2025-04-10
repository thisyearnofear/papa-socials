import Head from "next/head";
import Image from "next/image";
import Layout from "../../components/Layout";
import {
  useClipAnimation,
  ClipAnimationReturn,
  CustomAnimationOptions,
} from "../../hooks/useClipAnimation";
import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

// Calendar icons for floating animation
const calendarIcons = [
  { icon: "🎸", x: -20, y: -20, rotation: -15 },
  { icon: "🎹", x: 20, y: -30, rotation: 15 },
  { icon: "🎺", x: -15, y: -40, rotation: -20 },
  { icon: "🎷", x: 25, y: -25, rotation: 25 },
];

export default function EventsPage() {
  const [showHint, setShowHint] = useState(true);
  const titleControls = useAnimation();
  const iconsControls = useAnimation();
  const setShowEventsDetails = useState(false)[1];
  const setSelectedEvent = useState<number | null>(null)[1];

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
        // Only show event details when in the 'events' stage
        setShowEventsDetails(newStage === "events");
        if (index !== undefined) {
          setSelectedEvent(index);
        }
      },
    },
    defaultAnimationOptions: {
      gridToContent: {
        contentSelector: ".events-container",
        slideOpacity: 0.1,
        slideScale: 0.85,
        selectedOpacity: 0.9,
        selectedScale: 1.15,
      },
      contentToGrid: {
        contentSelector: ".events-container",
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

      handleSlideClick(0);
    }
  }, [stage, handleSlideClick, titleControls]);

  // Floating animation for calendar icons
  useEffect(() => {
    if (stage === "grid") {
      const floatingAnimation = async () => {
        await iconsControls.start((i) => ({
          y: [0, -20, 0],
          x: [0, calendarIcons[i].x, 0],
          rotate: [0, calendarIcons[i].rotation, 0],
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
        console.log("Title wrapper found, making it clickable");
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
      </Head>

      <Layout>
        <div className="slides" ref={slidesRef}>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/1.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/1.jpg)" }}
            ></div>
          </div>
          <div className="slide slide--current">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/1.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/1.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/1.jpg)" }}
            ></div>
          </div>
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ backgroundImage: "url(/img/demo3/1.jpg)" }}
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
                {/* Floating calendar icons */}
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

        {/* Events Container - appears after slide selection */}
        <AnimatePresence>
          {stage === "events" && (
            <motion.div
              className="events-container"
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
                  ease: "easeInOut",
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
              <div className="events-header">
                <button
                  className="events-back"
                  onClick={(e) => {
                    e.preventDefault();
                    // Call toggleEffect directly - the onStageChange callback will handle hiding the events
                    toggleEffect({
                      // Custom options for transitioning back to grid view
                      contentSelector: ".events-container",
                      onCompleteCallback: () => {
                        console.log("Successfully returned to grid view");
                      },
                    } as CustomAnimationOptions);
                  }}
                >
                  Back
                </button>
              </div>

              <div className="events-content">
                <div
                  className="event-list"
                  style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "20px",
                  }}
                >
                  {/* Event 1 - Africa Rising Music Conference */}
                  <div
                    className="event-item"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginBottom: "40px",
                      padding: "20px",
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "20px",
                        width: "100%",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          width: "200px",
                          height: "200px",
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src="/img/demo3/2.jpg"
                          alt="Africa Rising Music Conference"
                          fill
                          style={{ objectFit: "cover", borderRadius: "8px" }}
                        />
                      </div>

                      <div
                        className="event-date"
                        style={{
                          textAlign: "center",
                          padding: "10px",
                          borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        <span
                          className="event-month"
                          style={{
                            display: "block",
                            fontSize: "clamp(1rem, 2vw, 1.25rem)",
                            fontWeight: "bold",
                          }}
                        >
                          MAY
                        </span>
                        <span
                          className="event-day"
                          style={{
                            display: "block",
                            fontSize: "clamp(1.5rem, 3vw, 2rem)",
                            fontWeight: "bold",
                          }}
                        >
                          22
                        </span>
                        <span
                          className="event-year"
                          style={{
                            display: "block",
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                          }}
                        >
                          2025
                        </span>
                      </div>

                      <div
                        className="event-details"
                        style={{
                          flex: 1,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
                            marginBottom: "10px",
                          }}
                        >
                          ARMC 2025
                        </h3>
                        <p
                          className="event-location"
                          style={{
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                            marginBottom: "8px",
                          }}
                        >
                          11 Kotze street, Braamfontein Joburg, SA
                        </p>
                        <p
                          className="event-time"
                          style={{
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                            marginBottom: "8px",
                          }}
                        >
                          Thu 09:30 - Fri 23:59
                        </p>
                        <p
                          className="event-description"
                          style={{
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                            marginBottom: "15px",
                          }}
                        >
                          Presented by Africa Rising Music Conference 2025
                        </p>
                        <a
                          href="https://ra.co/events/2110727"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="event-tickets"
                          style={{
                            display: "inline-block",
                            padding: "8px 16px",
                            backgroundColor: "transparent",
                            border: "1px solid white",
                            color: "white",
                            borderRadius: "4px",
                            textDecoration: "none",
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                            transition: "all 0.3s ease",
                          }}
                        >
                          Get Tickets
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Event 2 - Bassline Fest */}
                  <div
                    className="event-item"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginBottom: "40px",
                      padding: "20px",
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: "20px",
                        width: "100%",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          width: "200px",
                          height: "200px",
                          position: "relative",
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src="/img/demo3/3.jpg"
                          alt="Bassline Fest"
                          fill
                          style={{ objectFit: "cover", borderRadius: "8px" }}
                        />
                      </div>

                      <div
                        className="event-date"
                        style={{
                          textAlign: "center",
                          padding: "10px",
                          borderRight: "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        <span
                          className="event-month"
                          style={{
                            display: "block",
                            fontSize: "clamp(1rem, 2vw, 1.25rem)",
                            fontWeight: "bold",
                          }}
                        >
                          MAY
                        </span>
                        <span
                          className="event-day"
                          style={{
                            display: "block",
                            fontSize: "clamp(1.5rem, 3vw, 2rem)",
                            fontWeight: "bold",
                          }}
                        >
                          24-25
                        </span>
                        <span
                          className="event-year"
                          style={{
                            display: "block",
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                          }}
                        >
                          2025
                        </span>
                      </div>

                      <div
                        className="event-details"
                        style={{
                          flex: 1,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
                            marginBottom: "10px",
                          }}
                        >
                          Bassline Fest 2025
                        </h3>
                        <p
                          className="event-location"
                          style={{
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                            marginBottom: "8px",
                          }}
                        >
                          Constitutional Hill, Johannesburg, South Africa
                        </p>
                        <p
                          className="event-time"
                          style={{
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                            marginBottom: "8px",
                          }}
                        >
                          Sat & Sun - All Day
                        </p>
                        <p
                          className="event-description"
                          style={{
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                            marginBottom: "15px",
                          }}
                        >
                          Presented by Bassline Fest 2025
                        </p>
                        <a
                          href="https://bassline.co.za/bassline-fest/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="event-tickets"
                          style={{
                            display: "inline-block",
                            padding: "8px 16px",
                            backgroundColor: "transparent",
                            border: "1px solid white",
                            color: "white",
                            borderRadius: "4px",
                            textDecoration: "none",
                            fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                            transition: "all 0.3s ease",
                          }}
                        >
                          Get Tickets
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Support Information with centered styling */}
                  <div
                    className="support-info"
                    style={{
                      textAlign: "center",
                      maxWidth: "800px",
                      margin: "40px auto",
                      padding: "20px",
                    }}
                  >
                    <p
                      className="support-text"
                      style={{
                        fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
                        marginBottom: "20px",
                        lineHeight: "1.6",
                      }}
                    >
                      Papa is supported by PRS Foundation&apos;s International
                      Showcase Fund, which is run by PRS Foundation in
                      partnership with Department of Business and Trade (DBT),
                      British Underground, Arts Council England, British
                      Council, The Musicians&apos; Union (MU), PPL, Creative
                      Scotland, Wales Arts International and Arts Council of
                      Northern Ireland
                    </p>
                    <div className="support-logo">
                      <Image
                        src="/ISF.png"
                        alt="International Showcase Fund Logo"
                        width={200}
                        height={100}
                        style={{ margin: "0 auto" }}
                      />
                    </div>
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
