import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { getReleaseYear } from "../data/discography"; // Assuming you have this helper

const DiscographyItem = ({ release, isActive, onSelect }) => {
  // Debug the release data
  // console.log('Release data:', release); // Keep for debugging if needed
  const [showLyrics, setShowLyrics] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Handle ESC key to close lyrics modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        // ESC key
        handleClose();
      }
    };

    if (showLyrics) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = "hidden";
    }

    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleEsc);
      // Restore body scrolling when modal closes or component unmounts
      document.body.style.overflow = "";
    };
  }, [showLyrics]); // Dependency array includes showLyrics

  const handleTrackClick = (track) => {
    setSelectedTrack(track);
    setShowLyrics(true);
  };

  const handleClose = () => {
    setShowLyrics(false);
    // Wait for animation to complete before clearing the track
    setTimeout(() => setSelectedTrack(null), 300); // Match animation duration
  };

  // Get release year from the release date - ensure getReleaseYear is correctly imported/defined
  const releaseYear = release.releaseDate
    ? getReleaseYear(release.releaseDate)
    : "N/A";

  // Enhanced animations for the discography item
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        delay: 0.1, // Small delay to ensure container animation completes first
      },
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    active: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
      },
    },
  };

  // Enhanced animations for modal components
  const modalBackdropVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  const modalContentVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.95,
      clipPath: "inset(10% 10% round 10px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      clipPath: "inset(0% 0% round 0px)",
      transition: {
        duration: 0.8,
        ease: "easeOut",
        clipPath: {
          duration: 1,
          ease: "easeInOut",
        },
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      clipPath: "inset(10% 10% round 10px)",
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      className={`discography-item ${
        isActive ? "discography-item--active" : ""
      }`}
      onClick={() => onSelect(release.id)}
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      layout
      style={{ zIndex: 30 }} // Ensure it's above other elements
      whileHover="hover"
    >
      <div className="discography-item__inner">
        <motion.div
          className="discography-item__cover"
          style={{
            backgroundColor: "rgba(50, 50, 50, 0.5)", // Fallback background color
            position: "relative",
            overflow: "hidden",
          }}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={release.coverImage || "/img/placeholder-cover.jpg"}
            alt={`${release.title} cover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{
              objectFit: "cover",
              objectPosition: "center",
            }}
            priority={isActive} // Prioritize loading for active items
            quality={isActive ? 85 : 75} // Higher quality for active items
            placeholder="blur"
            blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEDQIHXG8H/QAAAABJRU5ErkJggg=="
          />
        </motion.div>
        <div className="discography-item__info">
          <h3>{release.title}</h3>
          <span className="discography-item__type">
            {release.type === "ep" ? "EP" : "Album"} • {releaseYear}
          </span>
          <p className="discography-item__description">{release.description}</p>

          {isActive &&
            release.tracks &&
            release.tracks.length > 0 && ( // Ensure tracks exist
              <motion.div
                className="discography-item__tracks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h4>Tracks</h4>
                <ul>
                  {release.tracks.map((track, index) => (
                    <motion.li
                      key={track.id || index} // Use index as fallback key
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering onSelect for the whole item
                        handleTrackClick(track);
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + index * 0.03 }}
                      whileHover={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)", // Slightly lighter hover
                        x: 4, // Indent on hover
                        transition: { duration: 0.15 },
                      }}
                      className="track-list-item" // Add class for styling if needed
                    >
                      <span className="track-number">{track.trackNumber}.</span>{" "}
                      {track.title}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
        </div>
      </div>

      {/* Lyrics Modal */}
      <AnimatePresence>
        {showLyrics && selectedTrack && (
          <motion.div
            className="lyrics-modal" // This is the backdrop/overlay
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose} // Close when clicking backdrop
            style={{ position: "fixed", inset: 0, zIndex: 1000 }} // Ensure it covers screen
          >
            {/* This is the actual modal content container */}
            <motion.div
              className="lyrics-modal-content" // Use a different class for the content box
              variants={modalContentVariants}
              onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking content
            >
              <motion.button
                className="close-button"
                onClick={handleClose} // Close button action
                whileHover={{
                  scale: 1.1,
                  rotate: 90,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                ×
              </motion.button>
              <motion.h3
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }} // Match content animation delay
              >
                {selectedTrack.title}
              </motion.h3>

              {/* === UPDATED LYRICS RENDERING === */}
              <motion.div
                className="lyrics-content-scrollable" // Renamed for clarity, contains the mapped lyrics
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }} // Slightly later delay
              >
                {selectedTrack.lyrics && selectedTrack.lyrics.length > 0 ? (
                  selectedTrack.lyrics.map((line, index) => {
                    const trimmedLine = line.trim();

                    if (trimmedLine === "") {
                      return (
                        <div
                          key={`${selectedTrack.id}-spacer-${index}`}
                          className="lyrics-spacer"
                        ></div>
                      );
                    }

                    if (trimmedLine === "———") {
                      return (
                        <div
                          key={`${selectedTrack.id}-separator-${index}`}
                          className="lyrics-separator"
                        >
                          ———
                        </div>
                      );
                    }

                    // Updated header regex - adjust as needed for all your variations
                    const headerPattern =
                      /^(Verse|Chorus|Bridge|Pre|Intro|Outro|Middle 8|Coda|Anthem|Papa|Gabriel|Kallay|Anatu|Gonzalo \(feature\)|Pre Chorus|\[.*?\]|CHORUS.*|VERSE|END)/i;
                    const isHeader = headerPattern.test(trimmedLine);

                    if (isHeader) {
                      return (
                        <p
                          key={`${selectedTrack.id}-header-${index}`}
                          className="lyrics-section-header"
                        >
                          {line}
                        </p>
                      );
                    }

                    const annotationMatch = line.match(
                      /(.*?)(\s*\([^)]+\)\s*)$/
                    );
                    if (annotationMatch) {
                      const mainLyric = annotationMatch[1];
                      const annotation = annotationMatch[2];
                      return (
                        <p
                          key={`${selectedTrack.id}-line-${index}`}
                          className="lyrics-line"
                        >
                          {mainLyric}
                          <span className="lyrics-annotation">
                            {annotation}
                          </span>
                        </p>
                      );
                    }

                    return (
                      <p
                        key={`${selectedTrack.id}-line-${index}`}
                        className="lyrics-line"
                      >
                        {line}
                      </p>
                    );
                  })
                ) : (
                  <p className="lyrics-placeholder">
                    Lyrics not available or coming soon...
                  </p>
                )}
              </motion.div>
              {/* === END OF UPDATED LYRICS RENDERING === */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DiscographyItem;
