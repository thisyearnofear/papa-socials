# Build and Deployment Configuration Rules

## Description

This rule ensures that all build and deployment configurations are maintained to preserve animation functionality.

## File Patterns

- `next.config.js`
- `netlify.toml`
- `package.json`

## Rules

1. Next.js Configuration:

   - Keep the `beforeInteractive` script strategy
   - Maintain the image domain configuration
   - Preserve the React strict mode

2. Build Process:

   - Keep the build command in package.json
   - Maintain the Netlify build configuration
   - Preserve the Next.js plugin configuration

3. Dependencies:

   - Keep GSAP and Splitting.js dependencies
   - Maintain Next.js version compatibility
   - Preserve React version requirements

4. Performance Optimization:
   - Keep build caching configuration
   - Maintain image optimization settings
   - Preserve script loading strategies

## Reference Files

@file next.config.js
@file netlify.toml
@file package.json
