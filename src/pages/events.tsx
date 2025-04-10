import Head from "next/head";
import Image from "next/image";
import Layout from "../../components/Layout";
import {
  useClipAnimation,
  ClipAnimationReturn,
  CustomAnimationOptions,
} from "../../hooks/useClipAnimation";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EventsPage() {
  // State is used in the onStageChange callback
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
              style={{ backgroundImage: "url(/img/demo3/2.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/3.jpg)" }}
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
              style={{ backgroundImage: "url(/img/demo3/4.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo3/5.jpg)" }}
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
          <div className="title-wrapper">
            <h2 className="cover__title" ref={titleRef} data-splitting>
              Events
            </h2>
          </div>
          <p className="cover__description">
            performances, concerts, festivals
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

              setTimeout(() => {
                button.removeChild(ripple);
              }, 600);

              e.preventDefault();
              toggleEffect();
            }}
          >
            <span style={{ position: "relative", zIndex: 2 }}>VIEW</span>
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
                <div className="event-list">
                  {/* Event 1 - Africa Rising Music Conference */}
                  <div className="event-item">
                    <div className="event-date">
                      <span className="event-month">MAY</span>
                      <span className="event-day">22</span>
                      <span className="event-year">2025</span>
                    </div>
                    <div className="event-details">
                      <h3>Africa Rising Music Conference 2025</h3>
                      <p className="event-location">
                        Constitution Hill, 11 Kotze street, Braamfontein
                        Johannesburg, South Africa
                      </p>
                      <p className="event-time">Thu 09:30 - Fri 23:59</p>
                      <p className="event-description">
                        Presented by Africa Rising Music Conference 2025
                      </p>
                      <a
                        href="https://ra.co/events/2110727"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="event-tickets"
                      >
                        Get Tickets
                      </a>
                    </div>
                  </div>

                  {/* Event 2 - Bassline Fest */}
                  <div className="event-item">
                    <div className="event-date">
                      <span className="event-month">MAY</span>
                      <span className="event-day">24-25</span>
                      <span className="event-year">2025</span>
                    </div>
                    <div className="event-details">
                      <h3>Bassline Fest 2025</h3>
                      <p className="event-location">
                        Constitutional Hill, Johannesburg, South Africa
                      </p>
                      <p className="event-time">Sat & Sun - All Day</p>
                      <p className="event-description">
                        Presented by Bassline Fest 2025
                      </p>
                      <a
                        href="https://bassline.co.za/bassline-fest/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="event-tickets"
                      >
                        Get Tickets
                      </a>
                    </div>
                  </div>

                  {/* Support Information */}
                  <div className="support-info">
                    <p className="support-text">
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
                      />
                    </div>
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
