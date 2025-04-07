import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getReleaseYear } from '../data/discography';

const DiscographyItem = ({ release, isActive, onSelect }) => {
  // Debug the release data
  console.log('Release data:', release);
  const [showLyrics, setShowLyrics] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Handle ESC key to close lyrics modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) { // ESC key
        handleClose();
      }
    };
    
    if (showLyrics) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [showLyrics]);

  const handleTrackClick = (track) => {
    setSelectedTrack(track);
    setShowLyrics(true);
  };

  const handleClose = () => {
    setShowLyrics(false);
    // Wait for animation to complete before clearing the track
    setTimeout(() => setSelectedTrack(null), 300);
  };

  // Get release year from the release date
  const releaseYear = getReleaseYear(release.releaseDate);

  // Subtle animations for the discography item
  const itemVariants = {
    initial: { opacity: 0.9, scale: 0.98 },
    hover: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    active: { scale: 1, opacity: 1 }
  };

  // Animations for the lyrics modal
  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring', 
        damping: 25, 
        stiffness: 300 
      }
    },
    exit: { 
      opacity: 0, 
      y: 10, 
      scale: 0.98,
      transition: { 
        duration: 0.2 
      }
    }
  };

  return (
    <motion.div 
      className={`discography-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(release.id)}
      initial="initial"
      whileHover="hover"
      animate={isActive ? "active" : "initial"}
      variants={itemVariants}
    >
      <div className="discography-item__inner">
        <motion.div 
          className="discography-item__cover" 
          style={{ 
            backgroundImage: `url(${release.coverImage || '/img/demo1/1.jpg'})`,
            backgroundColor: 'rgba(50, 50, 50, 0.5)' // Fallback background color
          }}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.3 }}
        />
        <div className="discography-item__info">
          <h3>{release.title}</h3>
          <span className="discography-item__type">
            {release.type === 'ep' ? 'EP' : 'Album'} • {releaseYear}
          </span>
          <p className="discography-item__description">{release.description}</p>
          
          {isActive && (
            <motion.div 
              className="discography-item__tracks"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h4>Tracks</h4>
              <ul>
                {release.tracks.map((track, index) => (
                  <motion.li 
                    key={track.id} 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleTrackClick(track); 
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (index * 0.03) }}
                    whileHover={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)', 
                      x: 3,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <span className="track-number">{track.trackNumber}.</span> {track.title}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showLyrics && selectedTrack && (
          <motion.div 
            className="lyrics-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button 
              className="close-button" 
              onClick={(e) => { 
                e.stopPropagation(); 
                handleClose(); 
              }}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              whileTap={{ scale: 0.95 }}
            >
              ×
            </motion.button>
            <motion.h3 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {selectedTrack.title}
            </motion.h3>
            <motion.div 
              className="lyrics-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {selectedTrack.lyrics ? (
                <pre>{selectedTrack.lyrics}</pre>
              ) : (
                <p className="lyrics-placeholder">Lyrics coming soon...</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DiscographyItem;
