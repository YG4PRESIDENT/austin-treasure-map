// ============================================================
// Austin Treasure Map — Filters, Search & List View
// ============================================================

import { PLACES, CATEGORIES } from './data.js';
import { isVisited, getNote } from './state.js';
import { getMarkersLayer, getMarkerMap, flyToPlace, getMap } from './map.js';
import { openSidebar } from './sidebar.js';
import { getNeighborhoodNames } from './neighborhoods.js';

let activeCategories = new Set(Object.keys(CATEGORIES));
let showDayTrips = true;
let listViewActive = false;

function el(id) { return document.getElementById(id); }

export function initFilters() {
  buildCategoryBar();
  buildSearchBox();
  buildListView();
  buildNeighborhoodDropdown();
  applyFilters();
}

// --- Category Filter Bar ---
function buildCategoryBar() {
  const bar = el('filter-bar');
  if (!bar) return;

  // "All" button
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn filter-all active';
  allBtn.textContent = 'All';
  allBtn.addEventListener('click', () => {
    activeCategories = new Set(Object.keys(CATEGORIES));
    updateFilterButtons();
    applyFilters();
  });
  bar.appendChild(allBtn);

  // Category buttons
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const count = PLACES.filter(p => p.category === key).length;
    const btn = document.createElement('button');
    btn.className = 'filter-btn active';
    btn.dataset.category = key;
    btn.innerHTML = `${cat.icon} ${cat.label} <span class="filter-count">${count}</span>`;
    btn.style.setProperty('--cat-color', cat.color);
    btn.addEventListener('click', () => {
      if (activeCategories.has(key)) {
        activeCategories.delete(key);
      } else {
        activeCategories.add(key);
      }
      updateFilterButtons();
      applyFilters();
    });
    bar.appendChild(btn);
  });

  // Day Trips toggle
  const dayTripCount = PLACES.filter(p => p.dayTrip && p.lat && p.lng).length;
  const dtBtn = document.createElement('button');
  dtBtn.className = 'filter-btn filter-daytrip active';
  dtBtn.innerHTML = `🚗 Day Trips <span class="filter-count">${dayTripCount}</span>`;
  dtBtn.addEventListener('click', () => {
    showDayTrips = !showDayTrips;
    dtBtn.classList.toggle('active', showDayTrips);
    applyFilters();
  });
  bar.appendChild(dtBtn);
}

function updateFilterButtons() {
  document.querySelectorAll('.filter-btn[data-category]').forEach(btn => {
    btn.classList.toggle('active', activeCategories.has(btn.dataset.category));
  });
  const allActive = activeCategories.size === Object.keys(CATEGORIES).length;
  const allBtn = document.querySelector('.filter-all');
  if (allBtn) allBtn.classList.toggle('active', allActive);
}

// --- Search ---
function buildSearchBox() {
  const input = el('search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    if (query) {
      applyFilters(query);
      showSearchResults(query);
    } else {
      hideSearchResults();
      applyFilters();
    }
  });

  // Close search results on Escape
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      hideSearchResults();
      applyFilters();
    }
  });
}

function showSearchResults(query) {
  let results = el('search-results');
  if (!results) {
    results = document.createElement('div');
    results.id = 'search-results';
    results.className = 'search-results';
    el('search-input').parentElement.appendChild(results);
  }

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
          hideSearchResults();
          el('search-input').value = '';
          if (listViewActive) toggleListView();
        }
      });
    });
  }

  results.style.display = 'block';
}

function hideSearchResults() {
  const results = el('search-results');
  if (results) results.style.display = 'none';
}

// --- List View ---
function buildListView() {
  const btn = el('list-view-toggle');
  if (!btn) return;
  btn.addEventListener('click', toggleListView);

  // Sort controls
  el('sort-select')?.addEventListener('change', () => renderListView());
}

function toggleListView() {
  listViewActive = !listViewActive;
  const container = el('list-view');
  const mapEl = el('map');
  const btn = el('list-view-toggle');

  if (listViewActive) {
    container.style.display = 'block';
    mapEl.style.display = 'none';
    btn.classList.add('active');
    btn.textContent = '🗺️ Map View';
    renderListView();
  } else {
    container.style.display = 'none';
    mapEl.style.display = 'block';
    btn.classList.remove('active');
    btn.textContent = '📋 List View';
    // Invalidate map size after re-showing
    setTimeout(() => getMap().invalidateSize(), 100);
  }
}

export function renderListView() {
  const container = el('list-view-content');
  if (!container) return;

  const sort = el('sort-select')?.value || 'alpha';
  let places = PLACES.filter(p => p.lat && p.lng);

  // Apply current filters
  places = places.filter(p => activeCategories.has(p.category));
  if (!showDayTrips) places = places.filter(p => !p.dayTrip);

  // Sort
  switch (sort) {
    case 'alpha':
      places.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'category':
      places.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      break;
    case 'neighborhood':
      places.sort((a, b) => a.neighborhood.localeCompare(b.neighborhood) || a.name.localeCompare(b.name));
      break;
    case 'visited':
      places.sort((a, b) => (isVisited(b.id) ? 1 : 0) - (isVisited(a.id) ? 1 : 0) || a.name.localeCompare(b.name));
      break;
    case 'unvisited':
      places.sort((a, b) => (isVisited(a.id) ? 1 : 0) - (isVisited(b.id) ? 1 : 0) || a.name.localeCompare(b.name));
      break;
  }

  container.innerHTML = places.map(p => {
    const cat = CATEGORIES[p.category] || {};
    const visited = isVisited(p.id);
    const note = getNote(p.id);
    return `<div class="list-item ${visited ? 'list-item-visited' : ''}" data-id="${p.id}">
      <div class="list-item-icon" style="background:${cat.color}">${cat.icon}</div>
      <div class="list-item-info">
        <div class="list-item-name">${p.name} ${visited ? '<span class="list-check">✓</span>' : ''}</div>
        <div class="list-item-meta">
          <span class="list-item-neighborhood">${p.neighborhood}</span>
          ${p.dayTrip ? '<span class="list-item-daytrip">🚗 Day Trip</span>' : ''}
        </div>
        ${note ? `<div class="list-item-note">"${note.slice(0, 60)}${note.length > 60 ? '…' : ''}"</div>` : ''}
      </div>
    </div>`;
  }).join('');

  container.querySelectorAll('.list-item').forEach(item => {
    item.addEventListener('click', () => {
      const place = PLACES.find(p => p.id === item.dataset.id);
      if (place) {
        toggleListView();
        setTimeout(() => {
          flyToPlace(place);
          openSidebar(place);
        }, 150);
      }
    });
  });
}

// --- Neighborhood Dropdown ---
function buildNeighborhoodDropdown() {
  const select = el('neighborhood-select');
  if (!select) return;

  const names = getNeighborhoodNames();
  names.sort().forEach(name => {
    const count = PLACES.filter(p => p.neighborhood === name).length;
    if (count === 0) return;
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = `${name} (${count})`;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    const name = select.value;
    if (!name) return;
    const placesInHood = PLACES.filter(p => p.neighborhood === name && p.lat && p.lng);
    if (placesInHood.length > 0) {
      const bounds = L.latLngBounds(placesInHood.map(p => [p.lat, p.lng]));
      getMap().fitBounds(bounds.pad(0.3));
    }
    select.value = '';
  });
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
