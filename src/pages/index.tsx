import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation } from "../../hooks/useClipAnimation";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { albums, eps } from "../../data/lyrics";
import DiscographyItem from "../../components/DiscographyItem";

export default function MusicPage() {
  const { 
    clipRef, 
    clipImageRef, 
    slidesRef, 
    titleRef, 
    toggleEffect, 
    stage,
    selectedSlide,
    handleSlideClick 
  } = useClipAnimation();
  
  const [activeRelease, setActiveRelease] = useState<string | null>(null);
  
  // Handle release selection in discography view
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
          {[2, 3, 1, 4, 5].map((num, index) => (
            <motion.div 
              key={num}
              className={`slide ${num === 1 ? 'slide--current' : ''}`}
              onClick={() => stage === 'grid' && handleSlideClick(index)}
              style={{
                cursor: stage === 'grid' ? 'pointer' : 'default',
              }}
              whileHover={stage === 'grid' ? {
                scale: 1.02,
                transition: { duration: 0.2 }
              } : {}}
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
        
        {/* Discography Section - appears after slide selection */}
        <AnimatePresence>
          {stage === 'discography' && (
            <motion.div 
              className="discography-container"
              initial={{ 
                opacity: 0, 
                y: 50,
                scale: 0.95
              }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1,
                transition: {
                  duration: 0.9,
                  ease: 'easeOut',
                  delay: 0.2 // Slight delay to ensure slide animation completes
                }
              }}
              exit={{ 
                opacity: 0, 
                y: -50,
                scale: 0.95,
                transition: {
                  duration: 0.6,
                  ease: 'easeInOut'
                }
              }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
    </>
  );
}
