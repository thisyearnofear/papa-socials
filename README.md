# PAPA: Decentralized Music Artist Platform

PAPA is a Next.js-based platform showcasing a music artist with decentralized fan engagement powered by Storacha Network (previously Web3.Storage) and AI. This project demonstrates how artists can build community, share content, and cultivate personalized fan journeys through Web3 technologies.

## Project Overview

The platform combines a traditional artist website with decentralized technology to:

1. **Store artist assets on Storacha Network backed by Filecoin** with provable authenticity and provenance
2. **Engage fans through AI-powered verification** to access exclusive content
3. **Enable community influence** over the artist's social media presence

## Features

- Artist profile, discography, and events showcase
- Optimized image loading with Next.js
- Immersive, animated UI with Framer Motion
- Decentralized storage of artist assets on Storacha Network/Filecoin
- AI-powered fan verification experience
- Social media terminal for community influence

## Architecture

### Directory Structure

```
papa-next-pages/
├── components/             # UI components
│   ├── BandMemberContent   # Band member details component
│   ├── DiscographyItem     # Album/discography display
│   ├── EventsContent       # Events listing component
│   ├── FilecoinArchiveContent # Decentralized archive component
│   ├── Layout              # Main layout wrapper
│   ├── Navigation          # Site navigation
│   ├── OptimizedImage      # Image optimization component
│   ├── SocialFeeds         # Social media display
│   └── SocialLinks         # Social link buttons
│
├── hooks/                  # Custom React hooks
│   ├── useClipAnimation    # Animation for page transitions
│   └── useDiscographyAnimation # Animations for discography
│
├── public/                 # Static assets
│   ├── img/                # Artist images and photos
│   │   ├── albums/         # Album artwork
│   │   └── demo1-4/        # Demo images for different sections
│   └── optimized/          # Optimized image versions
│
├── src/
│   └── pages/              # Next.js pages
│       ├── api/            # API routes
│       │   └── storage/    # Storacha/Filecoin API endpoints
│       ├── _app.tsx        # Next.js app component
│       ├── _document.js    # Next.js document component
│       ├── band.tsx        # Band members page
│       ├── events.tsx      # Events page
│       ├── filecoin.tsx    # Decentralized artist archive page
│       ├── index.tsx       # Homepage
│       └── social.tsx      # Social media page
│
├── utils/                  # Utility functions
│   ├── filecoin.ts         # Storacha/Filecoin integration functions
│   ├── filecoin-context.tsx # Storacha context provider
│   └── storacha-client.ts  # Client for Storacha Network interaction
│
└── styles/                 # CSS stylesheets
    ├── band.css           # Band page styles
    ├── discography.css    # Discography styles
    ├── events.css         # Events page styles
    ├── filecoin.css       # Filecoin/Storacha page styles
    ├── globals.css        # Global styles
    ├── music.css          # Music player styles
    ├── slides.css         # Slide animation styles
    └── social.css         # Social media page styles
```

### Key Components

1. **Page Structure**

   - Each main section is a dedicated page in `/src/pages`
   - Animation transitions managed by custom hooks
   - Consistent layout applied through `Layout` component

2. **UI Components**

   - `OptimizedImage` handles image optimization
   - Section-specific components (BandMemberContent, EventsContent, etc.)
   - Navigation and shared UI elements

3. **Animation & Interactivity**

   - Custom hooks for animation effects
   - Framer Motion for UI transitions
   - Interactive elements for user engagement

4. **Decentralized Storage**
   - Integration with Storacha Network (built on IPFS & Filecoin)
   - Content addressed storage with verification
   - Artist asset archive with metadata management

## Implementation Plan

### Phase 1: Decentralized Artist Archive ✅ (Completed)

- ✅ Integrate Storacha Network client (`@web3-storage/w3up-client`)
- ✅ Setup Space creation and authentication flow
- ✅ Implement upload functionality for artist assets (lyrics, photos, band info)
- ✅ Create verification system to ensure content authenticity
- ✅ Build UI for browsing and verifying the decentralized archive

### Phase 2: AI Fan Engagement (Next Step)

- Implement two AI agents that share data through Storacha:
  - **Inward-facing Agent**: Fan verification, exclusive content access management
  - **Outward-facing Agent**: Social media post generation and management
- Store AI agent data and fan interactions on Storacha
- Create verification process for exclusive content access
- Implement access control for verified fans

### Phase 3: Social Terminal (Future)

