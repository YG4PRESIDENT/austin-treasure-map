// ============================================================
// Austin Treasure Map — App Entry Point
// ============================================================

import { initMap, addMarkers } from './map.js';
import { initSidebar, openSidebar, updateProgressBar } from './sidebar.js';
import { initNeighborhoods } from './neighborhoods.js';
import { initFilters, renderListView } from './filters.js';
import { isShareMode, initShareMode, initShareButton } from './share.js';
import { exportData, importData } from './state.js';

// --- Hide loading screen (always runs, even on error) ---
function hideLoader() {
  const loader = document.getElementById('loading');
  if (loader) {
    loader.classList.add('loaded');
    setTimeout(() => loader.remove(), 600);
  }
}

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
  try {
    // 1. Share mode detection (before anything renders)
    if (isShareMode()) {
      initShareMode();
    }

    // 2. Initialize map
    const map = initMap();

    // 3. Neighborhoods — add to map and register in layer control
    const { neighborhoodLayer } = initNeighborhoods(map);
    neighborhoodLayer.addTo(map);
    if (map._layerControl) {
      map._layerControl.addOverlay(neighborhoodLayer, '🏘️ Neighborhoods');
    }

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
    setTimeout(hideLoader, 800);

  } catch (err) {
    console.error('Austin Treasure Map failed to initialize:', err);
    // Always hide loader so user isn't stuck on brown screen
    hideLoader();
    // Show error to user
    const app = document.getElementById('app');
    if (app) {
      const errDiv = document.createElement('div');
      errDiv.style.cssText = 'padding:20px;color:#c4883c;font-family:sans-serif;text-align:center;';
      errDiv.innerHTML = `<h2>Map failed to load</h2><p>${err.message}</p><p>Try refreshing the page.</p>`;
      app.prepend(errDiv);
    }
  }
});
