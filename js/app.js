// ============================================================
// Austin Treasure Map — App Entry Point
// ============================================================

import { initMap, addMarkers, flyToPlace } from './map.js';
import { initSidebar, openSidebar, updateProgressRing } from './sidebar.js';
import { initNeighborhoods, refreshNeighborhoodMastery, getAllMasteryData } from './neighborhoods.js';
import { initFilters } from './filters.js';
import { isShareMode, initShareMode, initShareButton } from './share.js';
import { exportData, importData } from './state.js';
import { renderQuestCard, refreshQuest } from './quests.js';
import { initMobileTabs } from './mobile.js';

// --- Hide loading screen (always runs, even on error) ---
function hideLoader() {
  const loader = document.getElementById('loading');
  if (loader) {
    loader.classList.add('loaded');
    setTimeout(() => loader.remove(), 600);
  }
}

// --- Export/Import handler setup ---
function setupExportImport(exportBtnId, importBtnId) {
  document.getElementById(exportBtnId)?.addEventListener('click', exportData);
  document.getElementById(importBtnId)?.addEventListener('click', () => {
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
}

// --- Render mastery list for mobile Quests tab ---
function renderMasteryList() {
  const container = document.getElementById('mobile-mastery-list');
  if (!container) return;

  const data = getAllMasteryData();
  data.sort((a, b) => b.pct - a.pct || a.name.localeCompare(b.name));

  container.innerHTML = `
    <h3 style="font-family:var(--font-display);font-size:1rem;color:var(--gold-dark);margin-bottom:10px;">
      Neighborhood Mastery
    </h3>
    ${data.map(m => `
      <div class="mastery-item ${m.mastered ? 'mastery-item--complete' : ''}">
        <span class="mastery-item__name">${m.mastered ? '🏆 ' : ''}${m.name}</span>
        <span class="mastery-item__progress">${m.visited}/${m.total}</span>
      </div>
    `).join('')}
  `;
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

    // 4. Sidebar (with callback for visited changes)
    initSidebar({
      onVisitedChange: () => {
        updateProgressRing();
        refreshNeighborhoodMastery();
        renderMasteryList();
        // Refresh quest card (in case visited place was the quest target)
        const questContainer = document.getElementById('quest-container');
        if (questContainer) refreshQuest(questContainer, { onFlyTo: handleQuestReveal });
        const mobileQuest = document.getElementById('mobile-quest-container');
        if (mobileQuest) refreshQuest(mobileQuest, { onFlyTo: handleQuestReveal });
      },
    });

    // 5. Add markers (with sidebar callback)
    addMarkers((place) => openSidebar(place));

    // 6. Filters (5 groups + search)
    initFilters();

    // 7. Progress ring
    updateProgressRing();

    // 8. Quest system
    const questContainer = document.getElementById('quest-container');
    if (questContainer) {
      renderQuestCard(questContainer, { onFlyTo: handleQuestReveal });
    }
    const mobileQuest = document.getElementById('mobile-quest-container');
    if (mobileQuest) {
      renderQuestCard(mobileQuest, { onFlyTo: handleQuestReveal });
    }

    // 9. Mobile tabs
    initMobileTabs();

    // 10. Mastery list for mobile
    renderMasteryList();

    // 11. Share button
    initShareButton();

    // 12. Export / Import (desktop + mobile)
    setupExportImport('export-btn', 'import-btn');
    setupExportImport('mobile-export-btn', 'mobile-import-btn');

    // 13. Hide loading screen
    setTimeout(hideLoader, 800);

  } catch (err) {
    console.error('Austin Treasure Map failed to initialize:', err);
    hideLoader();
    const app = document.getElementById('app');
    if (app) {
      const errDiv = document.createElement('div');
      errDiv.style.cssText = 'padding:20px;color:#c4883c;font-family:sans-serif;text-align:center;';
      errDiv.innerHTML = `<h2>Map failed to load</h2><p>${err.message}</p><p>Try refreshing the page.</p>`;
      app.prepend(errDiv);
    }
  }
});

function handleQuestReveal(place) {
  if (!place) return;
  flyToPlace(place);
  openSidebar(place);
  // Switch to map tab on mobile
  import('./mobile.js').then(m => m.switchTab('map')).catch(() => {});
}