- Develop terminal interface showing potential social posts
- Generate post drafts from artist content stored on Storacha/Filecoin
- Allow fans to influence what gets posted through voting system

## Tech Stack

- **Frontend**: Next.js, React, Framer Motion
- **Web3 Storage**: Storacha Network (previously Web3.Storage), IPFS, Filecoin
- **AI Integration**: OpenAI, Langchain.js (planned)
- **Authentication**: NextAuth.js with web3 integration (planned)

## Getting Started

First, create a `.env.local` file in the root directory with the following variables:

```bash
# Storacha Network configuration
NEXT_PUBLIC_STORACHA_EMAIL=your_email@example.com
NEXT_PUBLIC_STORACHA_SPACE_NAME=PAPA_Artist_Archive

# For Phase 2 (AI Integration)
OPENAI_API_KEY=your_openai_api_key
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To use the Filecoin archive features, navigate to `/filecoin` path.

## Running the Decentralized Artist Archive

To use the Storacha Network-powered artist archive:

1. **Configure Storacha**

   - Create a `.env.local` file with your Web3.Storage API token:
     ```
     NEXT_PUBLIC_STORACHA_EMAIL=your_email@example.com
     NEXT_PUBLIC_STORACHA_SPACE_NAME=PAPA_Artist_Archive
     ```

2. **Run the development server**

   ```bash
   npm run dev
   ```

3. **Navigate to the Filecoin Archive**

   - Go to `/filecoin` path in your browser
   - You'll be prompted to authenticate with your email
   - A verification link will be sent to your email

4. **Use the Archive**

   - **Browse**: View all stored artist assets
   - **Upload**: Add new content with metadata
   - **Verify**: Check that content is properly stored on the decentralized network

5. **Interact with Content**
   - Click on any asset to view detailed information
   - View and verify content identifiers (CIDs)
   - Access content through IPFS gateways

## Storacha Network Integration

We've integrated with Storacha Network (previously Web3.Storage) to leverage decentralized storage through IPFS and Filecoin using the "User-owned" approach described in the [Storacha documentation](https://docs.storacha.network/how-to/js-client/w3up-client/). Our implementation:

1. **Creates a Client-Side Account** - Users create their own Storacha account via email verification
2. **Manages Spaces** - Spaces are created and registered on the user's behalf
3. **Handles Uploading** - Files are uploaded directly from the browser to Storacha
4. **Ensures Verification** - Content integrity is verified through IPFS gateways
5. **Provides Browser Compatibility** - Custom implementation to work around Node.js dependencies in the browser

### Browser-Compatible Implementation

Our implementation addresses several challenges with using Storacha in a browser environment:

- **Dynamic Imports** - Loads the client only in browser context to avoid SSR issues
- **Client-Side Rendering** - Prevents hydration errors and Node.js crypto dependency issues
- **Error Handling** - Robust error handling for authentication and storage operations
- **Logging** - Detailed logging to track the storage and verification process

### Technical Architecture

The integration consists of several key components:

1. **FilecoinProvider** - A React context provider that manages the Storacha client state
2. **StorachaClient** - A class that abstracts the interactions with Storacha Network
3. **API Routes** - Server-side endpoints for handling authentication and uploads
4. **storeFile/storeFiles** - Methods to upload content to Storacha with proper metadata
5. **verifyStorage** - Confirms content availability on the IPFS network

## Troubleshooting

Common issues and solutions:

- **Authentication errors**: If you encounter login issues, ensure your email is valid and check your inbox for a verification email from Storacha Network.
- **Upload failures**: Large files may take time to upload. Check your network connection and try with smaller files first.
- **Content not visible**: Content may take a few moments to propagate through the IPFS network. Try refreshing the page or verifying the content after a brief delay.
- **Browser compatibility**: If you experience issues with the client-side crypto operations, ensure you're using a modern browser that supports the Web Crypto API.

## Contributing

This project is open for contributions! Whether you're interested in enhancing the UI, expanding the decentralized storage integration, or implementing the AI features, we welcome your input.

## Next Steps

We're moving forward with Phase 2, which focuses on AI-powered fan engagement. Key tasks include:

1. Implementing the AI agents for fan verification and social media management
2. Creating the verification process for exclusive content access
3. Building the social media terminal interface

## Learn More

- [Storacha Network Documentation](https://docs.storacha.network/)
- [Filecoin Documentation](https://docs.filecoin.io/)
- [IPFS Documentation](https://docs.ipfs.tech/)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
