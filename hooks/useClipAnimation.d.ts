import { RefObject } from "react";

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

// Empty object is a valid option
export function useClipAnimation(): ClipAnimationReturn;
export function useClipAnimation(
  options: ClipAnimationOptions
): ClipAnimationReturn;

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
  clipRef: RefObject<HTMLDivElement>;
  clipImageRef: RefObject<HTMLDivElement>;
  slidesRef: RefObject<HTMLDivElement>;
  titleRef: RefObject<HTMLHeadingElement>;

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
