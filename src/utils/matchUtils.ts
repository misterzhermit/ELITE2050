import { Match, WorldState, MatchStatus } from '../types';

/**
 * Checks if a match should be in 'LOCKED' status based on current game time.
 * A match is locked 1 hour (60 minutes) before its scheduled time.
 */
export const getMatchStatus = (match: Match, currentDate: string): MatchStatus => {
  if (match.status === 'FINISHED' || match.status === 'PLAYING') {
    return match.status;
  }

  // Ensure match has date and time properties before processing
  if (!match || !match.date || !match.time) {
    console.warn(`Match ${match?.id || 'unknown'} is missing date or time properties`);
    return match?.status || 'SCHEDULED';
  }

  const matchDateTime = new Date(`${match.date.split('T')[0]}T${match.time}:00`);
  const currentGameDateTime = new Date(currentDate);
  
  const diffInMs = matchDateTime.getTime() - currentGameDateTime.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);

  if (diffInMinutes <= 0) {
    // If it's past the time + 6 minutes, it's finished
    if (diffInMinutes <= -6) {
      return 'FINISHED';
    }
    return 'PLAYING';
  }

  if (diffInMinutes <= 60) {
    return 'LOCKED';
  }

  return 'SCHEDULED';
};

/**
 * Checks if a match is currently in the 6-minute "LIVE" window.
 */
export const isMatchLive = (match: Match, currentDate: string): boolean => {
  if (!match || !match.date || !match.time) return false;
  const matchDateTime = new Date(`${match.date.split('T')[0]}T${match.time}:00`);
  const currentGameDateTime = new Date(currentDate);
  
  const diffInMs = currentGameDateTime.getTime() - matchDateTime.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);

  // Match lasts 6 minutes real-time for the user
  return diffInMinutes >= 0 && diffInMinutes < 6;
};

/**
 * Calculates the current real-time second (0-360) for a live match.
 */
export const getLiveMatchSecond = (match: Match, currentDate: string): number => {
  if (!match || !match.date || !match.time) return 0;
  const matchDateTime = new Date(`${match.date.split('T')[0]}T${match.time}:00`);
  const currentGameDateTime = new Date(currentDate);
  
  const diffInMs = currentGameDateTime.getTime() - matchDateTime.getTime();
  return Math.max(0, Math.min(360, Math.floor(diffInMs / 1000)));
};
