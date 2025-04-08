import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function Navigation() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  return (
    <div className="frame">
      <div className="frame__title">
        <h1 className="frame__title-main">PAPA</h1>
        <a
          aria-label="Visit Linktree"
          className="frame__title-back"
          href="https://linktr.ee/papajams"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="oh__inner">All Links</span>
          <svg width="18px" height="18px" viewBox="0 0 24 24">
            <path
              vectorEffect="non-scaling-stroke"
              d="M18.25 15.5a.75.75 0 00.75-.75v-9a.75.75 0 00-.75-.75h-9a.75.75 0 000 1.5h7.19L6.22 16.72a.75.75 0 101.06 1.06L17.5 7.56v7.19c0 .414.336.75.75.75z"
            />
          </svg>
        </a>
      </div>

      {router.pathname === "/" ? (
        <a
          className="frame__prev"
          href="https://open.spotify.com/artist/3yhUYybUxwJn1or7zHXWHy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Listen on Spotify
        </a>
      ) : router.pathname === "/social" ? (
        <a
          className="frame__prev"
          href="https://www.instagram.com/papajams"
          target="_blank"
          rel="noopener noreferrer"
        >
          Follow on Instagram
        </a>
      ) : router.pathname === "/events" ? (
        <a
          className="frame__prev"
          href="https://thehug.xyz/artists/papa"
          target="_blank"
          rel="noopener noreferrer"
        >
          Artist Profile
        </a>
      ) : (
        <a
          className="frame__prev"
          href="https://open.spotify.com/artist/3yhUYybUxwJn1or7zHXWHy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Listen on Spotify
        </a>
      )}

      {isMobile ? (
        <div className="mobile-nav">
          <button
            className={`hamburger ${menuOpen ? "is-active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`mobile-menu ${menuOpen ? "is-open" : ""}`}>
            <nav>
              <Link
                href="/"
                className={router.pathname === "/" ? "active" : ""}
              >
                Music
              </Link>
              <Link
                href="/social"
                className={router.pathname === "/social" ? "active" : ""}
              >
                Connect
              </Link>
              <Link
                href="/events"
                className={router.pathname === "/events" ? "active" : ""}
              >
                Events
              </Link>
              <Link
                href="/band"
                className={router.pathname === "/band" ? "active" : ""}
              >
                Band
              </Link>
            </nav>
          </div>
        </div>
      ) : (
        <nav className="frame__demos">
          <span>Explore: </span>
          <Link
            href="/"
            className={
              router.pathname === "/"
                ? "frame__demo frame__demo--current"
                : "frame__demo"
            }
          >
            Music & Lyrics
          </Link>
          <Link
            href="/social"
            className={
              router.pathname === "/social"
                ? "frame__demo frame__demo--current"
                : "frame__demo"
            }
          >
            Connect
          </Link>
          <Link
            href="/events"
            className={
              router.pathname === "/events"
                ? "frame__demo frame__demo--current"
                : "frame__demo"
            }
          >
            Events
          </Link>
          <Link
            href="/band"
            className={
              router.pathname === "/band"
                ? "frame__demo frame__demo--current"
                : "frame__demo"
            }
          >
            Band
          </Link>
        </nav>
      )}
    </div>
  );
}
