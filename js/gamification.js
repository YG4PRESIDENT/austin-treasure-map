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

// ─── ASCII Chest Art ─────────────────────────────────

function getChestArt(rankNum) {
  if (rankNum <= 3) {
    // Closed / locked chest
    return [
      '    ╔══════════╗    ',
      '    ║ ┌──────┐ ║    ',
      '    ╠══════════╣    ',
      '    ║   ◈  ▼   ║    ',
      '    ║          ║    ',
      '    ╚══════════╝    ',
    ].join('\n');
  }
  if (rankNum <= 5) {
    // Half-open, sparkles visible
    return [
      '      ╔════════╗      ',
      '     ╔╝ ✦  · ✧ ╚╗    ',
      '    ╔╝  ✧ ·  ✦   ╚╗  ',
      '    ╠══════════════╣  ',
      '    ║  ✦  ·  ✧  ✦ ║  ',
      '    ╚══════════════╝  ',
    ].join('\n');
  }
  // Ranks 6–8: fully open, gold overflowing
  return [
    '     ╔══════════╗      ',
    '    ╔╝ ✦ ◉ ✧ ● ╚╗    ',
    '   ╔╝ ◉ ✦ ● ✧ ◉  ╚╗  ',
    '   ╠════════════════╣  ',
    '   ║ ◉ ✦ ● ✧ ◉ ✦ ● ║  ',
    '   ║  ● ◉ ✦ ● ◉ ✧  ║  ',
    '   ╚════════════════╝  ',
  ].join('\n');
}

function getChestHTML(rankNum) {
  return `<pre class="ascii-chest">${getChestArt(rankNum)}</pre>`;
}

// ─── HTML Builder ────────────────────────────────────

function buildHTML(xp, rank, count) {
  // Level-based XP: progress within current rank
  const levelXp = xp - rank.xpMin;
  const levelMax = rank.xpNext ? rank.xpNext - rank.xpMin : 0;
  const isMaxRank = !rank.xpNext;
  const pct = isMaxRank ? 100 : (levelMax > 0 ? (levelXp / levelMax) * 100 : 0);

  const nextRank = isMaxRank ? null : RANKS.find(r => r.xpMin === rank.xpNext);

  return `
    ${getChestHTML(rank.rank)}
    <div class="xp-bar">
      <div class="xp-bar__fill" style="width:${pct}%">
        <div class="xp-bar__shimmer"></div>
      </div>
      <span class="xp-bar__label">${isMaxRank ? 'MAX RANK' : `${levelXp.toLocaleString()} / ${levelMax.toLocaleString()} XP`}</span>
    </div>
    <div class="rank-display">
      <div class="rank-display__title">Level ${rank.rank} ${rank.icon} ${rank.title}</div>
      ${nextRank
        ? `<div class="rank-display__next">Next: Level ${nextRank.rank} ${nextRank.title} &mdash; ${rank.xpToNext.toLocaleString()} XP to go</div>`
        : `<div class="rank-display__next">All ranks achieved!</div>`
      }
    </div>
    <div class="xp-explanation">Visit places to earn XP · 25 per spot · 50 for day trips</div>
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

  // Level-based XP calculations
  const levelXp = xp - rank.xpMin;
  const levelMax = rank.xpNext ? rank.xpNext - rank.xpMin : 0;
  const isMaxRank = !rank.xpNext;
  const pct = isMaxRank ? 100 : (levelMax > 0 ? (levelXp / levelMax) * 100 : 0);

  const nextRank = isMaxRank ? null : RANKS.find(r => r.xpMin === rank.xpNext);

  // XP bar fill (animated via CSS transition)
  document.querySelectorAll('.xp-bar__fill').forEach(fill => {
    fill.style.width = `${pct}%`;
  });

  // XP label
  document.querySelectorAll('.xp-bar__label').forEach(label => {
    label.textContent = isMaxRank
      ? 'MAX RANK'
      : `${levelXp.toLocaleString()} / ${levelMax.toLocaleString()} XP`;
  });

  // Rank title
  document.querySelectorAll('.rank-display__title').forEach(el => {
    el.textContent = `Level ${rank.rank} ${rank.icon} ${rank.title}`;
  });

  // Rank next
  document.querySelectorAll('.rank-display__next').forEach(el => {
    el.textContent = nextRank
      ? `Next: Level ${nextRank.rank} ${nextRank.title} \u2014 ${rank.xpToNext.toLocaleString()} XP to go`
      : 'All ranks achieved!';
  });

  // Discovery count
  document.querySelectorAll('.discovery-count').forEach(el => {
    el.textContent = `${count} / ${TOTAL_PLACES} treasures found`;
  });

  // ASCII chest update
  document.querySelectorAll('.ascii-chest').forEach(chest => {
    chest.textContent = getChestArt(rank.rank);
  });
}
