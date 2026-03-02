// ============================================================
// Austin Treasure Map — Map Initialization & Tile Layers
// ============================================================

import { PLACES, CATEGORIES } from './data.js';
import { isVisited, getPreference, setPreference } from './state.js';

let map;
let markersLayer;
let markerMap = {};  // placeId → L.marker

const AUSTIN_CENTER = [30.2672, -97.7431];
const DEFAULT_ZOOM = 12;

// --- Tile Layers ---
// All providers below are free and require NO API key
function createBaseLayers() {
  // Esri NatGeo — vintage hand-drawn cartographic style, perfect treasure map feel
  const watercolor = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: '&copy; Esri / National Geographic',
      maxZoom: 16,
    }
  );

  const terrain = L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenTopoMap &copy; OpenStreetMap',
      maxZoom: 17,
    }
  );

  const voyager = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20,
      subdomains: 'abcd',
    }
  );

  const darkMatter = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20,
      subdomains: 'abcd',
    }
  );

  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: '&copy; Esri',
      maxZoom: 19,
    }
  );

  return {
    '🗺️ Treasure Map': watercolor,
    '⛰️ Explorer Map': terrain,
    '🏙️ City Map': voyager,
    '🌙 Dark Mode': darkMatter,
    '🛰️ Satellite': satellite,
  };
}

function createOverlays() {
  const labels = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
    {
      attribution: '&copy; CARTO',
      maxZoom: 20,
      subdomains: 'abcd',
      opacity: 0.5,
    }
  );
  return { '🏷️ Street Labels': labels };
}

// --- Custom Markers ---
function createMarkerIcon(place) {
  const cat = CATEGORIES[place.category] || {};
  const visited = isVisited(place.id);
  const isDayTrip = place.dayTrip;

  const size = isDayTrip ? 40 : 32;
  const glowClass = visited ? 'marker-discovered' : 'marker-undiscovered';
  const dayTripBadge = isDayTrip
    ? `<span class="day-trip-badge">DAY TRIP</span>`
    : '';

  return L.divIcon({
    className: `custom-marker ${glowClass}`,
    html: `
      <div class="marker-pin" style="background:${cat.color || '#888'}">
        <span class="marker-emoji">${cat.icon || '📍'}</span>
        ${visited ? '<span class="marker-check">✓</span>' : ''}
      </div>
      ${dayTripBadge}
    `,
    iconSize: [size, size + 10],
    iconAnchor: [size / 2, size + 10],
    popupAnchor: [0, -(size + 5)],
  });
}

// --- Public API ---
export function initMap() {
  const baseLayers = createBaseLayers();
  const overlays = createOverlays();

  // Restore saved style or default to City Map (most reliable)
  const savedStyle = getPreference('mapStyle', '🏙️ City Map');
  const defaultLayer = baseLayers[savedStyle] || baseLayers['🏙️ City Map'];

  // Build maxBounds here (inside function, not at top-level)
  const maxBounds = L.latLngBounds([29.50, -99.10], [30.75, -97.20]);

  map = L.map('map', {
    center: AUSTIN_CENTER,
    zoom: DEFAULT_ZOOM,
    layers: [defaultLayer],
    maxBounds: maxBounds,
    maxBoundsViscosity: 0.8,
    zoomControl: false,
  });

  // Zoom control on top-right
  L.control.zoom({ position: 'topright' }).addTo(map);

  // Layer control (stored on map for later overlay additions)
  map._layerControl = L.control.layers(baseLayers, overlays, {
    position: 'topright',
    collapsed: true,
  }).addTo(map);

  // Save style preference on base layer change
  map.on('baselayerchange', (e) => {
    setPreference('mapStyle', e.name);
    document.body.classList.toggle('dark-mode', e.name === '🌙 Dark Mode');
    document.body.classList.toggle('sepia-mode', e.name === '🏙️ City Map');
  });

  // Set initial mode classes
  if (savedStyle === '🌙 Dark Mode') {
    document.body.classList.add('dark-mode');
  }
  if (savedStyle === '🏙️ City Map') {
    document.body.classList.add('sepia-mode');
  }

  // Locate control (GPS) — wrapped in try/catch in case plugin fails
  try {
    L.control.locate({
      position: 'topright',
      strings: { title: 'Locate Me' },
      flyTo: true,
      keepCurrentZoomLevel: true,
      locateOptions: { maxZoom: 15 },
    }).addTo(map);
  } catch (e) {
    console.warn('Locate control unavailable:', e);
  }

  // Fullscreen control
  try {
    map.addControl(new L.Control.Fullscreen({ position: 'topright' }));
  } catch (e) {
    console.warn('Fullscreen control unavailable:', e);
  }

  // Marker cluster group
  markersLayer = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cluster-icon">${count}</div>`,
        className: 'custom-cluster',
        iconSize: [44, 44],
      });
    },
  });
  map.addLayer(markersLayer);

  return map;
}

export function addMarkers(onMarkerClick) {
  PLACES.forEach((place) => {
    if (!place.lat || !place.lng) return;

    const marker = L.marker([place.lat, place.lng], {
      icon: createMarkerIcon(place),
      title: place.name,
    });

    marker.bindTooltip(place.name, {
      direction: 'top',
      offset: [0, -36],
      className: 'treasure-tooltip',
    });

    marker.on('click', () => {
      map.flyTo([place.lat, place.lng], 15, { duration: 1.2 });
      if (onMarkerClick) onMarkerClick(place);
    });

    marker.placeData = place;
    markerMap[place.id] = marker;
    markersLayer.addLayer(marker);
  });
}

export function refreshMarkerIcon(placeId) {
  const marker = markerMap[placeId];
  if (!marker) return;
  const place = marker.placeData;
  marker.setIcon(createMarkerIcon(place));
}

export function flyToPlace(place) {
  if (!place.lat || !place.lng) return;
  map.flyTo([place.lat, place.lng], 15, { duration: 1.2 });
}

export function fitAllMarkers() {
  if (markersLayer.getLayers().length > 0) {
    map.fitBounds(markersLayer.getBounds().pad(0.1));
  }
}

export function getMap() {
  return map;
}

export function getMarkerMap() {
  return markerMap;
}

export function getMarkersLayer() {
  return markersLayer;
}
