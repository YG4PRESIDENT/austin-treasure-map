// ============================================================
// Austin Treasure Map — Neighborhood Overlays (Soft Fill + Mastery)
// ============================================================

import { PLACES } from './data.js';
import { isVisited } from './state.js';

let neighborhoodLayer = null;
let labelsLayer = null;
let neighborhoodPolygons = {}; // name → polygon
let neighborhoodLabels = {};   // name → label marker

// Organic polygon boundaries with per-neighborhood colors
const NEIGHBORHOODS = [
  {
    name: 'Downtown',
    color: '#FFD700',
    opacity: 0.08,
    bounds: [
      [30.258, -97.753], [30.258, -97.738], [30.262, -97.733],
      [30.270, -97.733], [30.275, -97.738], [30.275, -97.750],
      [30.270, -97.755], [30.263, -97.755],
    ],
  },
  {
    name: 'East Austin',
    color: '#FF6B35',
    opacity: 0.10,
    bounds: [
      [30.253, -97.735], [30.253, -97.695], [30.260, -97.688],
      [30.275, -97.688], [30.283, -97.693], [30.283, -97.732],
      [30.278, -97.737], [30.260, -97.737],
    ],
  },
  {
    name: 'South Congress',
    color: '#E91E63',
    opacity: 0.08,
    bounds: [
      [30.233, -97.758], [30.233, -97.744], [30.237, -97.742],
      [30.253, -97.742], [30.257, -97.746], [30.257, -97.756],
      [30.252, -97.760], [30.238, -97.760],
    ],
  },
  {
    name: 'Hyde Park',
    color: '#4CAF50',
    opacity: 0.08,
    bounds: [
      [30.293, -97.755], [30.293, -97.718], [30.298, -97.714],
      [30.313, -97.714], [30.317, -97.720], [30.317, -97.752],
      [30.312, -97.756], [30.298, -97.757],
    ],
  },
  {
    name: 'Zilker',
    color: '#2196F3',
    opacity: 0.08,
    bounds: [
      [30.253, -97.782], [30.253, -97.753], [30.258, -97.750],
      [30.268, -97.750], [30.274, -97.755], [30.274, -97.778],
      [30.268, -97.783], [30.258, -97.784],
    ],
  },
  {
    name: 'South Lamar',
    color: '#9C27B0',
    opacity: 0.08,
    bounds: [
      [30.233, -97.792], [30.233, -97.765], [30.238, -97.758],
      [30.252, -97.758], [30.257, -97.762], [30.257, -97.788],
      [30.252, -97.793], [30.238, -97.793],
    ],
  },
  {
    name: 'South First',
    color: '#00BCD4',
    opacity: 0.08,
    bounds: [
      [30.233, -97.760], [30.233, -97.748], [30.237, -97.745],
      [30.252, -97.745], [30.257, -97.748], [30.257, -97.758],
      [30.252, -97.761], [30.237, -97.762],
    ],
  },
  {
    name: 'Bouldin Creek',
    color: '#795548',
    opacity: 0.08,
    bounds: [
      [30.243, -97.767], [30.243, -97.748], [30.248, -97.745],
      [30.258, -97.745], [30.262, -97.749], [30.262, -97.764],
      [30.258, -97.768], [30.248, -97.769],
    ],
  },
  {
    name: 'North Loop',
    color: '#FF9800',
    opacity: 0.10,
    bounds: [
      [30.313, -97.732], [30.313, -97.708], [30.318, -97.704],
      [30.348, -97.704], [30.352, -97.710], [30.352, -97.728],
      [30.348, -97.733], [30.318, -97.734],
    ],
  },
  {
    name: 'Allandale',
    color: '#607D8B',
    opacity: 0.08,
    bounds: [
      [30.318, -97.752], [30.318, -97.733], [30.323, -97.730],
      [30.360, -97.730], [30.363, -97.735], [30.363, -97.748],
      [30.358, -97.753], [30.323, -97.754],
    ],
  },
  {
    name: 'Burnet Road',
    color: '#3F51B5',
    opacity: 0.08,
    bounds: [
      [30.328, -97.752], [30.328, -97.728], [30.333, -97.725],
      [30.363, -97.725], [30.367, -97.730], [30.367, -97.748],
      [30.363, -97.753], [30.333, -97.754],
    ],
  },
  {
    name: 'North Austin',
    color: '#8BC34A',
    opacity: 0.08,
    bounds: [
      [30.368, -97.815], [30.368, -97.675], [30.378, -97.668],
      [30.490, -97.668], [30.495, -97.678], [30.495, -97.812],
      [30.490, -97.818], [30.378, -97.818],
    ],
  },
  {
    name: 'West Austin',
    color: '#009688',
    opacity: 0.08,
    bounds: [
      [30.283, -97.915], [30.283, -97.768], [30.292, -97.762],
      [30.398, -97.762], [30.415, -97.770], [30.415, -97.912],
      [30.405, -97.918], [30.293, -97.918],
    ],
  },
  {
    name: 'Barton Hills',
    color: '#CDDC39',
    opacity: 0.08,
    bounds: [
      [30.243, -97.792], [30.243, -97.768], [30.248, -97.765],
      [30.263, -97.765], [30.267, -97.770], [30.267, -97.790],
      [30.263, -97.793], [30.248, -97.794],
    ],
  },
  {
    name: 'Mueller',
    color: '#F44336',
    opacity: 0.08,
    bounds: [
      [30.278, -97.722], [30.278, -97.698], [30.283, -97.694],
      [30.298, -97.694], [30.302, -97.698], [30.302, -97.718],
      [30.298, -97.723], [30.283, -97.724],
    ],
  },
  {
    name: 'South Austin',
    color: '#FF5722',
    opacity: 0.08,
    bounds: [
      [30.190, -97.802], [30.190, -97.698], [30.198, -97.692],
      [30.233, -97.692], [30.237, -97.700], [30.237, -97.798],
      [30.233, -97.804], [30.198, -97.806],
    ],
  },
  {
    name: 'Clarksville',
    color: '#673AB7',
    opacity: 0.08,
    bounds: [
      [30.270, -97.768], [30.270, -97.750], [30.274, -97.747],
      [30.283, -97.747], [30.287, -97.751], [30.287, -97.766],
      [30.283, -97.769], [30.274, -97.770],
    ],
  },
];

