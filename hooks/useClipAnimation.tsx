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

      // Ensure content container is ready to be visible
      const contentContainer = document.querySelector(
        contentSelector as string
      );
      if (contentContainer) {
        // Make sure it's visible but transparent initially
        (window as any).gsap.set(contentContainer, {
          visibility: "visible",
          opacity: 0,
          display: "block", // Ensure it's displayed
          zIndex: 1000, // Ensure it's above other elements
        });
        console.log(
          "Content container found and set to visible:",
          contentSelector
        );

        // Add a debug class to help identify it
        contentContainer.classList.add("debug-visible");
      } else {
        console.warn("Content container not found:", contentSelector);

        // Try to create the container if it doesn't exist
        const newContainer = document.createElement("div");
        newContainer.className = "discography-container";
        newContainer.innerHTML =
          '<div class="discography-header"><h2>DISCOGRAPHY</h2><button class="discography-back">← Back to music</button></div>';
        document.body.appendChild(newContainer);
        console.log("Created new discography container");
      }

      // First, blur and scale all slides with enhanced effect
      const tl = (window as any).gsap.timeline({
        defaults: { duration: 0.7, ease: "power3.out" },
        onComplete: () => {
          // Make content visible immediately
          if (contentContainer) {
            // First ensure the container is visible and positioned correctly
            (window as any).gsap.set(contentContainer, {
              display: "block",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1000,
              backgroundColor: "rgba(0, 0, 0, 0.95)",
            });

            // Then animate it in
            (window as any).gsap.to(contentContainer, {
              opacity: 1,
              visibility: "visible",
              duration: 0.5,
              ease: "power2.out",
              onStart: () => {
                console.log("Starting animation to show discography container");
                // Add a clear visual indicator
                document.body.classList.add("discography-active");
              },
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

                console.log("Animation to discography stage complete");

                // Force a reflow to ensure the container is visible
                (contentContainer as HTMLElement).style.display = "block";
                (contentContainer as HTMLElement).style.opacity = "1";
                (contentContainer as HTMLElement).style.visibility = "visible";
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
        const contentContainer = document.querySelector(
          contentSelector as string
        );

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

        // First hide the content container
        if (contentContainer) {
          tl.to(contentContainer, {
            opacity: 0,
            visibility: "hidden",
            duration: 0.3,
            ease: "power2.out",
            onStart: () => {
              console.log("Starting to hide content container");
              // Remove the visual indicator
              document.body.classList.remove("discography-active");
              document.body.classList.remove("discography-view");
            },
            onComplete: () => {
              console.log("Content container hidden");
              // Ensure it's fully hidden
              (contentContainer as HTMLElement).style.display = "none";
              contentContainer.classList.remove("debug-visible");

              // Force removal of the container from the DOM
              const parent = contentContainer.parentElement;
              if (parent) {
                parent.removeChild(contentContainer);
              }
            },
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
    isStageActive: (stageName: string) => stage === stageName,
  };
}
