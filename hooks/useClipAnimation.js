import { useEffect, useRef, useState } from 'react';

export function useClipAnimation() {
  const clipRef = useRef(null);
  const clipImageRef = useRef(null);
  const slidesRef = useRef(null);
  const titleRef = useRef(null);
  const [stage, setStage] = useState('initial'); // 'initial', 'grid', or 'discography'
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);
  
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
    if (isAnimating || !window.gsap || stage !== 'initial') return;
    setIsAnimating(true);
    
    const titleChars = titleRef.current.querySelectorAll('.char');
    const slides = slidesRef.current.querySelectorAll('.slide');
    
    window.gsap.timeline({
      defaults: {
        duration: 1.2,
        ease: 'power4.inOut',
      },
      onComplete: () => {
        setIsAnimating(false);
        setStage('grid');
        
        // Make slides clickable
        slides.forEach((slide, index) => {
          slide.style.cursor = 'pointer';
          slide.onclick = () => handleSlideClick(index);
        });
      }
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
    .fromTo(slides, {
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
    if (isAnimating || !window.gsap || stage === 'initial') return;
    setIsAnimating(true);
    
    const titleChars = titleRef.current.querySelectorAll('.char');
    const slides = slidesRef.current.querySelectorAll('.slide');
    
    // Remove click handlers
    slides.forEach(slide => {
      slide.style.cursor = 'default';
      slide.onclick = null;
    });

    window.gsap.timeline({
      defaults: {
        duration: 1.2,
        ease: 'power4.inOut',
      },
      onComplete: () => {
        setIsAnimating(false);
        setStage('initial');
        setSelectedSlide(null);
      }
    })
    .addLabel('start', 0)
    .set(titleChars, {transformOrigin: '50% 0%'})
    .to(clipRef.current, {
      clipPath: 'inset(0% 0% round 0vw)',
    }, 'start')
    .to(clipImageRef.current, {
      scale: 1
    }, 'start')
    .to(slides, {
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
  
  const handleSlideClick = (index) => {
    if (isAnimating || stage !== 'grid') return;
    setIsAnimating(true);
    
    const container = slidesRef.current;
    if (!container) return;

    const slides = container.querySelectorAll('.slide');
    const coverTitle = titleRef.current;
    const coverDescription = coverTitle?.parentNode?.querySelector('.cover__description');
    const coverButton = coverTitle?.parentNode?.querySelector('.cover__button');
    
    // First, blur and scale all slides with enhanced effect
    const tl = window.gsap.timeline({
      defaults: { duration: 0.7, ease: 'power3.out' },
      onComplete: () => {
        // Delay setting the stage to ensure animation completes first
        setTimeout(() => {
          setIsAnimating(false);
          setSelectedSlide(index);
          setStage('discography');
        }, 100);
      }
    });
    
    // Fade out and blur non-selected slides more intensely
    tl.to(slides, {
      opacity: 0.15, // More transparent
      scale: 0.9,    // Scale down more
      filter: 'blur(15px)', // More blur
      stagger: { amount: 0.2, from: index }
    })
    // Highlight the selected slide
    .to(slides[index], {
      opacity: 0.8,  // Still slightly transparent to help discography visibility
      scale: 1.15,   // Scale up more
      filter: 'blur(0px)',
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.5')
    // Move selected slide up
    .to(slides[index], {
      y: -40,        // Move up more
      duration: 0.5,
      ease: 'power2.out'
    }, '-=0.5')
    // Hide the cover title, description, and button
    .to([coverTitle, coverDescription, coverButton], {
      opacity: 0,
      y: -20,
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.05
    }, '-=0.6');
  };

  const toggleEffect = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    if (stage === 'initial') {
      // Initial to grid animation
      showSlider();
    } else if (stage === 'grid') {
      // Grid to initial animation
      showPreview();
    } else if (stage === 'discography') {
      // Discography to grid animation
      const coverTitle = titleRef.current;
      const coverDescription = coverTitle?.parentNode?.querySelector('.cover__description');
      const coverButton = coverTitle?.parentNode?.querySelector('.cover__button');
      
      const tl = window.gsap.timeline({
        onComplete: () => {
          setIsAnimating(false);
          setStage('grid');
        },
      });

      // Show the cover title, description, and button first
      tl.to([coverTitle, coverDescription, coverButton], {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.05
      })
      // Then reset slides
      .to(slidesRef.current.querySelectorAll('.slide'), {
        duration: 0.5,
        ease: 'power3.out',
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
        stagger: 0.05,
      }, '-=0.3');
    }
  };
  
  return {
    clipRef,
    clipImageRef,
    slidesRef,
    titleRef,
    toggleEffect,
    selectedSlide,
    stage,
    handleSlideClick,
    isEffectActive: stage !== 'initial'
  };
}
