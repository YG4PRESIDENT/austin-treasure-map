// ============================================================
// Austin Treasure Map — App Entry Point
// ============================================================

import { initMap, addMarkers } from './map.js';
import { initSidebar, openSidebar, updateProgressBar } from './sidebar.js';
import { initNeighborhoods, getNeighborhoodLayer } from './neighborhoods.js';
import { initFilters, renderListView } from './filters.js';
import { isShareMode, initShareMode, initShareButton } from './share.js';
import { exportData, importData } from './state.js';

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Share mode detection (before anything renders)
  if (isShareMode()) {
    initShareMode();
  }

  // 2. Initialize map
  const map = initMap();

  // 3. Neighborhoods
  const { neighborhoodLayer } = initNeighborhoods(map);
  // Add as toggleable overlay — default ON
  neighborhoodLayer.addTo(map);

  // 4. Sidebar (with callback to refresh list view on visited change)
  initSidebar({ onVisitedChange: () => renderListView() });

  // 5. Add markers (with sidebar callback)
  addMarkers((place) => openSidebar(place));

  // 6. Filters + Search + List View
  initFilters();

  // 7. Progress bar
  updateProgressBar();

  // 8. Share button
  initShareButton();

  // 9. Export / Import
  document.getElementById('export-btn')?.addEventListener('click', exportData);
  document.getElementById('import-btn')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        await importData(file);
        window.location.reload();
      } catch (err) {
        alert('Import failed: ' + err.message);
      }
    };
    input.click();
  });

  // 10. Hide loading screen
  setTimeout(() => {
    const loader = document.getElementById('loading');
    if (loader) {
      loader.classList.add('loaded');
      setTimeout(() => loader.remove(), 600);
    }
  }, 800);
});
