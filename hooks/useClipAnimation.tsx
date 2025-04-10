import { useEffect, useRef, useState, useCallback, RefObject } from "react";

// Animation options for different transitions
export interface AnimationOptions {
  initialToGrid?: {
    clipPath?: string;
    clipScale?: number;
    slideDuration?: number;
    slideEase?: string;
    slideStaggerAmount?: number;
    slideStaggerFrom?: string;
    titleDuration?: number;
    titleStaggerAmount?: number;
    titleStaggerFrom?: string;
  };
  gridToInitial?: {
    clipPath?: string;
    clipScale?: number;
    slideDuration?: number;
    slideEase?: string;
    slideStaggerAmount?: number;
    slideStaggerFrom?: string;
    titleDuration?: number;
    titleStaggerAmount?: number;
    titleStaggerFrom?: string;
  };
  gridToContent?: {
    slideOpacity?: number;
    slideScale?: number;
    slideBlur?: string;
    selectedOpacity?: number;
    selectedScale?: number;
    selectedY?: number;
    contentSelector?: string;
  };
  contentToGrid?: {
    contentSelector?: string;
  };
}

// Callback functions for different animation stages
export interface AnimationCallbacks {
  onSlideClick?: (index: number) => void;
  onStageChange?: (stage: string, index?: number) => void;
}

// Options for the useClipAnimation hook
export interface ClipAnimationOptions {
  initialStage?: string;
  stages?: string[];
  callbacks?: AnimationCallbacks;
  defaultAnimationOptions?: AnimationOptions;
}

// Custom options for animation methods
export interface CustomAnimationOptions {
  clipPath?: string;
  clipScale?: number;
  slideDuration?: number;
  slideEase?: string;
  slideStaggerAmount?: number;
  slideStaggerFrom?: string;
  titleDuration?: number;
  titleStaggerAmount?: number;
  titleStaggerFrom?: string;
  slideOpacity?: number;
  slideScale?: number;
  slideBlur?: string;
  selectedOpacity?: number;
  selectedScale?: number;
  selectedY?: number;
  contentSelector?: string;
  onCompleteCallback?: (index?: number) => void;
}

// Return type of the useClipAnimation hook
export interface ClipAnimationReturn {
  // Refs for animation elements
  clipRef: RefObject<HTMLDivElement | null>;
  clipImageRef: RefObject<HTMLDivElement | null>;
  slidesRef: RefObject<HTMLDivElement | null>;
  titleRef: RefObject<HTMLHeadingElement | null>;

  // Animation control functions
  toggleEffect: (customOptions?: CustomAnimationOptions) => void;
  showSlider: (customOptions?: CustomAnimationOptions) => void;
  showPreview: (customOptions?: CustomAnimationOptions) => void;
  handleSlideClick: (
    index: number,
    customOptions?: CustomAnimationOptions
  ) => void;

  // State values
  selectedSlide: number | null;
  stage: string;
  isAnimating: boolean;
  isEffectActive: boolean;

  // Helper methods
  getCurrentStage: () => string;
  isStageActive: (stageName: string) => boolean;
}

/**
 * A flexible animation hook for creating clip and transition effects
 * @param options - Configuration options
 * @returns Animation controls and state
 */
