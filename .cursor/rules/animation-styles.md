# Animation and Styling Preservation Rules

## Description

This rule ensures that all animation effects and styling are preserved when making changes to the project. It applies to all CSS and component files.

## File Patterns

- `styles/*.css`
- `components/*.tsx`
- `src/pages/*.tsx`

## Rules

1. Never remove or modify the following animation-related classes:

   - `.cover__title` with `data-splitting` attribute
   - `.clip` and `.clip__img` for image clipping effects
   - `.slides` and `.slide` for slide animations
   - `.cover__button` hover effects

2. Maintain all GSAP and Splitting.js integrations:

   - Keep all `beforeInteractive` script loading in `_document.js`
   - Preserve all animation hooks and refs
   - Maintain the `useClipAnimation` hook functionality

3. Preserve all CSS variables and their usage:

   - Keep all `:root` CSS variables
   - Maintain color scheme variables
   - Preserve font-related variables

4. Maintain responsive design:

   - Keep all media queries
   - Preserve mobile-specific styles
   - Maintain viewport-based sizing

5. Animation Performance:
   - Use `will-change` where appropriate
   - Maintain hardware acceleration properties
   - Keep transform-based animations

## Reference Files

@file styles/globals.css
@file src/pages/\_document.js
@file hooks/useClipAnimation.ts
