// ============================================================
// Austin Treasure Map — Mobile Bottom Tabs
// ============================================================

import { getMap } from './map.js';

const TABS = [
  { id: 'map',     icon: '🗺',  label: 'Map' },
  { id: 'search',  icon: '🔍', label: 'Search' },
  { id: 'quests',  icon: '⚔',  label: 'Quests' },
  { id: 'profile', icon: '👤', label: 'Profile' },
];

let activeTab = 'map';

export function initMobileTabs() {
  const tabBar = document.getElementById('mobile-tabs');
  const panels = document.getElementById('mobile-panels');
  if (!tabBar || !panels) return;

  // Build tab buttons
  tabBar.innerHTML = TABS.map(t => `
    <button class="mobile-tab ${t.id === 'map' ? 'mobile-tab--active' : ''}" data-tab="${t.id}">
      <span class="mobile-tab__icon">${t.icon}</span>
      <span class="mobile-tab__label">${t.label}</span>
    </button>
  `).join('');

  tabBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.mobile-tab');
    if (!btn) return;
    switchTab(btn.dataset.tab);
  });
}

export function switchTab(tabId) {
  activeTab = tabId;

  // Update tab button styling
  document.querySelectorAll('.mobile-tab').forEach(btn => {
    btn.classList.toggle('mobile-tab--active', btn.dataset.tab === tabId);
  });

  // Show/hide panels
  const panels = document.getElementById('mobile-panels');
  const mapArea = document.getElementById('map-area');
  if (!panels || !mapArea) return;

  if (tabId === 'map') {
    panels.classList.remove('mobile-panels--visible');
    mapArea.style.display = '';
    // Leaflet needs to re-measure after display:none → visible
    const m = getMap();
    if (m) setTimeout(() => m.invalidateSize(), 50);
  } else {
    panels.classList.add('mobile-panels--visible');
    mapArea.style.display = 'none';

    // Show the right panel
    document.querySelectorAll('.mobile-panel').forEach(p => {
      p.classList.toggle('mobile-panel--active', p.dataset.panel === tabId);
    });
  }
}

export function getActiveTab() {
  return activeTab;
}
