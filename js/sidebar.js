// ============================================================
// Austin Treasure Map — Sidebar Detail Panel
// ============================================================

import { PLACES, CATEGORIES } from './data.js';
import { isVisited, toggleVisited, getNote, setNote, getVisitedCount } from './state.js';
import { refreshMarkerIcon } from './map.js';

let currentPlace = null;
let noteDebounce = null;
let onVisitedChange = null; // callback for list view refresh

function el(id) { return document.getElementById(id); }

export function initSidebar(opts = {}) {
  if (opts.onVisitedChange) onVisitedChange = opts.onVisitedChange;

  // Close button
  el('sidebar-close').addEventListener('click', closeSidebar);

  // Click outside sidebar on map to close
  document.getElementById('map').addEventListener('click', (e) => {
    if (!currentPlace) return;
    if (e.target.closest('.leaflet-marker-icon')) return;
    if (e.target.closest('.leaflet-popup')) return;
    if (e.target.closest('.leaflet-control')) return;
    closeSidebar();
  });

  // Visited toggle
  el('sidebar-visited-btn').addEventListener('click', () => {
    if (!currentPlace) return;
    const nowVisited = toggleVisited(currentPlace.id);
    refreshMarkerIcon(currentPlace.id);
    updateVisitedUI(nowVisited);
    updateProgressBar();
    if (nowVisited) playDiscoveredAnimation();
    if (onVisitedChange) onVisitedChange();
  });

  // Notes auto-save
  el('sidebar-notes').addEventListener('input', (e) => {
    if (!currentPlace) return;
    clearTimeout(noteDebounce);
    noteDebounce = setTimeout(() => {
      setNote(currentPlace.id, e.target.value);
      showSaveIndicator();
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

function showSaveIndicator() {
  const label = el('sidebar-notes-section')?.querySelector('.notes-label');
  if (!label) return;
  label.textContent = 'Personal Notes — saved ✓';
  setTimeout(() => { label.textContent = 'Personal Notes'; }, 1500);
}

// Progress bar
export function updateProgressBar() {
  const total = PLACES.filter(p => p.lat && p.lng).length;
  const count = getVisitedCount();
  const pct = total > 0 ? (count / total) * 100 : 0;

  el('progress-count').textContent = `${count} / ${total}`;
  el('progress-fill').style.width = `${pct}%`;

  // Milestone check
  const bar = el('progress-bar');
  bar.classList.remove('milestone');
  if (pct >= 100) {
    bar.dataset.milestone = '100';
    bar.classList.add('milestone');
  } else if (pct >= 75) {
    bar.dataset.milestone = '75';
  } else if (pct >= 50) {
    bar.dataset.milestone = '50';
  } else if (pct >= 25) {
    bar.dataset.milestone = '25';
  } else {
    delete bar.dataset.milestone;
  }
}

export function getCurrentPlace() {
  return currentPlace;
}
