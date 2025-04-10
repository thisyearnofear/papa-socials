import Head from "next/head";
import Layout from "../../components/Layout";
import {
  useClipAnimation,
  ClipAnimationReturn,
} from "../../hooks/useClipAnimation";
import React, { useEffect } from "react";
import { bandMembers } from "../../data/band-members";
import { motion, AnimatePresence } from "framer-motion";

export default function BandPage() {
  const [selectedMember, setSelectedMember] = React.useState<number | null>(
    null
  );
  const [isTitleClickable, setIsTitleClickable] = React.useState(false);
  const [isCoverHidden, setIsCoverHidden] = React.useState(false);

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
          setIsTitleClickable(true);
          setIsCoverHidden(true);
        } else {
          setIsTitleClickable(false);
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

  // Updated handleTitleClick to use handleSlideClick instead of toggleEffect
  const handleTitleClick = () => {
    if (isTitleClickable && stage === "grid") {
      // Use handleSlideClick with index 0 to trigger the transition to band members view
      handleSlideClick(0, {
        onCompleteCallback: () => {
          // Set the first band member as selected when transitioning
          setSelectedMember(bandMembers[0]?.id || null);
        },
      });
    }
  };

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
          <h2
            className={`cover__title ${isTitleClickable ? "pulse-title" : ""}`}
            onClick={handleTitleClick}
            ref={titleRef}
            data-splitting
          >
            The Jim Jams
          </h2>
          <p className="cover__description">
            A dash of drums here, a pinch of horn there, tablespoon of boiling
            Memphis guitar sprinkled everywhere.
          </p>
          {!isCoverHidden && (
            <button
              className="cover__button unbutton"
              onClick={(e) => {
                e.preventDefault();
                toggleEffect();
              }}
            >
              Meet The Band
            </button>
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
      </Layout>
    </>
  );
}
