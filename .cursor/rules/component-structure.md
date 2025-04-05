# Component Structure Preservation Rules

## Description

This rule ensures that the component structure and layout hierarchy are maintained when making changes to the project.

## File Patterns

- `components/*.tsx`
- `src/pages/*.tsx`

## Rules

1. Maintain Layout Structure:

   - Keep the `Layout` component wrapper
   - Preserve the `cover` section structure
   - Maintain the `slides` and `clip` sections

2. Component Hierarchy:

   - Keep the z-index layering system
   - Maintain pointer-events configuration
   - Preserve the fixed positioning structure

3. Animation Integration:

   - Keep all animation-related refs
   - Maintain the `data-splitting` attributes
   - Preserve the animation hook usage

4. Responsive Structure:
   - Maintain the mobile navigation structure
   - Keep the frame component positioning
   - Preserve the social links positioning

## Reference Files

@file components/Layout.tsx
@file src/pages/index.tsx
@file src/pages/band.tsx
