import { Match, MatchStatus } from '../types';
import { MATCH_REAL_TIME_SECONDS } from '../constants/gameConstants';

/**
 * Checks if a match should be in 'LOCKED' status based on current game time.
 * A match is locked 1 hour (60 minutes) before its scheduled time.
 */
export const getMatchStatus = (match: Match, currentDate: string): MatchStatus => {
  if (match.status === 'FINISHED') {
    return 'FINISHED';
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

  // Match duration in game minutes
  // With 1:1 time scale (1 real sec = 1 game sec), the match lasts 6 real minutes.
  // So it lasts 6 game minutes.
  // MATCH_REAL_TIME_SECONDS = 360.
  const matchDurationMinutes = MATCH_REAL_TIME_SECONDS / 60;

  if (diffInMinutes <= 0) {
    // If it's past the time + duration, it's finished
    if (diffInMinutes <= -matchDurationMinutes) {
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
 * Checks if a match is currently in the "LIVE" window.
 */
export const isMatchLive = (match: Match, currentDate: string): boolean => {
  if (!match || !match.date || !match.time) return false;
  const matchDateTime = new Date(`${match.date.split('T')[0]}T${match.time}:00`);
  const currentGameDateTime = new Date(currentDate);
  
  const diffInMs = currentGameDateTime.getTime() - matchDateTime.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);

  return diffInMinutes >= 0 && diffInMinutes < MATCH_REAL_TIME_SECONDS;
};

/**
 * Calculates the current progress (0-360) for a live match.
 * Maps 1:1 from game minutes to VOD seconds.
 */
export const getLiveMatchSecond = (match: Match, currentDate: string): number => {
  if (!match || !match.date || !match.time) return 0;
  const matchDateTime = new Date(`${match.date.split('T')[0]}T${match.time}:00`);
  const currentGameDateTime = new Date(currentDate);
  
  const diffInMs = currentGameDateTime.getTime() - matchDateTime.getTime();
  const diffInSeconds = diffInMs / 1000;

  return Math.max(0, Math.min(MATCH_REAL_TIME_SECONDS, Math.floor(diffInSeconds)));
};
