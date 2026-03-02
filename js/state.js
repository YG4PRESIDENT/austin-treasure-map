// ============================================================
// Austin Treasure Map — State Management (localStorage)
// ============================================================

const PREFIX = 'atm_';

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Safari private browsing or quota exceeded — fail silently
  }
}

// --- Visited ---
export function getVisited() {
  return safeGet('visited', {});
}

export function isVisited(placeId) {
  return !!getVisited()[placeId];
}

export function toggleVisited(placeId) {
  const visited = getVisited();
  if (visited[placeId]) {
    delete visited[placeId];
  } else {
    visited[placeId] = Date.now();
  }
  safeSet('visited', visited);
  return !!visited[placeId];
}

// --- Notes ---
export function getNotes() {
  return safeGet('notes', {});
}

export function getNote(placeId) {
  return getNotes()[placeId] || '';
}

export function setNote(placeId, text) {
  const notes = getNotes();
  if (text.trim()) {
    notes[placeId] = text;
  } else {
    delete notes[placeId];
  }
  safeSet('notes', notes);
}

// --- Preferences ---
export function getPreferences() {
  return safeGet('prefs', {});
}

export function getPreference(key, fallback = null) {
  return getPreferences()[key] ?? fallback;
}

export function setPreference(key, val) {
  const prefs = getPreferences();
  prefs[key] = val;
  safeSet('prefs', prefs);
}

// --- Export / Import ---
export function exportData() {
  const data = {
    visited: getVisited(),
    notes: getNotes(),
    prefs: getPreferences(),
    exportedAt: new Date().toISOString(),
    version: 1,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'austin-map-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data.visited) safeSet('visited', data.visited);
        if (data.notes) safeSet('notes', data.notes);
        if (data.prefs) safeSet('prefs', data.prefs);
        resolve(data);
      } catch (e) {
        reject(new Error('Invalid backup file'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsText(file);
  });
}

// --- Count helpers ---
export function getVisitedCount() {
  return Object.keys(getVisited()).length;
}

// --- Quest state ---
export function getQuestHistory() {
  return safeGet('questHistory', []);
}

export function addQuestToHistory(placeId) {
  const history = getQuestHistory();
  if (!history.includes(placeId)) {
    history.push(placeId);
    safeSet('questHistory', history);
  }
}

export function getCurrentQuest() {
  return safeGet('currentQuest', null);
}

export function setCurrentQuest(placeId) {
  safeSet('currentQuest', placeId);
}

// --- Milestone state ---
export function getLastMilestoneSeen() {
  return safeGet('lastMilestone', 0);
}

export function setLastMilestoneSeen(pct) {
  safeSet('lastMilestone', pct);
}
