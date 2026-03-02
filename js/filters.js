// ============================================================
// Austin Treasure Map — Filters & Search (5 Category Groups)
// ============================================================

import { PLACES, CATEGORIES, CATEGORY_GROUPS } from './data.js';
import { isVisited } from './state.js';
import { getMarkersLayer, getMarkerMap, flyToPlace } from './map.js';
import { openSidebar } from './sidebar.js';

let activeCategories = new Set(Object.keys(CATEGORIES));
let showDayTrips = true;

function el(id) { return document.getElementById(id); }

export function initFilters() {
  buildGroupButtons(el('filter-bar'));
  buildGroupButtons(el('mobile-filter-chips'));
  buildSearchBox('search-input', 'search-results');
  buildSearchBox('mobile-search-input', 'mobile-search-results');
  applyFilters();
}

// --- Group Buttons (5 groups + "All") ---
function buildGroupButtons(container) {
  if (!container) return;

  // "All" button
  const allBtn = document.createElement('button');
  allBtn.className = 'group-btn group-btn--all active';
  allBtn.dataset.group = 'all';
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => {
    activeCategories = new Set(Object.keys(CATEGORIES));
    showDayTrips = true;
    syncAllGroupButtons();
    applyFilters();
  });
  container.appendChild(allBtn);

  // Group buttons
  Object.entries(CATEGORY_GROUPS).forEach(([key, group]) => {
    const count = PLACES.filter(p =>
      group.categories.includes(p.category) && p.lat && p.lng
    ).length;

    const btn = document.createElement('button');
    btn.className = 'group-btn active';
    btn.dataset.group = key;
    btn.style.setProperty('--group-color', group.color);
    btn.innerHTML = `<span class="group-btn__icon">${group.icon}</span>${group.label} <span class="group-btn__count">${count}</span>`;
    btn.addEventListener('click', () => toggleGroup(key));
    container.appendChild(btn);
  });
}

function toggleGroup(groupKey) {
  const group = CATEGORY_GROUPS[groupKey];
  if (!group) return;

  // Check if all categories in this group are currently active
  const allActive = group.categories.every(c => activeCategories.has(c));

  if (allActive) {
    // Deactivate this group
    group.categories.forEach(c => activeCategories.delete(c));
  } else {
    // Activate this group
    group.categories.forEach(c => activeCategories.add(c));
  }

  syncAllGroupButtons();
  applyFilters();
}

function syncAllGroupButtons() {
  // Sync all group button instances (desktop nav + mobile chips)
  document.querySelectorAll('.group-btn').forEach(btn => {
    const groupKey = btn.dataset.group;
    if (groupKey === 'all') {
      const allActive = activeCategories.size === Object.keys(CATEGORIES).length;
      btn.classList.toggle('active', allActive);
    } else {
      const group = CATEGORY_GROUPS[groupKey];
      if (group) {
        const allActive = group.categories.every(c => activeCategories.has(c));
        btn.classList.toggle('active', allActive);
      }
    }
  });
}

// --- Search ---
function buildSearchBox(inputId, resultsId) {
  const input = el(inputId);
  if (!input) return;

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    if (query) {
      applyFilters(query);
      showSearchResults(query, resultsId, inputId);
    } else {
      hideSearchResults(resultsId);
      applyFilters();
    }
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      hideSearchResults(resultsId);
      applyFilters();
    }
  });
}

function showSearchResults(query, resultsId, inputId) {
  const results = el(resultsId);
  if (!results) return;

  const matches = PLACES.filter(p =>
    p.lat && p.lng &&
    (p.name.toLowerCase().includes(query) ||
     p.description.toLowerCase().includes(query) ||
     p.neighborhood.toLowerCase().includes(query))
  ).slice(0, 8);

  if (matches.length === 0) {
    results.innerHTML = '<div class="search-no-results">No treasures found</div>';
  } else {
    results.innerHTML = matches.map(p => {
      const cat = CATEGORIES[p.category] || {};
      return `<div class="search-result-item" data-id="${p.id}">
        <span class="search-result-icon">${cat.icon || '📍'}</span>
        <div>
          <strong>${p.name}</strong>
          <small>${p.neighborhood}</small>
        </div>
      </div>`;
    }).join('');

    results.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const place = PLACES.find(p => p.id === item.dataset.id);
        if (place) {
          flyToPlace(place);
          openSidebar(place);
          hideSearchResults(resultsId);
          el(inputId).value = '';
          // On mobile, switch back to map tab
          import('./mobile.js').then(m => m.switchTab('map')).catch(() => {});
        }
      });
    });
  }

  results.style.display = 'block';
}

function hideSearchResults(resultsId) {
  const results = el(resultsId);
  if (results) results.style.display = 'none';
}

// --- Apply Filters to Map ---
function applyFilters(searchQuery = '') {
  const markerMap = getMarkerMap();
  const layer = getMarkersLayer();

  PLACES.forEach(place => {
    const marker = markerMap[place.id];
    if (!marker) return;

    let visible = activeCategories.has(place.category);
    if (place.dayTrip && !showDayTrips) visible = false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        place.name.toLowerCase().includes(q) ||
        place.description.toLowerCase().includes(q) ||
        place.neighborhood.toLowerCase().includes(q);
      if (!matchesSearch) visible = false;
    }

    if (visible && !layer.hasLayer(marker)) {
      layer.addLayer(marker);
    } else if (!visible && layer.hasLayer(marker)) {
      layer.removeLayer(marker);
    }
  });
}

export function getActiveCategories() {
  return activeCategories;
}
