import { useEffect, useRef, useState } from 'react';

export function useClipAnimation() {
  const clipRef = useRef(null);
  const clipImageRef = useRef(null);
  const slidesRef = useRef(null);
  const titleRef = useRef(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    // Initialize Splitting.js
    if (typeof window !== 'undefined' && window.Splitting) {
      window.Splitting();
    }
    
    // Import GSAP dynamically to avoid SSR issues
    const initGSAP = async () => {
      const gsap = (await import('gsap')).default;
      window.gsap = gsap;
    };
    
    initGSAP();
  }, []);
  
  const showSlider = () => {
    if (isAnimating || !window.gsap) return;
    setIsAnimating(true);
    
    const titleChars = titleRef.current.querySelectorAll('.char');
    
    window.gsap.timeline({
      defaults: {
        duration: 1.2,
        ease: 'power4.inOut',
      },
      onComplete: () => setIsAnimating(false)
    })
    .addLabel('start', 0)
    .set(slidesRef.current, {perspective: 1000})
    .set(clipRef.current, {willChange: 'clip-path'})
    .set(titleChars, {transformOrigin: '50% 100%'})
    .to(clipRef.current, {
      clipPath: 'inset(22% 39% round 23vw)',
    }, 'start')
    .to(clipImageRef.current, {
      scale: .8
    }, 'start')
    .fromTo(slidesRef.current.querySelectorAll('.slide:not(.slide--current)'), {
      opacity: 0,
      z: 600
    }, {
      duration: 1.4,
      ease: 'power3.inOut',
      stagger: {
        amount: 0.15,
        from: 'center'
      },
      opacity: 1,
      z: 0,
    }, 'start')
    .to(titleChars, {
      duration: 1,
      scaleY: 0,
      stagger: {
        amount: 0.2,
        from: 'center'
      }
    }, 'start');
  };
  
  const showPreview = () => {
    if (isAnimating || !window.gsap) return;
    setIsAnimating(true);
    
    const titleChars = titleRef.current.querySelectorAll('.char');
    
    window.gsap.timeline({
      defaults: {
        duration: 1.2,
        ease: 'power4.inOut',
      },
      onComplete: () => setIsAnimating(false)
    })
    .addLabel('start', 0)
    .set(titleChars, {transformOrigin: '50% 0%'})
    .to(clipRef.current, {
      clipPath: 'inset(0% 0% round 0vw)',
    }, 'start')
    .to(clipImageRef.current, {
      scale: 1
    }, 'start')
    .to(slidesRef.current.querySelectorAll('.slide:not(.slide--current)'), {
      duration: 0.8,
      ease: 'power3.inOut',
      opacity: 0,
      z: 600,
      stagger: {
        amount: 0.15,
        from: 'edges'
      }
    }, 'start')
    .fromTo(titleChars, {
      scaleY: 0
    }, {
      duration: 1,
      scaleY: 1,
      stagger: {
        amount: 0.2,
        from: 'center'
      }
    }, 'start');
  };
  
  const toggleEffect = () => {
    if (isAnimating) return;
    
    if (isOpen) {
      showSlider();
    } else {
      showPreview();
    }
    
    setIsOpen(!isOpen);
  };
  
  return {
    clipRef,
    clipImageRef,
    slidesRef,
    titleRef,
    toggleEffect
  };
}
