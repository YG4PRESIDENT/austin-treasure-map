// ============================================================
// Austin Treasure Map — Neighborhood Overlays
// ============================================================

import { PLACES } from './data.js';

let neighborhoodLayer = null;
let labelsLayer = null;

// Simplified Austin neighborhood boundaries (polygon approximations)
// Using key neighborhoods that contain treasure map places
const NEIGHBORHOODS = [
  {
    name: 'Downtown',
    bounds: [[30.260, -97.752], [30.260, -97.735], [30.272, -97.735], [30.272, -97.752]],
  },
  {
    name: 'East Austin',
    bounds: [[30.255, -97.735], [30.255, -97.690], [30.280, -97.690], [30.280, -97.735]],
  },
  {
    name: 'South Congress',
    bounds: [[30.235, -97.760], [30.235, -97.745], [30.255, -97.745], [30.255, -97.760]],
  },
  {
    name: 'Hyde Park',
    bounds: [[30.295, -97.740], [30.295, -97.720], [30.315, -97.720], [30.315, -97.740]],
  },
  {
    name: 'Zilker',
    bounds: [[30.255, -97.780], [30.255, -97.755], [30.272, -97.755], [30.272, -97.780]],
  },
  {
    name: 'South Lamar',
    bounds: [[30.235, -97.790], [30.235, -97.760], [30.255, -97.760], [30.255, -97.790]],
  },
  {
    name: 'South First',
    bounds: [[30.235, -97.760], [30.235, -97.750], [30.255, -97.750], [30.255, -97.760]],
  },
  {
    name: 'Bouldin Creek',
    bounds: [[30.245, -97.765], [30.245, -97.750], [30.260, -97.750], [30.260, -97.765]],
  },
  {
    name: 'North Loop',
    bounds: [[30.315, -97.730], [30.315, -97.710], [30.330, -97.710], [30.330, -97.730]],
  },
  {
    name: 'Allandale',
    bounds: [[30.320, -97.750], [30.320, -97.735], [30.345, -97.735], [30.345, -97.750]],
  },
  {
    name: 'Burnet Road',
    bounds: [[30.330, -97.750], [30.330, -97.730], [30.365, -97.730], [30.365, -97.750]],
  },
  {
    name: 'North Austin',
    bounds: [[30.370, -97.720], [30.370, -97.680], [30.420, -97.680], [30.420, -97.720]],
  },
  {
    name: 'West Austin',
    bounds: [[30.290, -97.810], [30.290, -97.770], [30.330, -97.770], [30.330, -97.810]],
  },
  {
    name: 'Barton Hills',
    bounds: [[30.245, -97.790], [30.245, -97.770], [30.265, -97.770], [30.265, -97.790]],
  },
  {
    name: 'Mueller',
    bounds: [[30.290, -97.720], [30.290, -97.700], [30.310, -97.700], [30.310, -97.720]],
  },
  {
    name: 'South Austin',
    bounds: [[30.200, -97.800], [30.200, -97.730], [30.235, -97.730], [30.235, -97.800]],
  },
  {
    name: 'Clarksville',
    bounds: [[30.272, -97.765], [30.272, -97.752], [30.285, -97.752], [30.285, -97.765]],
  },
];

export function initNeighborhoods(map) {
  neighborhoodLayer = L.layerGroup();
  labelsLayer = L.layerGroup();

  NEIGHBORHOODS.forEach((hood) => {
    // Count treasures in this neighborhood
    const count = PLACES.filter(p => p.neighborhood === hood.name).length;

    // Polygon
    const polygon = L.polygon(hood.bounds, {
      color: '#8b6914',
      weight: 2,
      dashArray: '8 4',
      fillColor: '#c4883c',
      fillOpacity: 0.06,
      className: 'neighborhood-polygon',
    });

    polygon.bindTooltip(
      `<strong>${hood.name}</strong><br>${count} treasure${count !== 1 ? 's' : ''}`,
      { sticky: true, className: 'neighborhood-tooltip' }
    );

    polygon.on('mouseover', function () {
      this.setStyle({ fillOpacity: 0.15, weight: 3 });
    });
    polygon.on('mouseout', function () {
      this.setStyle({ fillOpacity: 0.06, weight: 2 });
    });

    neighborhoodLayer.addLayer(polygon);

    // Center label
    const center = polygon.getBounds().getCenter();
    const label = L.marker(center, {
      icon: L.divIcon({
        className: 'neighborhood-label',
        html: `<span>${hood.name}</span>`,
        iconSize: [120, 20],
        iconAnchor: [60, 10],
      }),
      interactive: false,
    });
    labelsLayer.addLayer(label);
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

export function getNeighborhoodLayer() {
  return neighborhoodLayer;
}

export function getNeighborhoodNames() {
  return NEIGHBORHOODS.map(n => n.name);
}
