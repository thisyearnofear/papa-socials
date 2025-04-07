// Import all releases from the lyrics structure
import { albums, eps, allReleases } from './lyrics';

// Export them for use in the application
export { albums, eps, allReleases };

// Add any additional discography-related functions here

// Format a release date for display
export const formatReleaseDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get the year from a release date
export const getReleaseYear = (dateString) => {
  const date = new Date(dateString);
  return date.getFullYear().toString();
};

// Sort releases by date (newest first)
export const getSortedReleases = () => {
  return [...allReleases].sort((a, b) => {
    return new Date(b.releaseDate) - new Date(a.releaseDate);
  });
};
