import React, { useState } from "react";
import { motion } from "framer-motion";

const platforms = [
  {
    id: "twitter",
    name: "Twitter",
    color: "#1DA1F2",
    embedCode: (
      <blockquote className="twitter-timeline" data-theme="dark" data-height="500" data-chrome="noheader nofooter noborders transparent">
        <a href="https://twitter.com/papajimjams">Tweets by PAPA</a>
      </blockquote>
    ),
    script: "https://platform.twitter.com/widgets.js"
  },
  {
    id: "instagram",
    name: "Instagram",
    color: "#C13584",
    embedCode: (
      <blockquote 
        className="instagram-media" 
        data-instgrm-permalink="https://www.instagram.com/papajams/"
        data-instgrm-version="14"
        style={{
          background: "#222",
          borderRadius: "12px",
          boxShadow: "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
          margin: "1px",
          maxWidth: "540px",
          minWidth: "326px",
          padding: 0,
          width: "99.375%"
        }}
      >
        <div style={{ padding: "16px" }}>
          <a
            href="https://www.instagram.com/papajams/"
            style={{
              background: "#222",
              lineHeight: 0,
              padding: "0 0",
              textAlign: "center",
              textDecoration: "none",
              width: "100%",
              color: "#fff"
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <h3 style={{ margin: "14px 0", fontFamily: "Arial, sans-serif", fontSize: "14px", lineHeight: "18px" }}>
              View PAPA's Instagram Profile
            </h3>
          </a>
        </div>
      </blockquote>
    ),
    script: "https://www.instagram.com/embed.js"
  },
  {
    id: "spotify",
    name: "Spotify",
    color: "#1DB954",
    embedCode: (
      <iframe
        src="https://open.spotify.com/embed/artist/3yhUYybUxwJn1or7zHXWHy?utm_source=generator&theme=0"
        width="100%"
        height="500"
        frameBorder="0"
        allowFullScreen=""
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style={{ borderRadius: "12px" }}
      ></iframe>
    ),
    script: null
  },
  {
    id: "youtube",
    name: "YouTube",
    color: "#FF0000",
    embedCode: (
      <iframe
        width="100%"
        height="500"
        src="https://www.youtube.com/embed?listType=user_uploads&list=papajams"
        title="PAPA YouTube Channel"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ borderRadius: "12px" }}
      ></iframe>
    ),
    script: null
  },
  {
    id: "soundcloud",
    name: "SoundCloud",
    color: "#FF7700",
    embedCode: (
      <iframe
        width="100%"
        height="500"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/users/papajams&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
        style={{ borderRadius: "12px" }}
      ></iframe>
    ),
    script: "https://w.soundcloud.com/player/api.js"
  }
];

export default function SocialFeeds({ isVisible }) {
  const [activePlatform, setActivePlatform] = useState("twitter");
  
  // Load platform scripts when needed
  React.useEffect(() => {
    if (isVisible) {
      platforms.forEach(platform => {
        if (platform.script) {
          // Check if script is already loaded
          if (!document.querySelector(`script[src="${platform.script}"]`)) {
            const script = document.createElement('script');
            script.src = platform.script;
            script.async = true;
            document.body.appendChild(script);
          }
        }
      });
    }
  }, [isVisible]);

  const containerVariants = {
    hidden: { 
      opacity: 0,
      y: 50,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: {
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      className="social-feeds-container"
      variants={containerVariants}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      exit="exit"
    >
      <motion.div className="platform-tabs" variants={itemVariants}>
        {platforms.map(platform => (
          <button
            key={platform.id}
            className={`platform-tab ${activePlatform === platform.id ? 'active' : ''}`}
            onClick={() => setActivePlatform(platform.id)}
            style={{
              borderBottom: activePlatform === platform.id ? `3px solid ${platform.color}` : 'none'
            }}
          >
            {platform.name}
          </button>
        ))}
      </motion.div>
      
      <motion.div className="feed-display" variants={itemVariants}>
        {platforms.map(platform => (
          <div 
            key={platform.id} 
            className={`feed-content ${activePlatform === platform.id ? 'active' : ''}`}
          >
            {platform.embedCode}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
