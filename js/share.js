// ============================================================
// Austin Treasure Map — Share Mode
// ============================================================

export function isShareMode() {
  return new URLSearchParams(window.location.search).has('share');
}

export function initShareMode() {
  if (!isShareMode()) return;

  document.body.classList.add('share-mode');

  // Update header
  const title = document.getElementById('app-title');
  if (title) title.textContent = 'AUSTIN TREASURE MAP — A Curated Guide';

  // Hide personal elements
  const hideIds = [
    'progress-bar',
    'sidebar-visited-btn',
    'sidebar-notes-section',
    'export-btn',
    'import-btn',
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
  const btn = document.getElementById('share-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=true`;

    // Try native Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Yahir's Austin Treasure Map",
          text: 'Check out my curated Austin guide — 85+ hidden gems!',
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or API failed — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Share link copied to clipboard!');
    } catch {
      // Final fallback
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
