// ============================================================
// Austin Treasure Map — App Entry Point
// ============================================================

import { initMap, addMarkers, flyToPlace, switchBaseLayer, getCurrentBaseLayerName } from './map.js';
import { initSidebar, openSidebar } from './sidebar.js';
import { renderGamification, refreshGamification } from './gamification.js';
import { initNeighborhoods, refreshNeighborhoodMastery, getAllMasteryData } from './neighborhoods.js';
import { initFilters } from './filters.js';
import { isShareMode, initShareMode, initShareButton } from './share.js';
import { initAddPlace } from './places.js';
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

// --- Style Picker wiring ---
function setupStylePickers() {
  const current = getCurrentBaseLayerName();
  document.querySelectorAll('.style-picker__btn').forEach(btn => {
    // Mark the initial active button
    btn.classList.toggle('style-picker__btn--active', btn.dataset.layer === current);
    // Bind click → switch base layer
    btn.addEventListener('click', () => switchBaseLayer(btn.dataset.layer));
  });
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

    // 2b. Wire up style pickers (after map so getCurrentBaseLayerName works)
    setupStylePickers();

    // 3. Neighborhoods — add directly to map
    const { neighborhoodLayer } = initNeighborhoods(map);
    neighborhoodLayer.addTo(map);

    // 4. Sidebar (with callback for visited changes)
    initSidebar({
      onVisitedChange: () => {
        refreshGamification();
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

    // 7. Gamification (XP bar, rank, treasure chest)
    renderGamification('gamification');
    renderGamification('mobile-gamification');

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

    // 12. Add Place system
    initAddPlace();

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
