// Import album info and tracks
import { albumInfo as distanceInfo, tracks as distanceTracks } from './albums/distance';
import { albumInfo as legacyInfo, tracks as legacyTracks } from './albums/legacy';
import { albumInfo as rafikiInfo, tracks as rafikiTracks } from './albums/rafiki';
import { albumInfo as downInTheDirtInfo, tracks as downInTheDirtTracks } from './albums/down-in-the-dirt';

// Import EP info and tracks
import { epInfo as zenoInfo, tracks as zenoTracks } from './eps/zeno';
import { epInfo as paradoxInfo, tracks as paradoxTracks } from './eps/paradox';

// Create complete album objects with info and tracks
export const albums = [
  {
    ...distanceInfo,
    tracks: distanceTracks,
  },
  {
    ...legacyInfo,
    tracks: legacyTracks,
  },
  {
    ...rafikiInfo,
    tracks: rafikiTracks,
  },
  {
    ...downInTheDirtInfo,
    tracks: downInTheDirtTracks,
  }
];

// Create complete EP objects with info and tracks
export const eps = [
  {
    ...zenoInfo,
    tracks: zenoTracks,
  },
  {
    ...paradoxInfo,
    tracks: paradoxTracks,
  }
];

// All releases combined
export const allReleases = [...albums, ...eps];

// Helper function to find a release by ID
export const findReleaseById = (id) => {
  return allReleases.find(release => release.id === id);
};

// Helper function to find a track by ID within a specific release
export const findTrackById = (releaseId, trackId) => {
  const release = findReleaseById(releaseId);
  if (!release) return null;
  
  return release.tracks.find(track => track.id === trackId);
};

// Helper function to find a track by ID across all releases
export const findTrackByIdGlobal = (trackId) => {
  for (const release of allReleases) {
    const track = release.tracks.find(t => t.id === trackId);
    if (track) {
      return { release, track };
    }
  }
  return null;
};