export function useClipAnimation(
  options: ClipAnimationOptions = {}
): ClipAnimationReturn {
  // Default options
  const {
    initialStage = "initial",
    stages = ["initial", "grid", "content"],
    callbacks = {},
    defaultAnimationOptions = {},
  } = options;

  // Default animation options that can be overridden
  const defaultOptions = {
    // Initial to grid transition options - simplified for reliability
    initialToGrid: {
      clipPath: "inset(0% 0% round 0vw)", // Simpler clip path
      clipScale: 0.9,
      slideDuration: 0.8, // Faster duration
      slideEase: "power2.out", // Simpler easing
      slideStaggerAmount: 0.05, // Less staggering
      slideStaggerFrom: "start", // More predictable staggering
      titleDuration: 0.5, // Faster title animation
      titleStaggerAmount: 0.05, // Less staggering
      titleStaggerFrom: "start", // More predictable staggering
    },
    // Grid to initial transition options - simplified for reliability
    gridToInitial: {
      clipPath: "inset(0% 0% round 0vw)",
      clipScale: 1,
      slideDuration: 0.6, // Faster duration
      slideEase: "power2.in", // Simpler easing
      slideStaggerAmount: 0.05, // Less staggering
      slideStaggerFrom: "start", // More predictable staggering
      titleDuration: 0.5, // Faster title animation
      titleStaggerAmount: 0.05, // Less staggering
      titleStaggerFrom: "start", // More predictable staggering
    },
    // Grid to content transition options
    gridToContent: {
      slideOpacity: 0.15,
      slideScale: 0.9,
      slideBlur: "15px",
      selectedOpacity: 0.8,
      selectedScale: 1.15,
      selectedY: -40,
      contentSelector: ".content-container", // Generic default
    },
    // Content to grid transition options
    contentToGrid: {
      contentSelector: ".content-container", // Generic default
    },
  };

  // Merge default options with user-provided options
  const animationOptions = {
    ...defaultOptions,
    ...defaultAnimationOptions,
  };

  // Debug the current contentSelector to help find issues
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(
        "Current content selector:",
        animationOptions.gridToContent.contentSelector,
        "for page with stages:",
        stages
      );
    }
  }, [animationOptions.gridToContent.contentSelector, stages]);

  // Refs for animation elements
  const clipRef = useRef<HTMLDivElement>(null);
  const clipImageRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // State management
  const [stage, setStage] = useState<string>(initialStage);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [selectedSlide, setSelectedSlide] = useState<number | null>(null);

  useEffect(() => {
    // Initialize Splitting.js if available
    if (typeof window !== "undefined" && (window as any).Splitting) {
      (window as any).Splitting();
    }

    // Import GSAP dynamically to avoid SSR issues
    const initGSAP = async () => {
      const gsap = (await import("gsap")).default;
      (window as any).gsap = gsap;
    };

    initGSAP();
  }, []);

  // Update classes based on current stage
  useEffect(() => {
    if (!slidesRef.current) return;

    // Add or remove grid-active class based on stage
    if (stage === stages[1]) {
      // Grid stage
      slidesRef.current.classList.add("grid-active");
    } else {
      slidesRef.current.classList.remove("grid-active");
    }

    // Update body data attribute for CSS targeting
    if (typeof document !== "undefined") {
      document.body.setAttribute("data-stage", stage);
    }
  }, [stage, stages, slidesRef]);

  /**
   * Transition from initial stage to grid stage
   * @param customOptions - Custom animation options
   */
  const showSlider = useCallback(
    (customOptions: CustomAnimationOptions = {}) => {
      if (isAnimating || !(window as any).gsap || stage !== initialStage)
        return;
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

      (window as any).gsap
        .timeline({
          defaults: {
            duration: 1.2,
            ease: "power4.inOut",
          },
          onComplete: () => {
            setIsAnimating(false);
            setStage(stages[1]); // Move to next stage (grid)

            // Make slides clickable
            slides.forEach((slide: Element, index: number) => {
              (slide as HTMLElement).style.cursor = "pointer";
              // Use custom click handler if provided
              if (typeof callbacks.onSlideClick === "function") {
                (slide as HTMLElement).onclick = () => {
                  if (callbacks.onSlideClick) callbacks.onSlideClick(index);
                };
              } else {
                (slide as HTMLElement).onclick = () => handleSlideClick(index);
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
   * @param customOptions - Custom animation options
   */
  const showPreview = useCallback(
    (customOptions: CustomAnimationOptions = {}) => {
      if (isAnimating || !(window as any).gsap || stage === initialStage)
        return;
      setIsAnimating(true);

      // Merge default options with custom options
      const {
        clipPath = animationOptions.gridToInitial.clipPath,
        clipScale = animationOptions.gridToInitial.clipScale,
        slideDuration = animationOptions.gridToInitial.slideDuration,
        slideEase = animationOptions.gridToInitial.slideEase,
        slideStaggerAmount = animationOptions.gridToInitial.slideStaggerAmount,
        slideStaggerFrom = animationOptions.gridToInitial.slideStaggerFrom,
        titleDuration = animationOptions.gridToInitial.titleDuration,
        titleStaggerAmount = animationOptions.gridToInitial.titleStaggerAmount,
        titleStaggerFrom = animationOptions.gridToInitial.titleStaggerFrom,
        onCompleteCallback = null,
      } = customOptions;

      const titleChars = titleRef.current?.querySelectorAll(".char");
      const slides = slidesRef.current?.querySelectorAll(".slide");

      if (!titleChars || !slides) return;

      // Remove click handlers
      slides.forEach((slide: Element) => {
        (slide as HTMLElement).style.cursor = "default";
        (slide as HTMLElement).onclick = null;
      });

      (window as any).gsap
        .timeline({
          defaults: {
            duration: 1.2,
            ease: "power4.inOut",
          },
          onComplete: () => {
            setIsAnimating(false);
            setStage(initialStage);
            setSelectedSlide(null);

            // Call custom complete callback if provided
            if (typeof onCompleteCallback === "function") {
              onCompleteCallback();
            }

            // Call stage change callback if provided
            if (typeof callbacks.onStageChange === "function") {
              callbacks.onStageChange(initialStage);
            }
          },
        })
        .addLabel("start", 0)
        .set(titleChars, { transformOrigin: "50% 0%" })
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
        .to(
          slides,
          {
            duration: slideDuration,
            ease: slideEase,
            opacity: 0,
            z: 600,
            stagger: {
              amount: slideStaggerAmount,
              from: slideStaggerFrom,
            },
          },
          "start"
        )
        .fromTo(
          titleChars,
          {
            scaleY: 0,
          },
          {
            duration: titleDuration,
            scaleY: 1,
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
      callbacks,
      clipRef,
      clipImageRef,
      slidesRef,
      titleRef,
      animationOptions,
    ]
  );

  /**
   * Handle slide click to transition from grid to content stage
   * @param index - Index of the clicked slide
   * @param customOptions - Custom animation options
   */
  const handleSlideClick = useCallback(
    (index: number, customOptions: CustomAnimationOptions = {}) => {
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

      // Check for content container but log warning if missing (don't create one)
      const contentContainer = document.querySelector(
        contentSelector as string
      ) as HTMLElement | null;

      if (!contentContainer) {
        console.warn(
          `Content container not found: ${contentSelector}. Check that this selector exists in your page.`
        );
      } else if (process.env.NODE_ENV !== "production") {
        console.debug(`Content container found: ${contentSelector}`);
      }

      // First, blur and scale all slides with enhanced effect
      const tl = (window as any).gsap.timeline({
        defaults: { duration: 0.7, ease: "power3.out" },
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
   * @param customOptions - Custom animation options
   */
  const toggleEffect = useCallback(
    (customOptions: CustomAnimationOptions = {}) => {
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

        const tl = (window as any).gsap.timeline({
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
          "0"
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

  // Ensure state changes are properly synchronized with animations
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM updates are synchronized with animation
    if (typeof window !== "undefined") {
      let frameId: number | null = null;

      const syncAnimations = () => {
        // Ensure any stage-related DOM manipulations are visible
        if (stage === stages[2] && selectedSlide !== null) {
          // Force content container styles for content stage
          const contentSelector =
            animationOptions.gridToContent.contentSelector;
          if (contentSelector) {
            const container = document.querySelector(contentSelector);
            if (container instanceof HTMLElement) {
              container.style.opacity = "1";
              container.style.visibility = "visible";
              container.style.display = "block";
            }
          }
        }

        frameId = null;
      };

      frameId = window.requestAnimationFrame(syncAnimations);

      return () => {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
        }
      };
    }
  }, [
    stage,
    selectedSlide,
    animationOptions.gridToContent.contentSelector,
    stages,
  ]);

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
    isStageActive: (stageName: string) => stage === stageName,
  };
}
