import { useEffect, useRef, useState, useCallback } from "react";

// Types are exported from the .d.ts file
// No need to re-export them here as they're only used for TypeScript

/**
 * A flexible animation hook for creating clip and transition effects
 * @param {Object} options - Configuration options
 * @param {string} options.initialStage - The initial animation stage
 * @param {Array<string>} options.stages - Array of possible animation stages
 * @param {Object} options.callbacks - Custom callbacks for different stages
 * @param {Object} options.defaultAnimationOptions - Default animation options that can be overridden
 * @returns {Object} Animation controls and state
 */
export function useClipAnimation(options = {}) {
  // Default options
  const {
    initialStage = "initial",
    stages = ["initial", "grid", "content"],
    callbacks = {},
    defaultAnimationOptions = {},
  } = options;

  // Default animation options that can be overridden
  const defaultOptions = {
    // Initial to grid transition options
    initialToGrid: {
      clipPath: "inset(22% 39% round 23vw)",
      clipScale: 0.8,
      slideDuration: 1.4,
      slideEase: "power3.inOut",
      slideStaggerAmount: 0.15,
      slideStaggerFrom: "center",
      titleDuration: 1,
      titleStaggerAmount: 0.2,
      titleStaggerFrom: "center",
    },
    // Grid to initial transition options
    gridToInitial: {
      clipPath: "inset(0% 0% round 0vw)",
      clipScale: 1,
      slideDuration: 0.8,
      slideEase: "power3.inOut",
      slideStaggerAmount: 0.15,
      slideStaggerFrom: "edges",
      titleDuration: 1,
      titleStaggerAmount: 0.2,
      titleStaggerFrom: "center",
    },
    // Grid to content transition options
    gridToContent: {
      slideOpacity: 0.15,
      slideScale: 0.9,
      slideBlur: "15px",
      selectedOpacity: 0.8,
      selectedScale: 1.15,
      selectedY: -40,
      contentSelector: ".discography-container",
      slideDuration: 0.7,
      slideEase: "power3.inOut",
    },
    // Content to grid transition options
    contentToGrid: {
      contentSelector: ".discography-container",
    },
  };

  // Merge default options with user-provided options
  const animationOptions = {
    ...defaultOptions,
    ...defaultAnimationOptions,
  };

  // Refs for animation elements
  const clipRef = useRef(null);
  const clipImageRef = useRef(null);
  const slidesRef = useRef(null);
  const titleRef = useRef(null);

  // State management
  const [stage, setStage] = useState(initialStage);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedSlide, setSelectedSlide] = useState(null);

  useEffect(() => {
    // Initialize Splitting.js if available
    if (typeof window !== "undefined" && window.Splitting) {
      window.Splitting();
    }

    // Import GSAP dynamically to avoid SSR issues
    const initGSAP = async () => {
      const gsap = (await import("gsap")).default;
      window.gsap = gsap;
    };

    initGSAP();
  }, []);

  /**
   * Transition from initial stage to grid stage
   * @param {Object} customOptions - Custom animation options
   */
  const showSlider = useCallback(
    (customOptions = {}) => {
      if (isAnimating || !window.gsap || stage !== initialStage) return;
      setIsAnimating(true);

      // Merge default options with custom options
      const {
        clipPath = animationOptions.initialToGrid.clipPath,
        clipScale = animationOptions.initialToGrid.clipScale,
        slideDuration = animationOptions.initialToGrid.slideDuration,
        slideEase = animationOptions.initialToGrid.slideEase,
        slideStaggerAmount = animationOptions.initialToGrid.slideStaggerAmount,
        slideStaggerFrom = animationOptions.initialToGrid.slideStaggerFrom,
        titleDuration = animationOptions.initialToGrid.titleDuration,
        titleStaggerAmount = animationOptions.initialToGrid.titleStaggerAmount,
        titleStaggerFrom = animationOptions.initialToGrid.titleStaggerFrom,
        onCompleteCallback = null,
      } = customOptions;

      const titleChars = titleRef.current?.querySelectorAll(".char");
      const slides = slidesRef.current?.querySelectorAll(".slide");

      if (!titleChars || !slides) return;

      window.gsap
        .timeline({
          defaults: {
            duration: 1.2,
            ease: "power4.inOut",
          },
          onComplete: () => {
            setIsAnimating(false);
            setStage(stages[1]); // Move to next stage (grid)

            // Make slides clickable
            slides.forEach((slide, index) => {
              slide.style.cursor = "pointer";
              // Use custom click handler if provided
              if (typeof callbacks.onSlideClick === "function") {
                slide.onclick = () => callbacks.onSlideClick(index);
              } else {
                slide.onclick = () => handleSlideClick(index);
              }
            });

            // Call custom complete callback if provided
            if (typeof onCompleteCallback === "function") {
              onCompleteCallback();
            }

            // Call stage change callback if provided
            if (typeof callbacks.onStageChange === "function") {
              callbacks.onStageChange(stages[1]);
            }
          },
        })
        .addLabel("start", 0)
        .set(slidesRef.current, { perspective: 1000 })
        .set(clipRef.current, { willChange: "clip-path" })
        .set(titleChars, { transformOrigin: "50% 100%" })
        .to(
          clipRef.current,
          {
            clipPath: clipPath,
          },
          "start"
        )
        .to(
          clipImageRef.current,
          {
            scale: clipScale,
          },
          "start"
        )
        .fromTo(
          slides,
          {
            opacity: 0,
            z: 600,
          },
          {
            duration: slideDuration,
            ease: slideEase,
            stagger: {
              amount: slideStaggerAmount,
              from: slideStaggerFrom,
            },
            opacity: 1,
            z: 0,
          },
          "start"
        )
        .to(
          titleChars,
          {
            duration: titleDuration,
            scaleY: 0,
            stagger: {
              amount: titleStaggerAmount,
              from: titleStaggerFrom,
            },
          },
          "start"
        );
    },
    [
      isAnimating,
      stage,
      initialStage,
      stages,
      callbacks,
      clipRef,
      clipImageRef,
      slidesRef,
      titleRef,
      animationOptions,
    ]
  );

  /**
   * Transition from grid or content stage back to initial stage
   * @param {Object} customOptions - Custom animation options
   */
  const showPreview = useCallback(
    (customOptions = {}) => {
      if (isAnimating || !window.gsap || stage !== stages[1]) return;
      setIsAnimating(true);

      // Merge default options with custom options
      const {
        contentSelector = animationOptions.contentToGrid.contentSelector,
        slideOpacity = animationOptions.gridToContent.slideOpacity,
        slideScale = animationOptions.gridToContent.slideScale,
        slideBlur = animationOptions.gridToContent.slideBlur,
        selectedOpacity = animationOptions.gridToContent.selectedOpacity,
        selectedScale = animationOptions.gridToContent.selectedScale,
        selectedY = animationOptions.gridToContent.selectedY,
        slideDuration = animationOptions.gridToContent.slideDuration,
        onCompleteCallback = null,
      } = customOptions;

      const slides = slidesRef.current?.querySelectorAll(".slide");
      const coverTitle = titleRef.current;
      const coverDescription = coverTitle?.parentNode?.querySelector(
        ".cover__description"
      );
      const coverButton =
        coverTitle?.parentNode?.querySelector(".cover__button");
      const contentContainer = document.querySelector(contentSelector);

      const tl = window.gsap.timeline({
        onComplete: () => {
          setIsAnimating(false);
          setStage(stages[2]); // Move to content stage

          // Call custom complete callback if provided
          if (typeof onCompleteCallback === "function") {
            onCompleteCallback();
          }

          // Call stage change callback if provided
          if (typeof callbacks.onStageChange === "function") {
            callbacks.onStageChange(stages[2], index);
          }
        },
      });

      // First hide the cover title, description, and button
      tl.to([coverTitle, coverDescription, coverButton], {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.05,
      })
        // Fade out and blur non-selected slides
        .to(slides, {
          opacity: slideOpacity,
          scale: slideScale,
          filter: `blur(${slideBlur})`,
          duration: slideDuration,
          ease: "power3.inOut",
        })
        // Highlight the selected slide
        .to(
          slides[index],
          {
            opacity: selectedOpacity,
            scale: selectedScale,
            filter: "blur(0px)",
            duration: slideDuration,
            ease: "power3.inOut",
          },
          "-=0.5"
        )
        // Move selected slide up
        .to(
          slides[index],
          {
            y: selectedY,
            duration: slideDuration,
            ease: "power3.inOut",
          },
          "-=0.5"
        )
        // Show the content container
        .to(
          contentContainer,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: slideDuration,
            ease: "power3.inOut",
          },
          "-=0.5"
        );
    },
    [
      isAnimating,
      stage,
      stages,
      callbacks,
      slidesRef,
      titleRef,
      animationOptions,
    ]
  );

  /**
   * Handle slide click to transition from grid to content stage
   * @param {number} index - Index of the clicked slide
   * @param {Object} customOptions - Custom animation options
   */
  const handleSlideClick = useCallback(
    (index, customOptions = {}) => {
      if (isAnimating || stage !== stages[1]) return; // Only work in grid stage
      setIsAnimating(true);

      // Merge default options with custom options
      const {
        slideOpacity = animationOptions.gridToContent.slideOpacity,
        slideScale = animationOptions.gridToContent.slideScale,
        slideBlur = animationOptions.gridToContent.slideBlur,
        selectedOpacity = animationOptions.gridToContent.selectedOpacity,
        selectedScale = animationOptions.gridToContent.selectedScale,
        selectedY = animationOptions.gridToContent.selectedY,
        contentSelector = animationOptions.gridToContent.contentSelector,
        onCompleteCallback = null,
      } = customOptions;

      const container = slidesRef.current;
      if (!container) return;

      const slides = container.querySelectorAll(".slide");
      const coverTitle = titleRef.current;
      const coverDescription = coverTitle?.parentNode?.querySelector(
        ".cover__description"
      );
      const coverButton =
        coverTitle?.parentNode?.querySelector(".cover__button");

      // Ensure content container is ready to be visible
      const contentContainer = document.querySelector(contentSelector);
      if (contentContainer) {
        // Make sure it's visible but transparent initially
        window.gsap.set(contentContainer, {
          visibility: "visible",
          opacity: 0,
        });
      }

      // First, blur and scale all slides with enhanced effect
      const tl = window.gsap.timeline({
        defaults: { duration: 0.7, ease: "power3.out" },
        onComplete: () => {
          // Make content visible immediately
          if (contentContainer) {
            window.gsap.to(contentContainer, {
              opacity: 1,
              duration: 0.3,
              ease: "power2.out",
              onComplete: () => {
                setIsAnimating(false);
                setSelectedSlide(index);
                setStage(stages[2]); // Move to content stage

                // Call custom complete callback if provided
                if (typeof onCompleteCallback === "function") {
                  onCompleteCallback(index);
                }

                // Call stage change callback if provided
                if (typeof callbacks.onStageChange === "function") {
                  callbacks.onStageChange(stages[2], index);
                }
              },
            });
          } else {
            setIsAnimating(false);
            setSelectedSlide(index);
            setStage(stages[2]); // Move to content stage

            // Call custom complete callback if provided
            if (typeof onCompleteCallback === "function") {
              onCompleteCallback(index);
            }

            // Call stage change callback if provided
            if (typeof callbacks.onStageChange === "function") {
              callbacks.onStageChange(stages[2], index);
            }
          }
        },
      });

      // Fade out and blur non-selected slides
      tl.to(slides, {
        opacity: slideOpacity,
        scale: slideScale,
        filter: `blur(${slideBlur})`,
        stagger: { amount: 0.2, from: index },
      })
        // Highlight the selected slide
        .to(
          slides[index],
          {
            opacity: selectedOpacity,
            scale: selectedScale,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.5"
        )
        // Move selected slide up
        .to(
          slides[index],
          {
            y: selectedY,
            duration: 0.5,
            ease: "power2.out",
          },
          "-=0.5"
        )
        // Hide the cover title, description, and button
        .to(
          [coverTitle, coverDescription, coverButton],
          {
            opacity: 0,
            y: -20,
            duration: 0.4,
            ease: "power2.out",
            stagger: 0.05,
          },
          "-=0.6"
        );
    },
    [
      isAnimating,
      stage,
      stages,
      callbacks,
      slidesRef,
      titleRef,
      animationOptions,
    ]
  );

  /**
   * Toggle between animation stages
   * @param {Object} customOptions - Custom animation options
   */
  const toggleEffect = useCallback(
    (customOptions = {}) => {
      if (isAnimating) return;
      setIsAnimating(true);

      // Merge default options with custom options
      const {
        contentSelector = animationOptions.contentToGrid.contentSelector,
        onCompleteCallback = null,
      } = customOptions;

      if (stage === initialStage) {
        // Initial to grid animation
        showSlider(customOptions);
      } else if (stage === stages[1]) {
        // Grid stage
        // Grid to initial animation
        showPreview(customOptions);
      } else if (stage === stages[2]) {
        // Content stage
        // Content to grid animation
        const coverTitle = titleRef.current;
        const coverDescription = coverTitle?.parentNode?.querySelector(
          ".cover__description"
        );
        const coverButton =
          coverTitle?.parentNode?.querySelector(".cover__button");
        const contentContainer = document.querySelector(contentSelector);

        const tl = window.gsap.timeline({
          onComplete: () => {
            setIsAnimating(false);
            setStage(stages[1]); // Back to grid stage

            // Call custom complete callback if provided
            if (typeof onCompleteCallback === "function") {
              onCompleteCallback();
            }

            // Call stage change callback if provided
            if (typeof callbacks.onStageChange === "function") {
              callbacks.onStageChange(stages[1]);
            }
          },
        });

        // First hide the content container
        if (contentContainer) {
          tl.to(contentContainer, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        }

        // Show the cover title, description, and button
        tl.to(
          [coverTitle, coverDescription, coverButton],
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.05,
          },
          contentContainer ? "-=0.1" : "0"
        )

          // Then reset slides
          .to(
            slidesRef.current?.querySelectorAll(".slide") || [],
            {
              duration: 0.5,
              ease: "power3.out",
              opacity: 1,
              scale: 1,
              y: 0,
              filter: "blur(0px)",
              stagger: 0.05,
            },
            "-=0.3"
          );
      }
    },
    [
      isAnimating,
      stage,
      initialStage,
      stages,
      callbacks,
      showSlider,
      showPreview,
      slidesRef,
      titleRef,
      animationOptions,
    ]
  );

  return {
    // Refs for animation elements
    clipRef,
    clipImageRef,
    slidesRef,
    titleRef,
    // Animation control functions
    toggleEffect,
    showSlider,
    showPreview,
    handleSlideClick,
    // State values
    selectedSlide,
    stage,
    isAnimating,
    isEffectActive: stage !== "initial",
    // Helper method to get current stage
    getCurrentStage: () => stage,
    // Helper method to check if a specific stage is active
    isStageActive: (stageName) => stage === stageName,
  };
}
