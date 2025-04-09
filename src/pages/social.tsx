import Head from "next/head";
import Layout from "../../components/Layout";
import { useClipAnimation, ClipAnimationReturn, CustomAnimationOptions } from "../../hooks/useClipAnimation";
import SocialLinks from "../../components/SocialLinks";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SocialPage() {
  // Use the refactored hook with custom options for social page animations
  const { 
    clipRef, 
    clipImageRef, 
    slidesRef, 
    titleRef, 
    toggleEffect, 
    handleSlideClick, 
    stage
  }: ClipAnimationReturn = useClipAnimation({
    // Default stages for social page - match the music page flow
    initialStage: 'initial',
    stages: ['initial', 'grid', 'social'],
    // Add callbacks for stage changes to handle UI updates
    callbacks: {
      onStageChange: (newStage: string) => {
        console.log(`Social page transitioned to ${newStage} stage`);
        // Only show social feeds when in the 'social' stage
        setShowSocialFeeds(newStage === 'social');
      }
    },
    // Custom animation options specific to social page
    defaultAnimationOptions: {
      gridToContent: {
        // Customize the grid to content transition for social feeds
        contentSelector: '.social-feeds-container',
        slideOpacity: 0.1,
        slideScale: 0.85,
        selectedOpacity: 0.9,
        selectedScale: 1.15
      },
      contentToGrid: {
        contentSelector: '.social-feeds-container'
      }
    }
  });
  
  // Add a separate state to control social feeds visibility
  // State is used in the onStageChange callback
  const [, setShowSocialFeeds] = useState(false);
  
  // Load social media scripts
  useEffect(() => {
    // Load Instagram widget script
    const instagramScript = document.createElement('script');
    instagramScript.src = 'https://cdn.lightwidget.com/widgets/lightwidget.js';
    instagramScript.async = true;
    document.body.appendChild(instagramScript);
    
    return () => {
      // Clean up scripts when component unmounts
      if (document.body.contains(instagramScript)) {
        document.body.removeChild(instagramScript);
      }
    };
  }, []);
  
  // Debug stage changes and add visual cues
  useEffect(() => {
    console.log('Current stage:', stage);
    
    // Add visual cues based on the current stage
    if (stage === 'grid') {
      console.log('Adding clickable title effects for grid stage');
      
      // Find and hide the initial cover button to prevent it from blocking clicks
      const coverButton = document.querySelector('.cover__button');
      if (coverButton) {
        coverButton.setAttribute('style', 'display: none; pointer-events: none;');
      }
      
      // Store ref values in variables to avoid issues in cleanup function
      const titleElementRef = titleRef.current;
      const slidesContainerRef = slidesRef.current;
      
      // Add pulsing effect to the title to indicate it's clickable
      if (titleElementRef) {
        titleElementRef.classList.add('pulse-title');
      }
      
      // Make sure the title wrapper is clickable
      const titleWrapper = document.querySelector('.title-wrapper');
      if (titleWrapper) {
        titleWrapper.classList.add('clickable');
        // Use !important to override any other styles
        titleWrapper.setAttribute('style', 'z-index: 9999 !important; position: relative !important; pointer-events: auto !important;');
        
        // Add a direct click event listener
        const clickHandler = () => {
          console.log('Title wrapper clicked directly');
          if (stage === 'grid') {
            handleSlideClick(0);
          }
        };
        
        titleWrapper.addEventListener('click', clickHandler);
        
        // Store the handler for cleanup
        return () => {
          titleWrapper.removeEventListener('click', clickHandler);
          
          if (titleElementRef) {
            titleElementRef.classList.remove('pulse-title');
          }
          
          if (titleWrapper) {
            titleWrapper.classList.remove('clickable');
            titleWrapper.removeAttribute('style');
          }
        };
      }
      
      // Force the grid class to be applied to the slides container
      if (slidesContainerRef && !slidesContainerRef.classList.contains('grid')) {
        console.log('Forcing grid class on slides container');
        slidesContainerRef.classList.add('grid');
      }
      
      // Make sure any potential blocking elements are not blocking
      const slides = document.querySelectorAll('.slides__slide');
      slides.forEach(slide => {
        slide.setAttribute('style', 'pointer-events: none;');
      });
    }
    
    // Default cleanup function if the titleWrapper wasn't found
    return () => {};
  }, [stage, titleRef, handleSlideClick, slidesRef]);

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
      </Head>

      <Layout>
        <div className={`slides ${stage === 'grid' ? 'grid' : ''}`} ref={slidesRef}>
          {[2, 3, 1, 4, 5].map((num, index) => (
            <motion.div 
              key={num}
              className={`slide ${num === 1 ? 'slide--current' : ''}`}
              onClick={() => stage === 'grid' && handleSlideClick(index)}
              style={{
                cursor: stage === 'grid' ? 'pointer' : 'default',
              }}
              whileHover={stage === 'grid' ? {
                scale: 1.03,
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
                transition: { duration: 0.3 }
              } : {}}
            >
              <div
                className="slide__img"
                style={{ 
                  backgroundImage: `url(/img/demo2/${num}.jpg)`,
                  opacity: 1,
                  visibility: 'visible'
                }}
              />
            </motion.div>
          ))}
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ backgroundImage: "url(/img/demo2/1.jpg)" }}
          ></div>
        </div>

        <div className="clip" ref={clipRef}>
          <div
            className="clip__img"
            ref={clipImageRef}
            style={{ backgroundImage: "url(/img/demo2/1.jpg)" }}
          ></div>
        </div>

        <div className="cover">
          {/* Wrap the title in a div to make it easier to click */}
          <div 
            className={`title-wrapper ${stage === 'grid' ? 'clickable' : ''}`}
            onClick={() => {
              if (stage === 'grid') {
                console.log('Title clicked in grid stage');
                // Trigger transition to social feeds when clicking the title in grid stage
                handleSlideClick(0); // Use index 0 as default
              }
            }}
          >
            <h2 
              className="cover__title" 
              ref={titleRef} 
              data-splitting
            >
              Connect
            </h2>
          </div>
        
          
          <p className="cover__description">
            join the community for exclusive updates and content.
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
            <span style={{ position: "relative", zIndex: 2 }}>CONNECT</span>
          </motion.button>
        </div>
        
        {/* Social Feeds Container - appears after slide selection */}
        <AnimatePresence>
          {stage === 'social' && (
            <motion.div 
              className="social-feeds-container"
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
          <div className="social-header">
            <button className="social-back" onClick={(e) => {
              e.preventDefault();
              // Just call toggleEffect directly - the onStageChange callback will handle hiding the feeds
              toggleEffect({
                // Custom options for transitioning back to grid view
                contentSelector: '.social-feeds-container',
                onCompleteCallback: () => {
                  console.log('Successfully returned to grid view');
                }
              } as CustomAnimationOptions);
            }}>
              Back
            </button>
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
                  src="//lightwidget.com/widgets/9e75cefcf6095363ac548821cb61c61b.html" 
                  scrolling="no" 
                  allowTransparency={true} 
                  className="lightwidget-widget" 
                  style={{ width: '100%', border: 0, overflow: 'hidden' }}
                ></iframe>
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
      </Layout>
    </>
  );
}
