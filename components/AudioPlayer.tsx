import React, { useRef, useEffect, useState } from "react";

// Grove-hosted audio — 12M offloaded from Vercel static to Lens Grove (chain 232, immutable)
// lens:// URIs resolve via https://api.grove.storage gateway for browsers
const tracks = [
  {
    title: "Map",
    src: "https://api.grove.storage/9042e9c0c8828b2b6de1dab2fce20dc7c5cc1a1f7979371a6243b040584edecd",
  },
  {
    title: "Freedom Blues",
    src: "https://api.grove.storage/fc0657a7b62a81962a74df142bc93738e930eb0840bc44d927ba2c8395352767",
  },
  {
    title: "El Chupa",
    src: "https://api.grove.storage/e592f43f8f643eb2befdb9dd58fee6a2c609bd5bbcbe8b335d278e4d3e5b42e8",
  },
  {
    title: "Princess Eileen",
    src: "https://api.grove.storage/7258c039a172d9a0679c6e80734a56508e40f3939edfb8cc037048150d51d385",
  },
];

export default function AudioPlayer() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [playing, setPlaying] = useState(false); // Start as not playing
  const [showOverlay, setShowOverlay] = useState(true);

  // Start playback when overlay is dismissed
  const startPlayback = () => {
    setShowOverlay(false);
    setPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 0);
  };

  // Play next track when current ends
  const handleEnded = () => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
  };

  // Play/pause toggle (optional, minimal)
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  // Keep playing state in sync with audio element
  useEffect(() => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [playing, currentTrack]);

  if (!hasMounted) return null;

  return (
    <>
      <div
        style={{
          pointerEvents: showOverlay ? "auto" : "none",
          opacity: showOverlay ? 1 : 0,
          transition: "opacity 0.7s cubic-bezier(.4,0,.2,1)",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#fff",
          zIndex: 20000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {showOverlay && (
          <button
            onClick={startPlayback}
            style={{
              fontSize: 22,
              padding: "16px 32px",
              borderRadius: 8,
              border: "none",
              background: "#222",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
            }}
          >
            ▶
          </button>
        )}
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 24, // Changed from top to bottom
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: "rgba(255,255,255,0.8)", // Increased opacity for better visibility
          borderRadius: 8,
          padding: "8px 12px", // Increased horizontal padding
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)", // Enhanced shadow
          display: "flex",
          alignItems: "center",
          minWidth: 160,
          maxWidth: "calc(100vw - 32px)", // Prevent overflow on small screens
          backdropFilter: "blur(5px)", // Add blur effect for better readability
          WebkitBackdropFilter: "blur(5px)", // Safari support
        }}
      >
        <button
          aria-label="Previous"
          onClick={() =>
            setCurrentTrack(
              (prev) => (prev - 1 + tracks.length) % tracks.length
            )
          }
          style={{
            border: "none",
            background: "none",
            fontSize: 18,
            marginRight: 4,
            cursor: "pointer",
            padding: "8px", // Increased padding for better touch target
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⏮
        </button>
        <button
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
          style={{
            border: "none",
            background: "none",
            fontSize: 18,
            marginRight: 4,
            cursor: "pointer",
            padding: "8px", // Increased padding for better touch target
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {playing ? "❚❚" : "►"}
        </button>
        <button
          aria-label="Next"
          onClick={() => setCurrentTrack((prev) => (prev + 1) % tracks.length)}
          style={{
            border: "none",
            background: "none",
            fontSize: 18,
            marginRight: 8,
            cursor: "pointer",
            padding: "8px", // Increased padding for better touch target
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⏭
        </button>
        <span
          style={{
            fontSize: 14,
            color: "#333",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "calc(100% - 100px)", // Responsive width
            fontWeight: "bold", // Make text more readable
          }}
        >
          {tracks[currentTrack].title}
        </span>
        <audio
          ref={audioRef}
          src={tracks[currentTrack].src}
          autoPlay={playing}
          onEnded={handleEnded}
          style={{ display: "none" }}
        />
      </div>
    </>
  );
}
