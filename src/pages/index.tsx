import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation, ClipAnimationReturn } from "../../hooks/useClipAnimation";
import React, { useState } from "react";
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
    handleSlideClick 
  }: ClipAnimationReturn = useClipAnimation({
    initialStage: 'initial',
    stages: ['initial', 'grid', 'discography'],
    callbacks: {
      onStageChange: (newStage: string) => {
        console.log(`Music page transitioned to ${newStage} stage`);
        if (newStage !== 'discography') {
          setActiveRelease(null);
        }
      }
    },
    defaultAnimationOptions: {
      gridToContent: {
        contentSelector: '.discography-container',
        slideOpacity: 0.1,
        slideScale: 0.85,
        selectedOpacity: 0.9,
        selectedScale: 1.15
      },
      contentToGrid: {
        contentSelector: '.discography-container'
      }
    }
  });
  
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
            beaming with afro
           soul, latin rhythms, europa animus, funk & blues.
          </p>
          <motion.button 
            className="cover__button unbutton" 
            onClick={(e) => {
              // Create ripple effect
              const button = e.currentTarget;
              const ripple = document.createElement('span');
              const rect = button.getBoundingClientRect();
              const size = Math.max(rect.width, rect.height);
              const x = e.clientX - rect.left - size / 2;
              const y = e.clientY - rect.top - size / 2;
              
              ripple.className = 'ripple';
              ripple.style.width = ripple.style.height = `${size}px`;
              ripple.style.left = `${x}px`;
              ripple.style.top = `${y}px`;
              
              button.appendChild(ripple);
              
              // Stop the flashing animation when clicked
              button.style.animation = 'none';
              
              // Add a final flash effect
              button.animate([
                { filter: 'brightness(1.5)', transform: 'translateY(-5px) scale(1.12)' },
                { filter: 'brightness(1.2)', transform: 'translateY(-5px) scale(1.08)' }
              ], {
                duration: 300,
                easing: 'ease-out'
              });
              
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
                ease: "easeOut"
              }
            }}
            whileTap={{ 
              scale: 0.95, 
              y: 2, 
              boxShadow: "0 0 0 3px rgba(245, 212, 145, 0.5), 0 5px 10px rgba(0, 0, 0, 0.3)"
            }}
          >
            <span style={{ position: "relative", zIndex: 2 }}>EXPLORE</span>
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
              style={{ visibility: 'visible', opacity: 1 }}
            >
              <div className="discography-header">
                <h2>DISCOGRAPHY</h2>
                <button className="discography-back" onClick={(e) => { e.preventDefault(); toggleEffect(); }}>
                  ← Back to music
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
