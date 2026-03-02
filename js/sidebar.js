// ============================================================
// Austin Treasure Map — Detail Panel + Progress Ring
// ============================================================

import { PLACES, CATEGORIES } from './data.js';
import { isVisited, toggleVisited, getNote, setNote, getVisitedCount,
         getLastMilestoneSeen, setLastMilestoneSeen } from './state.js';
import { refreshMarkerIcon } from './map.js';

let currentPlace = null;
let noteDebounce = null;
let onVisitedChange = null;

function el(id) { return document.getElementById(id); }

export function initSidebar(opts = {}) {
  if (opts.onVisitedChange) onVisitedChange = opts.onVisitedChange;

  // Close button
  el('detail-close')?.addEventListener('click', closeSidebar);

  // Click outside on map to close
  document.getElementById('map')?.addEventListener('click', (e) => {
    if (!currentPlace) return;
    if (e.target.closest('.leaflet-marker-icon')) return;
    if (e.target.closest('.leaflet-popup')) return;
    if (e.target.closest('.leaflet-control')) return;
    closeSidebar();
  });

  // Visited toggle
  el('detail-visited-btn')?.addEventListener('click', () => {
    if (!currentPlace) return;
    const nowVisited = toggleVisited(currentPlace.id);
    refreshMarkerIcon(currentPlace.id);
    updateVisitedUI(nowVisited);
    updateProgressRing();
    if (nowVisited) {
      playDiscoveredAnimation();
      checkMilestone();
    }
    if (onVisitedChange) onVisitedChange();
  });

  // Notes auto-save
  el('detail-notes')?.addEventListener('input', (e) => {
    if (!currentPlace) return;
    clearTimeout(noteDebounce);
    noteDebounce = setTimeout(() => {
      setNote(currentPlace.id, e.target.value);
      showSaveIndicator();
    }, 400);
  });
}

export function openSidebar(place) {
  currentPlace = place;
  const cat = CATEGORIES[place.category] || {};

  el('detail-name').textContent = place.name;
  el('detail-category').textContent = `${cat.icon || ''} ${cat.label || place.category}`;
  el('detail-category').style.background = cat.color || '#888';
  el('detail-neighborhood').textContent = place.neighborhood;
  el('detail-description').textContent = place.description || '';
  el('detail-source').textContent = place.source ? `Source: ${place.source}` : '';
  el('detail-notes').value = getNote(place.id);

  // Day trip badge
  const dtEl = el('detail-daytrip');
  if (place.dayTrip) {
    dtEl.classList.add('visible');
    dtEl.textContent = '🚗 Day Trip';
  } else {
    dtEl.classList.remove('visible');
  }

  // Address link
  const addrEl = el('detail-address');
  if (place.address) {
    addrEl.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address)}`;
    addrEl.textContent = place.address;
    addrEl.style.display = 'block';
  } else {
    addrEl.style.display = 'none';
  }

  // Visited state
  updateVisitedUI(isVisited(place.id));

  // Show panel
  const panel = el('detail-panel');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
}

export function closeSidebar() {
  const panel = el('detail-panel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  currentPlace = null;
}

function updateVisitedUI(visited) {
  const btn = el('detail-visited-btn');
  if (!btn) return;
  btn.classList.toggle('visited', visited);
  btn.innerHTML = visited ? '✓ Discovered!' : '☐ Mark as Discovered';
}

function playDiscoveredAnimation() {
  const btn = el('detail-visited-btn');
  if (!btn) return;
  btn.classList.add('celebrate');
  setTimeout(() => btn.classList.remove('celebrate'), 800);
}

function showSaveIndicator() {
  const label = el('detail-notes-section')?.querySelector('.notes-label');
  if (!label) return;
  label.textContent = 'Personal Notes — saved ✓';
  setTimeout(() => { label.textContent = 'Personal Notes'; }, 1500);
}

// ─── Progress Ring ─────────────────────────────
const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52 → ~326.73

export function updateProgressRing() {
  const total = PLACES.filter(p => p.lat && p.lng).length;
  const count = getVisitedCount();
  const pct = total > 0 ? count / total : 0;

  // Desktop ring
  const fillEl = el('progress-ring-fill');
  if (fillEl) {
    const offset = CIRCUMFERENCE * (1 - pct);
    fillEl.style.strokeDashoffset = offset;
  }

  // Count label
  const countEl = el('progress-count');
  if (countEl) countEl.textContent = count;

  const totalEl = document.querySelector('.progress-ring__total');
  if (totalEl) totalEl.textContent = `/ ${total}`;

  // Mobile progress (clone ring into mobile panel if needed)
  const mobileSection = el('mobile-progress-section');
  if (mobileSection) {
    mobileSection.innerHTML = `
      <svg class="progress-ring" viewBox="0 0 120 120" style="width:130px;height:130px;transform:rotate(-90deg);">
        <circle class="progress-ring__track" cx="60" cy="60" r="52" />
        <circle class="progress-ring__fill" cx="60" cy="60" r="52"
          style="stroke-dasharray:${CIRCUMFERENCE};stroke-dashoffset:${CIRCUMFERENCE * (1 - pct)}" />
      </svg>
      <div style="text-align:center;margin-top:12px;">
        <span style="font-family:var(--font-display);font-size:2rem;color:var(--gold-dark);">${count}</span>
        <span style="font-family:var(--font-ui);font-size:0.8rem;color:var(--brown-light);"> / ${total}</span>
        <div style="font-family:var(--font-ui);font-size:0.7rem;color:var(--brown-light);text-transform:uppercase;letter-spacing:1px;margin-top:4px;">discovered</div>
      </div>
    `;
  }
}

// Milestone celebrations
const MILESTONES = [25, 50, 75, 100];

function checkMilestone() {
  const total = PLACES.filter(p => p.lat && p.lng).length;
  const count = getVisitedCount();
  const pct = Math.floor((count / total) * 100);
  const lastSeen = getLastMilestoneSeen();

  for (const m of MILESTONES) {
    if (pct >= m && lastSeen < m) {
      setLastMilestoneSeen(m);
      showMilestoneToast(m);

      // Pulse the ring
      const ringSection = el('progress-section');
      if (ringSection) {
        ringSection.querySelector('.progress-ring')?.classList.add('progress-ring--milestone');
        setTimeout(() => {
          ringSection.querySelector('.progress-ring')?.classList.remove('progress-ring--milestone');
        }, 1000);
      }
      break;
    }
  }
}

function showMilestoneToast(pct) {
  const messages = {
    25: '🗺 Quarter of Austin explored!',
    50: '⚔ Halfway there, adventurer!',
    75: '🏅 75% — True explorer status!',
    100: '🏆 ALL TREASURES FOUND! Legend!',
  };

  let toast = document.getElementById('milestone-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'milestone-toast';
    toast.className = 'toast milestone-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = messages[pct] || `${pct}% milestone reached!`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

export function getCurrentPlace() {
  return currentPlace;
}
