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
// Wide enough to include day trips (Enchanted Rock, New Braunfels, etc.)
const MAX_BOUNDS = L.latLngBounds([29.50, -99.10], [30.75, -97.20]);

// --- Tile Layers ---
function createBaseLayers() {
  const watercolor = L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
    { attribution: '&copy; Stadia Maps &copy; Stamen Design', maxZoom: 18 }
  );

  const terrain = L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png',
    { attribution: '&copy; Stadia Maps &copy; Stamen Design', maxZoom: 18 }
  );

  const voyager = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 20, subdomains: 'abcd' }
  );

  const darkMatter = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    { attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 20, subdomains: 'abcd' }
  );

  const satellite = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: '&copy; Esri', maxZoom: 19 }
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
    'https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}.png',
    { attribution: '&copy; Stadia Maps', maxZoom: 18, opacity: 0.4 }
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

  // Restore saved style or default to Treasure Map
  const savedStyle = getPreference('mapStyle', '🗺️ Treasure Map');
  const defaultLayer = baseLayers[savedStyle] || baseLayers['🗺️ Treasure Map'];

  map = L.map('map', {
    center: AUSTIN_CENTER,
    zoom: DEFAULT_ZOOM,
    layers: [defaultLayer],
    maxBounds: MAX_BOUNDS,
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

  // Locate control (GPS)
  L.control.locate({
    position: 'topright',
    strings: { title: 'Locate Me' },
    flyTo: true,
    keepCurrentZoomLevel: true,
    locateOptions: { maxZoom: 15 },
  }).addTo(map);

  // Fullscreen control
  map.addControl(new L.Control.Fullscreen({ position: 'topright' }));

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
    if (!place.lat || !place.lng) return; // skip places without coordinates

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
