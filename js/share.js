// ============================================================
// Austin Treasure Map — Share Mode
// ============================================================

export function isShareMode() {
  return new URLSearchParams(window.location.search).has('share');
}

export function initShareMode() {
  if (!isShareMode()) return;

  document.body.classList.add('share-mode');

  // Update title
  const title = document.querySelector('.nav-sidebar__title');
  if (title) title.innerHTML = '☠ AUSTIN<br>TREASURE MAP<br><small style="font-size:0.6em;opacity:0.7;">A Curated Guide</small>';

  // Hide personal elements
  const hideIds = [
    'gamification',
    'quest-container',
    'detail-visited-btn',
    'detail-notes-section',
    'export-btn',
    'import-btn',
    'mobile-export-btn',
    'mobile-import-btn',
  ];
  hideIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  // Add "Get Your Own Copy" banner
  const banner = document.createElement('div');
  banner.className = 'share-banner';
  banner.innerHTML = `
    <span>Exploring someone's Austin treasures!</span>
    <a href="${window.location.origin}${window.location.pathname}" class="share-banner-link">
      Start Your Own Map →
    </a>
  `;
  document.body.prepend(banner);
}

export function initShareButton() {
  // Desktop share button
  setupShareBtn('share-btn');
  // Mobile share button
  setupShareBtn('mobile-share-btn');
}

function setupShareBtn(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=true`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Yahir's Austin Treasure Map",
          text: 'Check out my curated Austin guide — 85+ hidden gems!',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or API failed — fall through
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Share link copied to clipboard!');
    } catch {
      prompt('Copy this share link:', shareUrl);
    }
  });
}

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
