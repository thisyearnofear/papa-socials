import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation } from "../../hooks/useClipAnimation";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { allReleases, albums, eps } from "../../data/lyrics";
import DiscographyItem from "../../components/DiscographyItem";

export default function MusicPage() {
  const { clipRef, clipImageRef, slidesRef, titleRef, toggleEffect, isEffectActive } =
    useClipAnimation();
  const [showDiscography, setShowDiscography] = useState(false);
  const [activeRelease, setActiveRelease] = useState<string | null>(null);
  
  // Show discography after animation completes
  useEffect(() => {
    if (isEffectActive) {
      const timer = setTimeout(() => {
        setShowDiscography(true);
      }, 1200); // Match with animation duration
      return () => clearTimeout(timer);
    } else {
      setShowDiscography(false);
      setActiveRelease(null);
    }
  }, [isEffectActive]);
  
  const handleReleaseSelect = (releaseId: string) => {
    setActiveRelease(releaseId === activeRelease ? null : releaseId);
  };

  return (
    <>
      <Head>
        <title>PAPA | Music</title>
        <meta
          name="description"
          content="British-Kenyan singer-songwriter PAPA's music beams with afro inspired gospel, latino rhythms alongside that europa spiritus animus."
        />
        <meta
          name="keywords"
          content="PAPA, music, lyrics, afro, gospel, latino, british-kenyan, singer-songwriter"
        />
      </Head>

      <Layout>
        <div className="slides" ref={slidesRef}>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo1/2.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo1/3.jpg)" }}
            ></div>
          </div>
          <div className="slide slide--current">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo1/1.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo1/4.jpg)" }}
            ></div>
          </div>
          <div className="slide">
            <div
              className="slide__img"
              style={{ backgroundImage: "url(/img/demo1/5.jpg)" }}
            ></div>
          </div>
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ backgroundImage: "url(/img/demo1/1.jpg)" }}
          ></div>
        </div>

        <div className="cover">
          <h2 className="cover__title" ref={titleRef} data-splitting>
            Music
          </h2>
          <p className="cover__description">
            British-Kenyan singer-songwriter whose music beams with afro
            inspired gospel, latino rhythms alongside that europa spiritus
            animus.
          </p>
          <motion.button 
            className="cover__button unbutton" 
            onClick={toggleEffect}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Music
          </motion.button>
        </div>
        
        {/* Discography Section - appears after animation effect */}
        <AnimatePresence>
          {showDiscography && (
            <motion.div 
              className="discography-section visible"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="discography-container">
                <div className="discography-header">
                  <h2>Discography</h2>
                  <button className="discography-back" onClick={toggleEffect}>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path 
                        fill="currentColor" 
                        d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                      />
                    </svg>
                    Back to Music
                  </button>
                </div>
                
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
