import { useState, useEffect } from 'react';
import { useClipAnimation } from './useClipAnimation';

export function useDiscographyAnimation() {
  const [activeReleaseId, setActiveReleaseId] = useState(null);
  const [isDiscographyVisible, setIsDiscographyVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const clipAnimation = useClipAnimation();
  
  // Handle the transition between band view and discography view
  const showDiscography = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    // Use the existing clip animation to transition
    clipAnimation.toggleEffect();
    
    // After animation completes, show the discography
    setTimeout(() => {
      setIsDiscographyVisible(true);
      setIsTransitioning(false);
    }, 1200); // Match this with your animation duration
  };
  
  // Return to band view
  const hidDiscography = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsDiscographyVisible(false);
    
    // After hiding discography, animate back
    setTimeout(() => {
      clipAnimation.toggleEffect();
      setIsTransitioning(false);
    }, 300);
  };
  
  // Select a specific release
  const selectRelease = (releaseId) => {
    if (activeReleaseId === releaseId) {
      setActiveReleaseId(null);
    } else {
      setActiveReleaseId(releaseId);
    }
  };
  
  return {
    ...clipAnimation,
    activeReleaseId,
    isDiscographyVisible,
    isTransitioning,
    showDiscography,
    hidDiscography,
    selectRelease
  };
}