function getPlacesInNeighborhood(name) {
  return PLACES.filter(p => p.neighborhood === name && p.lat && p.lng);
}

function getMastery(name) {
  const places = getPlacesInNeighborhood(name);
  if (places.length === 0) return { visited: 0, total: 0, pct: 0, mastered: false };
  const visited = places.filter(p => isVisited(p.id)).length;
  return {
    visited,
    total: places.length,
    pct: places.length > 0 ? visited / places.length : 0,
    mastered: visited === places.length && places.length > 0,
  };
}

export function initNeighborhoods(map) {
  neighborhoodLayer = L.layerGroup();
  labelsLayer = L.layerGroup();

  NEIGHBORHOODS.forEach((hood) => {
    const places = getPlacesInNeighborhood(hood.name);
    const mastery = getMastery(hood.name);

    // Polygon with foggy soft fill (no stroke, very low opacity)
    const polygon = L.polygon(hood.bounds, {
      stroke: false,
      fillColor: mastery.mastered ? '#c4883c' : hood.color,
      fillOpacity: mastery.mastered ? 0.12 : 0.06,
      className: `neighborhood-polygon${mastery.mastered ? ' neighborhood-mastered' : ''}`,
    });

    polygon.bindTooltip(
      `<strong>${hood.name}</strong><br>${mastery.visited}/${mastery.total} treasures discovered${mastery.mastered ? '<br>🏆 Mastered!' : ''}`,
      { sticky: true, className: 'neighborhood-tooltip' }
    );

    polygon.on('mouseover', function () {
      if (!mastery.mastered) {
        this.setStyle({ fillOpacity: 0.12 });
      }
    });
    polygon.on('mouseout', function () {
      if (!mastery.mastered) {
        this.setStyle({ fillOpacity: 0.06 });
      }
    });

    neighborhoodLayer.addLayer(polygon);
    neighborhoodPolygons[hood.name] = polygon;

    // Center label
    const center = polygon.getBounds().getCenter();
    const badgeHtml = mastery.mastered
      ? `<span class="mastery-badge">🏆 MASTER</span>`
      : '';
    const label = L.marker(center, {
      icon: L.divIcon({
        className: 'neighborhood-label',
        html: `<span>${hood.name}</span>${badgeHtml}`,
        iconSize: [120, 30],
        iconAnchor: [60, 15],
      }),
      interactive: false,
    });
    labelsLayer.addLayer(label);
    neighborhoodLabels[hood.name] = label;
  });

  // Show/hide labels based on zoom AND whether neighborhoods are visible
  function updateLabels() {
    const zoom = map.getZoom();
    const hoodsVisible = map.hasLayer(neighborhoodLayer);
    if (hoodsVisible && zoom >= 13 && !map.hasLayer(labelsLayer)) {
      labelsLayer.addTo(map);
    } else if ((!hoodsVisible || zoom < 13) && map.hasLayer(labelsLayer)) {
      map.removeLayer(labelsLayer);
    }
  }

  map.on('zoomend', updateLabels);
  map.on('overlayadd', (e) => { if (e.layer === neighborhoodLayer) updateLabels(); });
  map.on('overlayremove', (e) => { if (e.layer === neighborhoodLayer) updateLabels(); });

  return { neighborhoodLayer, labelsLayer };
}

// Refresh mastery state for all neighborhoods (call after visited toggle)
export function refreshNeighborhoodMastery() {
  NEIGHBORHOODS.forEach((hood) => {
    const polygon = neighborhoodPolygons[hood.name];
    const label = neighborhoodLabels[hood.name];
    if (!polygon) return;

    const mastery = getMastery(hood.name);

    polygon.setStyle({
      stroke: false,
      fillColor: mastery.mastered ? '#c4883c' : hood.color,
      fillOpacity: mastery.mastered ? 0.12 : 0.06,
    });

    polygon.setTooltipContent(
      `<strong>${hood.name}</strong><br>${mastery.visited}/${mastery.total} treasures discovered${mastery.mastered ? '<br>🏆 Mastered!' : ''}`
    );

    if (label) {
      const badgeHtml = mastery.mastered
        ? `<span class="mastery-badge">🏆 MASTER</span>`
        : '';
      label.setIcon(L.divIcon({
        className: 'neighborhood-label',
        html: `<span>${hood.name}</span>${badgeHtml}`,
        iconSize: [120, 30],
        iconAnchor: [60, 15],
      }));
    }
  });
}

// Get mastery data for all neighborhoods (for mobile Quests tab)
export function getAllMasteryData() {
  return NEIGHBORHOODS.map(hood => ({
    name: hood.name,
    ...getMastery(hood.name),
  })).filter(m => m.total > 0);
}

export function getNeighborhoodLayer() {
  return neighborhoodLayer;
}

export function getNeighborhoodNames() {
  return NEIGHBORHOODS.map(n => n.name);
}
