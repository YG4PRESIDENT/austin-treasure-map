// ============================================================
// Austin Treasure Map — Sidebar Detail Panel
// ============================================================

import { CATEGORIES } from './data.js';
import { isVisited, toggleVisited, getNote, setNote } from './state.js';
import { refreshMarkerIcon } from './map.js';

let currentPlace = null;
let noteDebounce = null;

function el(id) { return document.getElementById(id); }

export function initSidebar() {
  // Close button
  el('sidebar-close').addEventListener('click', closeSidebar);

  // Click outside sidebar on map to close
  document.getElementById('map').addEventListener('click', (e) => {
    if (e.target.closest('.leaflet-marker-icon') || e.target.closest('.leaflet-popup')) return;
    // Only close if clicking on the map tile area, not controls
    if (e.target.closest('.leaflet-control')) return;
  });

  // Visited toggle
  el('sidebar-visited-btn').addEventListener('click', () => {
    if (!currentPlace) return;
    const nowVisited = toggleVisited(currentPlace.id);
    refreshMarkerIcon(currentPlace.id);
    updateVisitedUI(nowVisited);
    updateProgressBar();
    if (nowVisited) playDiscoveredAnimation();
  });

  // Notes auto-save
  el('sidebar-notes').addEventListener('input', (e) => {
    if (!currentPlace) return;
    clearTimeout(noteDebounce);
    noteDebounce = setTimeout(() => {
      setNote(currentPlace.id, e.target.value);
    }, 400);
  });
}

export function openSidebar(place) {
  currentPlace = place;
  const cat = CATEGORIES[place.category] || {};

  el('sidebar-name').textContent = place.name;
  el('sidebar-category').textContent = `${cat.icon || ''} ${cat.label || place.category}`;
  el('sidebar-category').style.background = cat.color || '#888';
  el('sidebar-neighborhood').textContent = place.neighborhood;
  el('sidebar-description').textContent = place.description || '';
  el('sidebar-source').textContent = place.source ? `Source: ${place.source}` : '';
  el('sidebar-notes').value = getNote(place.id);

  // Day trip badge
  const dtEl = el('sidebar-daytrip');
  if (place.dayTrip) {
    dtEl.style.display = 'inline-block';
    dtEl.textContent = '🚗 Day Trip';
  } else {
    dtEl.style.display = 'none';
  }

  // Address link
  const addrEl = el('sidebar-address');
  if (place.address) {
    addrEl.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`;
    addrEl.textContent = place.address;
    addrEl.style.display = 'block';
  } else {
    addrEl.style.display = 'none';
  }

  // Visited state
  updateVisitedUI(isVisited(place.id));

  // Show sidebar
  const sidebar = el('sidebar');
  sidebar.classList.add('open');
  sidebar.setAttribute('aria-hidden', 'false');
}

export function closeSidebar() {
  const sidebar = el('sidebar');
  sidebar.classList.remove('open');
  sidebar.setAttribute('aria-hidden', 'true');
  currentPlace = null;
}

function updateVisitedUI(visited) {
  const btn = el('sidebar-visited-btn');
  btn.classList.toggle('visited', visited);
  btn.innerHTML = visited
    ? '✓ Discovered!'
    : '☐ Mark as Discovered';
}

function playDiscoveredAnimation() {
  const btn = el('sidebar-visited-btn');
  btn.classList.add('celebrate');
  setTimeout(() => btn.classList.remove('celebrate'), 800);
}

// Progress bar — exported so app.js can call it on init
export function updateProgressBar() {
  // Dynamically import to get count — avoid circular dep
  import('./data.js').then(({ PLACES }) => {
    import('./state.js').then(({ getVisitedCount }) => {
      const total = PLACES.filter(p => p.lat && p.lng).length;
      const count = getVisitedCount();
      const pct = total > 0 ? (count / total) * 100 : 0;

      el('progress-count').textContent = `${count} / ${total}`;
      el('progress-fill').style.width = `${pct}%`;

      // Milestone animations
      const bar = el('progress-bar');
      bar.classList.remove('milestone');
      if (pct >= 25 && pct < 50) bar.dataset.milestone = '25';
      else if (pct >= 50 && pct < 75) bar.dataset.milestone = '50';
      else if (pct >= 75 && pct < 100) bar.dataset.milestone = '75';
      else if (pct >= 100) {
        bar.dataset.milestone = '100';
        bar.classList.add('milestone');
      }
    });
  });
}

export function getCurrentPlace() {
  return currentPlace;
}
