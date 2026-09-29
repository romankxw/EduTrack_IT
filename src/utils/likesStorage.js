// src/utils/likesStorage.js
// Manages local persistence of user-liked course IDs in localStorage

const STORAGE_KEY = 'edutrack_liked_courses';

function readLikedSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeLikedSet(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // LocalStorage quota or access denied fallback
  }
}

export const likesStorage = {
  isLiked(courseId) {
    const set = readLikedSet();
    return set.has(String(courseId));
  },

  setLiked(courseId, liked) {
    const set = readLikedSet();
    const key = String(courseId);
    if (liked) {
      set.add(key);
    } else {
      set.delete(key);
    }
    writeLikedSet(set);
    return set.has(key);
  },

  toggle(courseId) {
    const set = readLikedSet();
    const key = String(courseId);
    const nextState = !set.has(key);
    if (nextState) {
      set.add(key);
    } else {
      set.delete(key);
    }
    writeLikedSet(set);
    return nextState;
  },
};
