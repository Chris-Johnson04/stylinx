// ========== SCROLL REVEAL ==========
const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${(i % 3) * 0.1}s`;
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

reveals.forEach(el => observer.observe(el));

// ========== SEARCH BAR (homepage — redirects to product pages) ==========
function buildSearchBar() {
  const header = document.querySelector('.header');
  const actions = header && header.querySelector('.header-actions');
  if (!header || document.querySelector('.search-toggle-btn')) return;

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'search-toggle-btn';
  toggleBtn.setAttribute('aria-label', 'Search');
  toggleBtn.innerHTML = '🔍';
  if (actions) actions.insertBefore(toggleBtn, actions.firstChild);

  const overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.innerHTML = `
    <div class="search-backdrop"></div>
    <div class="search-panel">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input class="search-input" type="text" placeholder="Search men, women, kids, shoes…" autocomplete="off" spellcheck="false">
        <button class="search-clear" aria-label="Clear">✕</button>
      </div>
      <div class="search-hint">Press Enter to search — or try: Men, Women, Kids, Shoes, Clothing, Accessories</div>
      <div class="search-suggestions">
        <a href="homme.html">Men →</a>
        <a href="femme.html">Women →</a>
        <a href="enfant.html">Kids →</a>
        <a href="chaussures.html">Shoes →</a>
        <a href="vetements.html">Clothing →</a>
        <a href="accessoires.html">Accessories →</a>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const input    = overlay.querySelector('.search-input');
  const clearBtn = overlay.querySelector('.search-clear');

  const pageMap = [
    { keys: ['men','homme','man','shirt','jeans','hoodie','pants','tshirt'], href: 'homme.html' },
    { keys: ['women','femme','dress','heels','sandals','pumps'], href: 'femme.html' },
    { keys: ['kids','enfant','children','child'], href: 'enfant.html' },
    { keys: ['shoes','chaussures','sneakers','boots','loafers','sandals','formal'], href: 'chaussures.html' },
    { keys: ['clothing','vetements','clothes','jacket','suit'], href: 'vetements.html' },
    { keys: ['accessories','accessoires','bag','watch','belt','cap','glasses'], href: 'accessoires.html' },
  ];

  function openSearch() {
    overlay.classList.add('open');
    toggleBtn.classList.add('active');
    setTimeout(() => input.focus(), 320);
    document.body.style.overflow = 'hidden';
  }
  function closeSearch() {
    overlay.classList.remove('open');
    toggleBtn.classList.remove('active');
    document.body.style.overflow = '';
    input.value = '';
    clearBtn.classList.remove('visible');
  }

  toggleBtn.addEventListener('click', () => {
    overlay.classList.contains('open') ? closeSearch() : openSearch();
  });
  overlay.querySelector('.search-backdrop').addEventListener('click', closeSearch);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearch(); });
  clearBtn.addEventListener('click', () => { input.value = ''; input.focus(); clearBtn.classList.remove('visible'); });
  input.addEventListener('input', () => clearBtn.classList.toggle('visible', input.value.length > 0));

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const match = pageMap.find(p => p.keys.some(k => q.includes(k)));
    window.location.href = match ? match.href : 'homme.html';
  });
}

buildSearchBar();

// ========== HAMBURGER MOBILE MENU ==========
function buildMobileNav() {
  const header = document.querySelector('.header');
  if (!header || document.querySelector('.hamburger')) return;

  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.innerHTML = '<span></span><span></span><span></span>';

  const actions = header.querySelector('.header-actions');
  header.insertBefore(hamburger, actions || null);

  const mobileNav = document.createElement('div');
  mobileNav.className = 'mobile-nav';
  mobileNav.innerHTML = `
    <div class="mobile-nav-backdrop"></div>
    <div class="mobile-nav-panel">
      <div class="mobile-nav-header">
        <a href="index.html" class="mobile-nav-logo">STYLI<span>N</span>X</a>
        <button class="mobile-nav-close" aria-label="Close menu">✕</button>
      </div>
      <div class="mobile-nav-links">
        <a href="index.html" class="active">Home</a>
        <a href="homme.html">Men</a>
        <a href="femme.html">Women</a>
        <a href="enfant.html">Kids</a>
        <a href="vetements.html">Clothing</a>
        <a href="chaussures.html">Shoes</a>
        <a href="accessoires.html">Accessories</a>
      </div>
      <div class="mobile-nav-actions">
        <a href="wishlist.html">♡ &nbsp; My Wishlist</a>
        <a href="panier.html">🛒 &nbsp; Cart</a>
        <a href="login.html">👤 &nbsp; My Account</a>
      </div>
    </div>`;
  document.body.appendChild(mobileNav);

  function openNav() {
    mobileNav.classList.add('open');
    hamburger.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeNav() {
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    mobileNav.classList.contains('open') ? closeNav() : openNav();
  });
  mobileNav.querySelector('.mobile-nav-close').addEventListener('click', closeNav);
  mobileNav.querySelector('.mobile-nav-backdrop').addEventListener('click', closeNav);
  window.addEventListener('resize', () => { if (window.innerWidth > 768) closeNav(); });
}

buildMobileNav();
