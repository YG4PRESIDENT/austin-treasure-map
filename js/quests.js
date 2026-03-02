// ============================================================
// Austin Treasure Map — Quest / Next Adventure System
// ============================================================

import { PLACES, CATEGORY_GROUPS, getGroupForCategory } from './data.js';
import { isVisited, getCurrentQuest, setCurrentQuest, addQuestToHistory } from './state.js';

const AUSTIN_CENTER = { lat: 30.2672, lng: -97.7431 };

const HINT_TEMPLATES = [
  (p, g, dir) => `A hidden ${g.label.toLowerCase()} treasure awaits near ${p.neighborhood}...`,
  (p, g, dir) => `Venture ${dir} — ${p.description.split(' ').slice(0, 8).join(' ')}...`,
  (p, g, dir) => `In the realm of ${p.neighborhood}, a ${g.icon} gem lies undiscovered...`,
  (p, g, dir) => `Seek the ${g.icon} where ${p.neighborhood} keeps its secrets...`,
  (p, g, dir) => `Journey ${dir} to uncover a ${g.label.toLowerCase()} mystery...`,
  (p, g, dir) => `The ${p.neighborhood} district hides a ${g.label.toLowerCase()} wonder...`,
];

function getDirection(fromLat, fromLng, toLat, toLng) {
  const dLat = toLat - fromLat;
  const dLng = toLng - fromLng;
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI);
  if (angle > -22.5 && angle <= 22.5) return 'north';
  if (angle > 22.5 && angle <= 67.5) return 'northeast';
  if (angle > 67.5 && angle <= 112.5) return 'east';
  if (angle > 112.5 && angle <= 157.5) return 'southeast';
  if (angle > 157.5 || angle <= -157.5) return 'south';
  if (angle > -157.5 && angle <= -112.5) return 'southwest';
  if (angle > -112.5 && angle <= -67.5) return 'west';
  return 'northwest';
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getUndiscovered() {
  return PLACES.filter(p => p.lat && p.lng && !isVisited(p.id));
}

function generateHint(place) {
  const group = CATEGORY_GROUPS[getGroupForCategory(place.category)];
  const dir = getDirection(AUSTIN_CENTER.lat, AUSTIN_CENTER.lng, place.lat, place.lng);
  const template = HINT_TEMPLATES[Math.floor(Math.random() * HINT_TEMPLATES.length)];
  return template(place, group, dir);
}

export function generateQuest() {
  const undiscovered = getUndiscovered();
  if (undiscovered.length === 0) return null;
  const place = undiscovered[Math.floor(Math.random() * undiscovered.length)];
  setCurrentQuest(place.id);
  addQuestToHistory(place.id);
  return place;
}

export function getActiveQuest() {
  const questId = getCurrentQuest();
  if (!questId) return null;
  const place = PLACES.find(p => p.id === questId);
  if (!place || isVisited(place.id)) return null;
  return place;
}

export function getDistanceToQuest(userLat, userLng, quest) {
  if (!quest) return null;
  return haversineDistance(userLat, userLng, quest.lat, quest.lng);
}

export function rerollQuest() {
  return generateQuest();
}

let watchId = null;
let userPosition = null;

function startLocationWatch(onUpdate) {
  if (!navigator.geolocation) return;
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (onUpdate) onUpdate(userPosition);
    },
    () => { /* GPS denied or unavailable — graceful fallback */ },
    { enableHighAccuracy: false, maximumAge: 30000 }
  );
}

export function getUserPosition() {
  return userPosition;
}

export function renderQuestCard(container, { onFlyTo } = {}) {
  let quest = getActiveQuest();
  if (!quest) quest = generateQuest();

  if (!quest) {
    container.innerHTML = `
      <div class="quest-card quest-card--complete">
        <div class="quest-card__icon">🏆</div>
        <div class="quest-card__title">All Treasures Found!</div>
        <div class="quest-card__hint">You've discovered every hidden gem in Austin.</div>
      </div>`;
    return;
  }

  const hint = generateHint(quest);
  const group = CATEGORY_GROUPS[getGroupForCategory(quest.category)];
  const distText = userPosition
    ? `📍 ${haversineDistance(userPosition.lat, userPosition.lng, quest.lat, quest.lng).toFixed(1)} mi away`
    : '📍 Enable GPS for distance';

  container.innerHTML = `
    <div class="quest-card">
      <div class="quest-card__header">
        <span class="quest-card__icon">🗺</span>
        <span class="quest-card__title">Next Adventure</span>
      </div>
      <div class="quest-card__hint">"${hint}"</div>
      <div class="quest-card__meta">
        <span class="quest-card__group">${group.icon} ${group.label}</span>
        <span class="quest-card__distance" id="quest-distance">${distText}</span>
      </div>
      <div class="quest-card__actions">
        <button class="quest-card__btn quest-card__btn--reroll" id="quest-reroll">🎲 Re-roll</button>
        <button class="quest-card__btn quest-card__btn--reveal" id="quest-reveal">👁 Reveal</button>
      </div>
    </div>`;

  container.querySelector('#quest-reroll').addEventListener('click', () => {
    renderQuestCard(container, { onFlyTo });
  });

  container.querySelector('#quest-reveal').addEventListener('click', () => {
    if (quest && onFlyTo) onFlyTo(quest);
  });

  // Start watching position for distance updates
  startLocationWatch((pos) => {
    const distEl = container.querySelector('#quest-distance');
    if (distEl && quest) {
      const d = haversineDistance(pos.lat, pos.lng, quest.lat, quest.lng);
      distEl.textContent = `📍 ${d.toFixed(1)} mi away`;
    }
  });
}

export function refreshQuest(container, opts) {
  renderQuestCard(container, opts);
}
