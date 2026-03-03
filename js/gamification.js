// ============================================================
// Austin Treasure Map — Gamification Engine
// XP system, pirate ranks, treasure chest + XP bar widgets
// ============================================================

import { PLACES } from './data.js';
import { getVisited, getVisitedCount } from './state.js';

// XP per place type
const XP_NORMAL = 25;
const XP_DAYTRIP = 50;

// Total possible XP (derived from data)
const MAX_XP = PLACES.reduce((sum, p) => sum + (p.dayTrip ? XP_DAYTRIP : XP_NORMAL), 0);
const TOTAL_PLACES = PLACES.length;

// 8 Pirate-themed explorer ranks
const RANKS = [
  { rank: 1, title: 'Stowaway',         icon: '\u{1F400}', xpMin: 0    },
  { rank: 2, title: 'Deckhand',          icon: '\u{1F9F9}', xpMin: 75   },
  { rank: 3, title: 'Sailor',            icon: '\u26F5',    xpMin: 200  },
  { rank: 4, title: 'Navigator',         icon: '\u{1F9ED}', xpMin: 400  },
  { rank: 5, title: 'Quartermaster',     icon: '\u{1F4CB}', xpMin: 700  },
  { rank: 6, title: 'First Mate',        icon: '\u2693',    xpMin: 1100 },
  { rank: 7, title: 'Captain',           icon: '\u{1F3F4}\u200D\u2620\uFE0F', xpMin: 1600 },
  { rank: 8, title: 'Legend of the Seas', icon: '\u{1F451}', xpMin: 2275 },
];

// ─── Core Computation ────────────────────────────────

export function computeXP() {
  const visited = getVisited();
  const visitedIds = new Set(Object.keys(visited));
  let xp = 0;
  for (const place of PLACES) {
    if (visitedIds.has(place.id)) {
      xp += place.dayTrip ? XP_DAYTRIP : XP_NORMAL;
    }
  }
  return xp;
}

export function getRank(xp) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xpMin) current = r;
    else break;
  }
  const idx = RANKS.indexOf(current);
  const next = idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
  return {
    ...current,
    xpNext: next ? next.xpMin : null,
    nextTitle: next ? next.title : null,
    xpToNext: next ? next.xpMin - xp : 0,
  };
}

// ─── HTML Builder ────────────────────────────────────

function buildHTML(xp, rank, count) {
  const pct = MAX_XP > 0 ? (xp / MAX_XP) * 100 : 0;
  const isComplete = count >= TOTAL_PLACES;
  const xpFmt = xp.toLocaleString();
  const maxFmt = MAX_XP.toLocaleString();

  return `
    <div class="treasure-chest ${isComplete ? 'chest--open' : ''}">
      <div class="chest__glow"></div>
      <div class="chest__body">
        <div class="chest__lid"></div>
        <div class="chest__keyhole"></div>
      </div>
    </div>
    <div class="xp-bar">
      <div class="xp-bar__fill" style="width:${pct}%">
        <div class="xp-bar__shimmer"></div>
      </div>
      <span class="xp-bar__label">${xpFmt} / ${maxFmt} XP</span>
    </div>
    <div class="rank-display">
      <div class="rank-display__title">${rank.icon} ${rank.title}</div>
      ${rank.nextTitle
        ? `<div class="rank-display__next">Next: ${rank.nextTitle} &mdash; ${rank.xpToNext.toLocaleString()} XP to go</div>`
        : `<div class="rank-display__next">All ranks achieved!</div>`
      }
    </div>
    <div class="discovery-count">${count} / ${TOTAL_PLACES} treasures found</div>
  `;
}

// ─── Render & Refresh ────────────────────────────────

export function renderGamification(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const xp = computeXP();
  const rank = getRank(xp);
  const count = getVisitedCount();
  container.innerHTML = buildHTML(xp, rank, count);
}

export function refreshGamification() {
  const xp = computeXP();
  const rank = getRank(xp);
  const count = getVisitedCount();
  const pct = MAX_XP > 0 ? (xp / MAX_XP) * 100 : 0;
  const isComplete = count >= TOTAL_PLACES;

  // XP bar fill (animated via CSS transition)
  document.querySelectorAll('.xp-bar__fill').forEach(fill => {
    fill.style.width = `${pct}%`;
  });

  // XP label
  document.querySelectorAll('.xp-bar__label').forEach(label => {
    label.textContent = `${xp.toLocaleString()} / ${MAX_XP.toLocaleString()} XP`;
  });

  // Rank title
  document.querySelectorAll('.rank-display__title').forEach(el => {
    el.textContent = `${rank.icon} ${rank.title}`;
  });

  // Rank next
  document.querySelectorAll('.rank-display__next').forEach(el => {
    el.textContent = rank.nextTitle
      ? `Next: ${rank.nextTitle} \u2014 ${rank.xpToNext.toLocaleString()} XP to go`
      : 'All ranks achieved!';
  });

  // Discovery count
  document.querySelectorAll('.discovery-count').forEach(el => {
    el.textContent = `${count} / ${TOTAL_PLACES} treasures found`;
  });

  // Treasure chest open/close
  document.querySelectorAll('.treasure-chest').forEach(chest => {
    chest.classList.toggle('chest--open', isComplete);
  });
}
