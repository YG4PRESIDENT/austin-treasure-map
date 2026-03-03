// ============================================================
// Austin Treasure Map — Add Place & Pending Review
// ============================================================

import { CATEGORIES } from './data.js';

const STORAGE_KEY = 'atm_pendingPlaces';

// ─── LocalStorage Helpers ────────────────────────────

function getPending() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function savePending(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ─── Badge Update ────────────────────────────────────

function updateBadges() {
  const count = getPending().filter(p => p.status === 'pending').length;
  document.querySelectorAll('.pending-badge').forEach(badge => {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

// ─── Toast ───────────────────────────────────────────

function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── Modal Infrastructure ────────────────────────────

function createModal(content) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-card">${content}</div>`;

  // Close on overlay click (not card)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  return overlay;
}

// ─── Add Place Form ──────────────────────────────────

function openAddPlaceForm() {
  const categoryOptions = Object.entries(CATEGORIES)
    .map(([key, cat]) => `<option value="${key}">${cat.icon} ${cat.label}</option>`)
    .join('');

  const modal = createModal(`
    <div class="modal-card__header">
      <h3>➕ Suggest a Place</h3>
      <button class="modal-card__close">✕</button>
    </div>
    <form id="add-place-form" class="add-place-form">
      <label class="form-label">
        Name <span class="form-required">*</span>
        <input type="text" name="name" required placeholder="e.g. Cosmic Coffee" class="form-input">
      </label>
      <label class="form-label">
        Category
        <select name="category" class="form-input">
          ${categoryOptions}
        </select>
      </label>
      <label class="form-label">
        Why it's cool
        <textarea name="description" placeholder="What makes this place special?" class="form-input form-textarea"></textarea>
      </label>
      <label class="form-label">
        Address
        <input type="text" name="address" placeholder="123 Main St, Austin, TX" class="form-input">
      </label>
      <button type="submit" class="form-submit">Submit Suggestion</button>
    </form>
  `);

  // Close button
  modal.querySelector('.modal-card__close').addEventListener('click', () => modal.remove());

  // Form submission
  modal.querySelector('#add-place-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const item = {
      id: `pending_${Date.now()}`,
      name: form.name.value.trim(),
      category: form.category.value,
      description: form.description.value.trim(),
      address: form.address.value.trim(),
      status: 'pending',
      createdAt: Date.now(),
    };

    if (!item.name) return;

    const pending = getPending();
    pending.push(item);
    savePending(pending);
    updateBadges();
    modal.remove();
    showToast(`"${item.name}" added to pending review!`);
  });
}

// ─── Pending Review Panel ────────────────────────────

function openPendingReview() {
  const pending = getPending().filter(p => p.status === 'pending');

  if (pending.length === 0) {
    openAddPlaceForm();
    return;
  }

  const itemsHTML = pending.map(item => {
    const cat = CATEGORIES[item.category] || {};
    return `
      <div class="pending-item" data-id="${item.id}">
        <div class="pending-item__info">
          <span class="pending-item__icon">${cat.icon || '📍'}</span>
          <div class="pending-item__text">
            <strong>${escapeHTML(item.name)}</strong>
            ${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}
            ${item.address ? `<small>${escapeHTML(item.address)}</small>` : ''}
          </div>
        </div>
        <div class="pending-item__actions">
          <button class="pending-btn pending-btn--approve" data-action="approve" title="Approve">✓</button>
          <button class="pending-btn pending-btn--reject" data-action="reject" title="Reject">✕</button>
        </div>
      </div>
    `;
  }).join('');

  const modal = createModal(`
    <div class="modal-card__header">
      <h3>📋 Pending Places (${pending.length})</h3>
      <button class="modal-card__close">✕</button>
    </div>
    <div class="pending-list">${itemsHTML}</div>
    <button class="form-submit" id="add-new-place-btn" style="margin-top:12px;">➕ Add Another Place</button>
  `);

  // Close button
  modal.querySelector('.modal-card__close').addEventListener('click', () => modal.remove());

  // Add new place button
  modal.querySelector('#add-new-place-btn').addEventListener('click', () => {
    modal.remove();
    openAddPlaceForm();
  });

  // Approve / Reject actions
  modal.querySelectorAll('.pending-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemEl = btn.closest('.pending-item');
      const id = itemEl.dataset.id;
      const action = btn.dataset.action;
      const allPending = getPending();
      const idx = allPending.findIndex(p => p.id === id);

      if (idx !== -1) {
        if (action === 'approve') {
          allPending[idx].status = 'approved';
          showToast(`"${allPending[idx].name}" approved!`);
        } else {
          allPending.splice(idx, 1);
          showToast('Place removed.');
        }
        savePending(allPending);
        updateBadges();
      }

      // Animate removal
      itemEl.style.opacity = '0';
      itemEl.style.transform = 'translateX(20px)';
      setTimeout(() => {
        itemEl.remove();
        // If no more pending items, close modal
        if (modal.querySelectorAll('.pending-item').length === 0) {
          modal.remove();
        }
      }, 200);
    });
  });
}

// ─── Escape HTML ─────────────────────────────────────

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Init ────────────────────────────────────────────

export function initAddPlace() {
  // Wire up desktop + mobile buttons
  ['add-place-btn', 'mobile-add-place-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;

    // Click: open pending review (or form if no pending)
    btn.addEventListener('click', () => openPendingReview());

    // Right-click: always open form directly
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openAddPlaceForm();
    });
  });

  // Initial badge update
  updateBadges();
}
