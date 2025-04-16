import React, { useRef, useEffect, useState } from "react";

const tracks = [
  {
    title: "Map",
    src: "/uploads/Map.mp3",
  },
  {
    title: "Freedom Blues",
    src: "/uploads/Freedom blues - 19.02.20.mp3",
  },
  {
    title: "El Chupa",
    src: "/uploads/El-Chupa.mp3",
  },
  {
    title: "Princess Eileen",
    src: "/uploads/Princess Eileen - 19.02.20.mp3",
  },
];

export default function AudioPlayer() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);
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
      {showOverlay && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(255,255,255,0.92)",
          zIndex: 20000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
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
        </div>
      )}
      <div
        style={{
          position: "fixed",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          background: "rgba(255,255,255,0.6)",
          borderRadius: 8,
          padding: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          minWidth: 160,
        }}
      >
        <button
          aria-label="Previous"
          onClick={() => setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length)}
          style={{ border: "none", background: "none", fontSize: 18, marginRight: 4, cursor: "pointer" }}
        >
          ⏮
        </button>
        <button
          aria-label={playing ? "Pause" : "Play"}
          onClick={togglePlay}
          style={{ border: "none", background: "none", fontSize: 18, marginRight: 4, cursor: "pointer" }}
        >
          {playing ? "❚❚" : "►"}
        </button>
        <button
          aria-label="Next"
          onClick={() => setCurrentTrack((prev) => (prev + 1) % tracks.length)}
          style={{ border: "none", background: "none", fontSize: 18, marginRight: 8, cursor: "pointer" }}
        >
          ⏭
        </button>
        <span style={{ fontSize: 14, color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>
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
