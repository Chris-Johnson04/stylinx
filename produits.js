// ============================================================
// SEARCH BAR — inline, filters cards directly on the page
// ============================================================
function buildSearchBar() {
  const pageContent = document.querySelector('.page-content');
  if (!pageContent || document.querySelector('.search-bar-wrap')) return;

  // Build search bar HTML
  const wrap = document.createElement('div');
  wrap.className = 'search-bar-wrap';
  wrap.innerHTML = `
    <span class="search-bar-icon">🔍</span>
    <input class="search-bar-input" type="text" placeholder="Search products…" autocomplete="off" spellcheck="false">
    <span class="search-bar-count" id="search-bar-count"></span>
    <button class="search-bar-clear" aria-label="Clear">✕</button>`;

  // Insert before .filters
  const filters = pageContent.querySelector('.filters');
  pageContent.insertBefore(wrap, filters || pageContent.firstChild);

  // Add "no results" node inside grid
  const grid = pageContent.querySelector('.grid');
  if (grid) {
    const noRes = document.createElement('div');
    noRes.className = 'search-no-results';
    noRes.id = 'search-no-results';
    grid.appendChild(noRes);
  }

  const input    = wrap.querySelector('.search-bar-input');
  const clearBtn = wrap.querySelector('.search-bar-clear');
  const countEl  = wrap.querySelector('#search-bar-count');

  function runSearch() {
    const q = input.value.trim().toLowerCase();
    clearBtn.classList.toggle('visible', q.length > 0);

    const cards = [...document.querySelectorAll('.product-card')];
    const noRes = document.getElementById('search-no-results');

    if (!q) {
      // Restore — re-apply active filter/sort
      cards.forEach(c => c.classList.remove('search-hidden'));
      if (countEl) { countEl.textContent = ''; countEl.classList.remove('visible'); }
      if (noRes) noRes.style.display = 'none';
      applySortAndFilter();
      return;
    }

    const words = q.split(/\s+/);
    let count = 0;
    cards.forEach(card => {
      const name  = (card.querySelector('h3') || {}).textContent || '';
      const price = (card.querySelector('.product-info > p') || {}).textContent || '';
      const text  = (name + ' ' + price).toLowerCase();
      const match = words.every(w => text.includes(w));
      // Only hide/show cards that aren't already hidden by the category filter
      if (match) {
        card.classList.remove('search-hidden');
        count++;
      } else {
        card.classList.add('search-hidden');
      }
    });

    // Count display
    if (countEl) {
      countEl.innerHTML = `<strong>${count}</strong> result${count !== 1 ? 's' : ''}`;
      countEl.classList.add('visible');
    }

    // No results message
    if (noRes) {
      if (count === 0) {
        noRes.innerHTML = `<strong>No results for "${input.value.trim()}"</strong>Try a different keyword`;
        noRes.style.display = 'block';
      } else {
        noRes.style.display = 'none';
      }
    }
  }

  input.addEventListener('input', runSearch);
  clearBtn.addEventListener('click', () => { input.value = ''; runSearch(); input.focus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && input.value) { input.value = ''; runSearch(); } });
}

// ============================================================
// HAMBURGER MOBILE MENU
// ============================================================
function buildMobileNav() {
  const header = document.querySelector('.header');
  if (!header || document.querySelector('.hamburger')) return;

  // Collect nav links from existing header nav
  const nav = header.querySelector('nav');
  const links = nav ? [...nav.querySelectorAll('a')] : [];

  // Create hamburger button
  const hamburger = document.createElement('button');
  hamburger.className = 'hamburger';
  hamburger.setAttribute('aria-label', 'Open menu');
  hamburger.innerHTML = '<span></span><span></span><span></span>';

  // Insert hamburger before header-actions (or at end)
  const actions = header.querySelector('.header-actions');
  header.insertBefore(hamburger, actions || null);

  // Create mobile nav overlay
  const mobileNav = document.createElement('div');
  mobileNav.className = 'mobile-nav';
  mobileNav.innerHTML = `
    <div class="mobile-nav-backdrop"></div>
    <div class="mobile-nav-panel">
      <div class="mobile-nav-header">
        <a href="index.html" class="mobile-nav-logo">STYLI<span>N</span>X</a>
        <button class="mobile-nav-close" aria-label="Close menu">✕</button>
      </div>
      <div class="mobile-nav-links" id="mobile-nav-links"></div>
      <div class="mobile-nav-actions">
        <a href="wishlist.html">♡ &nbsp; My Wishlist</a>
        <a href="panier.html">🛒 &nbsp; Cart</a>
        <a href="login.html">👤 &nbsp; My Account</a>
      </div>
    </div>`;
  document.body.appendChild(mobileNav);

  // Populate links
  const navLinksContainer = mobileNav.querySelector('#mobile-nav-links');
  const navItems = [
    { href: 'index.html',    label: 'Home' },
    { href: 'homme.html',    label: 'Men' },
    { href: 'femme.html',    label: 'Women' },
    { href: 'enfant.html',   label: 'Kids' },
    { href: 'chaussures.html',  label: 'Shoes' },
    { href: 'vetements.html',   label: 'Clothing' },
    { href: 'accessoires.html', label: 'Accessories' },
  ];
  navItems.forEach(item => {
    const a = document.createElement('a');
    a.href = item.href;
    a.textContent = item.label;
    if (window.location.href.includes(item.href) && item.href !== 'index.html') {
      a.classList.add('active');
    }
    navLinksContainer.appendChild(a);
  });

  // Toggle open/close
  function openNav() {
    mobileNav.classList.add('open');
    hamburger.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-label', 'Close menu');
  }
  function closeNav() {
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-label', 'Open menu');
  }

  hamburger.addEventListener('click', () => {
    mobileNav.classList.contains('open') ? closeNav() : openNav();
  });
  mobileNav.querySelector('.mobile-nav-close').addEventListener('click', closeNav);
  mobileNav.querySelector('.mobile-nav-backdrop').addEventListener('click', closeNav);

  // Close on resize > 768px
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) closeNav();
  });
}

// ============================================================
// DROPDOWN FILTER SYSTEM
// ============================================================
const SUBCATS = {
  vetements:   ['tshirt','shirt','jeans','pants','hoodie','dress','suit','shorts','jacket','set'],
  chaussures:  ['sneakers','boots','sandals','loafers','heels','formal','flipflops'],
  accessoires: ['bag','watch','jewelry','belt','cap','glasses','socks','beanie'],
};
const SUBCAT_LABELS = {
  tshirt:'T-Shirts', shirt:'Shirts', jeans:'Jeans', pants:'Pants',
  hoodie:'Hoodies', dress:'Dresses', suit:'Suits', shorts:'Shorts',
  jacket:'Jackets', set:'Sets',
  sneakers:'Sneakers', boots:'Boots', sandals:'Sandals', loafers:'Loafers',
  heels:'Heels', formal:'Formal Shoes', flipflops:'Flip Flops',
  bag:'Bags', watch:'Watches', jewelry:'Jewelry', belt:'Belts',
  cap:'Caps', glasses:'Glasses', socks:'Socks', beanie:'Beanies',
};

let activeCategory = 'all';
let activeSubcat   = null;
let currentSort    = 'default';

function buildFilters() {
  const bar = document.querySelector('.filters');
  if (!bar) return;
  const cards = [...document.querySelectorAll('.product-card')];
  const cats = (bar.dataset.cats || 'all').split(',');
  bar.innerHTML = '';

  // "All" button
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn-plain active';
  allBtn.textContent = 'All';
  allBtn.onclick = () => applyFilter('all', null, allBtn);
  bar.appendChild(allBtn);

  cats.filter(c => c !== 'all').forEach(cat => {
    const group = document.createElement('div');
    group.className = 'filter-group';
    const subcats = getSubcatsForCat(cat, cards);
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.cat = cat;
    btn.innerHTML = `${catLabel(cat)} <span class="chevron">▼</span>`;

    if (subcats.length > 0) {
      const dropdown = document.createElement('div');
      dropdown.className = 'filter-dropdown';
      const allSub = document.createElement('button');
      allSub.textContent = `All ${catLabel(cat)}`;
      allSub.onclick = e => { e.stopPropagation(); applyFilter(cat, null, btn); closeAllDropdowns(); };
      dropdown.appendChild(allSub);
      const divider = document.createElement('div');
      divider.className = 'dropdown-divider';
      dropdown.appendChild(divider);
      subcats.forEach(sub => {
        const subBtn = document.createElement('button');
        subBtn.textContent = SUBCAT_LABELS[sub] || sub;
        subBtn.dataset.sub = sub;
        subBtn.onclick = e => { e.stopPropagation(); applyFilter(cat, sub, btn, subBtn); closeAllDropdowns(); };
        dropdown.appendChild(subBtn);
      });
      btn.onclick = e => { e.stopPropagation(); toggleDropdown(btn, dropdown); };
      group.appendChild(btn);
      group.appendChild(dropdown);
    } else {
      btn.onclick = () => applyFilter(cat, null, btn);
      group.appendChild(btn);
    }
    bar.appendChild(group);
  });

  document.addEventListener('click', closeAllDropdowns);

  // Inject Sort bar after .filters
  buildSortBar(cards);
}

function buildSortBar(cards) {
  const bar = document.querySelector('.filters');
  if (!bar || document.querySelector('.sort-bar')) return;
  const sortBar = document.createElement('div');
  sortBar.className = 'sort-bar';
  sortBar.innerHTML = `
    <span class="sort-count"><strong id="visible-count">${cards.length}</strong> products</span>
    <div class="sort-select-wrap">
      <span class="sort-label">Sort by</span>
      <select class="sort-select" id="sort-select">
        <option value="default">Featured</option>
        <option value="price-asc">Price: Low → High</option>
        <option value="price-desc">Price: High → Low</option>
        <option value="name-asc">Name: A → Z</option>
      </select>
    </div>`;
  bar.insertAdjacentElement('afterend', sortBar);
  document.getElementById('sort-select').addEventListener('change', e => {
    currentSort = e.target.value;
    applySortAndFilter();
  });
}

function detectCats(cards) {
  const found = new Set(['all']);
  cards.forEach(c => {
    ['vetements','chaussures','accessoires','homme','femme','enfants'].forEach(cat => {
      if (c.classList.contains(cat)) found.add(cat);
    });
  });
  return [...found];
}
function getSubcatsForCat(cat, cards) {
  const typeCat = {homme:'vetements',femme:'vetements',enfants:'vetements'}[cat] || cat;
  return (SUBCATS[typeCat] || []).filter(sub =>
    cards.some(c => (c.classList.contains(cat) || c.classList.contains(typeCat)) && c.classList.contains(sub))
  );
}
function catLabel(cat) {
  return {vetements:'Clothing',chaussures:'Shoes',accessoires:'Accessories',homme:'Men',femme:'Women',enfants:'Kids'}[cat] || cat;
}
function toggleDropdown(btn, dropdown) {
  const isOpen = dropdown.classList.contains('open');
  closeAllDropdowns();
  if (!isOpen) { dropdown.classList.add('open'); btn.classList.add('open'); }
}
function closeAllDropdowns() {
  document.querySelectorAll('.filter-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('open'));
}

function applyFilter(cat, sub, activeBtnEl, activeSubEl) {
  activeCategory = cat;
  activeSubcat   = sub;
  document.querySelectorAll('.filter-btn-plain, .filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.filter-dropdown button').forEach(b => b.classList.remove('active'));
  if (activeBtnEl) activeBtnEl.classList.add('active');
  if (activeSubEl) activeSubEl.classList.add('active');
  applySortAndFilter();
}

function applySortAndFilter() {
  const grid = document.querySelector('.grid');
  if (!grid) return;
  const cards = [...document.querySelectorAll('.product-card')];

  // Filter
  const visible = cards.filter(card => {
    const matchCat = activeCategory === 'all' || card.classList.contains(activeCategory);
    const matchSub = !activeSubcat || card.classList.contains(activeSubcat);
    return matchCat && matchSub;
  });
  const hidden = cards.filter(c => !visible.includes(c));
  hidden.forEach(c => c.style.display = 'none');

  // Sort visible cards
  const sorted = [...visible].sort((a, b) => {
    if (currentSort === 'price-asc')  return getPrice(a) - getPrice(b);
    if (currentSort === 'price-desc') return getPrice(b) - getPrice(a);
    if (currentSort === 'name-asc')   return getName(a).localeCompare(getName(b));
    return 0; // featured — keep original order
  });

  // Re-append in sorted order
  sorted.forEach(c => { c.style.display = 'flex'; grid.appendChild(c); });

  // Update count
  const countEl = document.getElementById('visible-count');
  if (countEl) countEl.textContent = visible.length;
}

function getPrice(card) {
  const p = card.querySelector('.product-info > p');
  return p ? parseInt(p.textContent.replace(/[^\d]/g, '')) : 0;
}
function getName(card) {
  const h = card.querySelector('h3');
  return h ? h.textContent.trim() : '';
}

// Legacy aliases
function filter(cat)              { applyFilter(cat, null); }
function filterClothes(type)      { applyFilter(type, null); }
function filterShoes(type)        { applyFilter(type, null); }
function filterAccessories(type)  { applyFilter(type, null); }

// ============================================================
// SIZE CONFIG — detect which sizes to show per product type
// ============================================================
const SIZE_CONFIG = {
  // Clothing
  tshirt:  { type: 'clothing', sizes: ['XS','S','M','L','XL','XXL'] },
  shirt:   { type: 'clothing', sizes: ['XS','S','M','L','XL','XXL'] },
  hoodie:  { type: 'clothing', sizes: ['XS','S','M','L','XL','XXL'] },
  pants:   { type: 'clothing', sizes: ['28','30','32','34','36','38'] },
  jeans:   { type: 'clothing', sizes: ['28','30','32','34','36','38'] },
  dress:   { type: 'clothing', sizes: ['XS','S','M','L','XL'] },
  set:     { type: 'clothing', sizes: ['XS','S','M','L','XL'] },
  jacket:  { type: 'clothing', sizes: ['S','M','L','XL','XXL'] },
  suit:    { type: 'clothing', sizes: ['S','M','L','XL','XXL'] },
  shorts:  { type: 'clothing', sizes: ['S','M','L','XL','XXL'] },
  // Men shoes
  sneakers:{ type: 'shoes',    sizes: ['39','40','41','42','43','44','45'] },
  boots:   { type: 'shoes',    sizes: ['39','40','41','42','43','44','45'] },
  loafers: { type: 'shoes',    sizes: ['39','40','41','42','43','44','45'] },
  formal:  { type: 'shoes',    sizes: ['39','40','41','42','43','44','45'] },
  sandals: { type: 'shoes',    sizes: ['36','37','38','39','40','41','42'] },
  heels:   { type: 'shoes',    sizes: ['36','37','38','39','40','41'] },
  flipflops:{ type: 'shoes',   sizes: ['36','37','38','39','40','41','42'] },
};

function getSizesForCard(card) {
  for (const [key, cfg] of Object.entries(SIZE_CONFIG)) {
    if (card.classList.contains(key)) return cfg.sizes;
  }
  // Fallback: clothing gets S/M/L/XL, shoes get shoe sizes
  if (card.classList.contains('chaussures') || card.classList.contains('shoes')) {
    return ['38','39','40','41','42','43','44'];
  }
  if (card.classList.contains('vetements') || card.classList.contains('enfants')) {
    return ['XS','S','M','L','XL'];
  }
  return null; // accessories — no size
}

// ============================================================
// QUANTITY SELECTOR + SIZE SELECTOR
// ============================================================
function buildQuantitySelectors() {
  document.querySelectorAll('.product-card').forEach(card => {
    const actions = card.querySelector('.product-actions');
    if (!actions || actions.querySelector('.qty-selector')) return;

    // --- Extract product info early ---
    const addBtnRaw = actions.querySelector('button:not(.pay)');
    const origAdd   = addBtnRaw && addBtnRaw.getAttribute('onclick');
    const mAdd      = origAdd && origAdd.match(/addToCart\(\{name:'(.+?)',price:(\d+)\}\)/);
    if (mAdd) {
      card.dataset.productName  = mAdd[1];
      card.dataset.productPrice = mAdd[2];
    }

    // --- SIZE SELECTOR ---
    const sizes = getSizesForCard(card);
    let selectedSize = null;

    if (sizes) {
      const sizeWrap = document.createElement('div');
      sizeWrap.className = 'size-selector';
      sizeWrap.innerHTML = `
        <div class="size-label">
          <span>Size</span>
          <span class="size-selected">— Select —</span>
        </div>
        <div class="size-options">${
          sizes.map(s => `<button class="size-btn" data-size="${s}">${s}</button>`).join('')
        }</div>
        <div class="size-required-msg">⚠ Please select a size</div>`;
      actions.insertBefore(sizeWrap, actions.firstChild);

      sizeWrap.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          sizeWrap.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedSize = btn.dataset.size;
          sizeWrap.querySelector('.size-selected').textContent = btn.dataset.size;
          sizeWrap.querySelector('.size-required-msg').classList.remove('visible');
        });
      });
    }

    // --- QUANTITY SELECTOR ---
    const qtyWrap = document.createElement('div');
    qtyWrap.className = 'qty-selector';
    qtyWrap.innerHTML = `
      <button class="qty-btn qty-minus" aria-label="Decrease">−</button>
      <span class="qty-value">1</span>
      <button class="qty-btn qty-plus" aria-label="Increase">+</button>`;
    const display = qtyWrap.querySelector('.qty-value');
    qtyWrap.querySelector('.qty-minus').onclick = () => {
      const v = parseInt(display.textContent); if (v > 1) display.textContent = v - 1;
    };
    qtyWrap.querySelector('.qty-plus').onclick = () => {
      display.textContent = parseInt(display.textContent) + 1;
    };
    // Insert qty after size selector (or first if no sizes)
    const sizeEl = actions.querySelector('.size-selector');
    if (sizeEl) sizeEl.insertAdjacentElement('afterend', qtyWrap);
    else actions.insertBefore(qtyWrap, actions.firstChild);

    // --- REWIRE ADD TO CART ---
    const addBtn = actions.querySelector('button:not(.pay):not(.qty-btn):not(.size-btn)');
    if (addBtn && mAdd) {
      addBtn.classList.add('add-btn');
      addBtn.removeAttribute('onclick');
      addBtn.addEventListener('click', () => {
        if (sizes && !selectedSize) {
          const sw = actions.querySelector('.size-selector');
          if (sw) {
            sw.querySelector('.size-required-msg').classList.add('visible');
            sw.classList.add('shake');
            setTimeout(() => sw.classList.remove('shake'), 500);
          }
          return;
        }
        const qty = parseInt(display.textContent);
        const productName = selectedSize
          ? `${mAdd[1]} — Size ${selectedSize}`
          : mAdd[1];
        addToCartQty({ name: productName, price: parseInt(mAdd[2]) }, qty);
      });
    }

    // --- REWIRE BUY NOW ---
    const payBtn = actions.querySelector('button.pay');
    if (payBtn) {
      const origPay = payBtn.getAttribute('onclick');
      payBtn.removeAttribute('onclick');
      payBtn.addEventListener('click', () => {
        if (sizes && !selectedSize) {
          const sw = actions.querySelector('.size-selector');
          if (sw) {
            sw.querySelector('.size-required-msg').classList.add('visible');
            sw.classList.add('shake');
            setTimeout(() => sw.classList.remove('shake'), 500);
          }
          return;
        }
        const qty = parseInt(display.textContent);
        const mp = origPay && origPay.match(/payNow\('(.+?)',(\d+)\)/);
        if (mp) {
          const productName = selectedSize ? `${mp[1]} — Size ${selectedSize}` : mp[1];
          payNow(productName, parseInt(mp[2]), qty);
        }
      });
    }
  });
}

// ============================================================
// WISHLIST
// ============================================================
function getWishlist() {
  return JSON.parse(localStorage.getItem('wishlist')) || [];
}
function saveWishlist(wl) {
  localStorage.setItem('wishlist', JSON.stringify(wl));
  updateWishlistBadge();
}
function updateWishlistBadge() {
  const wl = getWishlist();
  document.querySelectorAll('.wishlist-badge').forEach(el => {
    el.textContent = wl.length;
    el.style.display = wl.length > 0 ? 'flex' : 'none';
  });
}
function toggleWishlist(btn, product) {
  let wl = getWishlist();
  const idx = wl.findIndex(i => i.name === product.name);
  if (idx === -1) {
    wl.push(product);
    btn.classList.add('wishlisted');
    btn.textContent = '♥';
    showToast('♥  ' + product.name + ' added to wishlist', '#e85d04');
  } else {
    wl.splice(idx, 1);
    btn.classList.remove('wishlisted');
    btn.textContent = '♡';
    showToast('♡  Removed from wishlist', '#6b6560');
  }
  // Pop animation
  btn.classList.remove('pop');
  requestAnimationFrame(() => { requestAnimationFrame(() => btn.classList.add('pop')); });
  setTimeout(() => btn.classList.remove('pop'), 400);
  saveWishlist(wl);
}
function buildWishlistButtons() {
  const wl = getWishlist();
  document.querySelectorAll('.product-card').forEach(card => {
    const imgWrap = card.querySelector('.product-image');
    if (!imgWrap || card.querySelector('.wishlist-btn')) return;

    // Try data attributes first (set by buildQuantitySelectors)
    // Fallback: read from onclick or HTML directly
    let name  = card.dataset.productName;
    let price = parseInt(card.dataset.productPrice);

    if (!name) {
      // Try extracting from the add-to-cart button onclick
      const addBtn = card.querySelector('button:not(.pay):not(.qty-btn):not(.size-btn)');
      const orig = addBtn && addBtn.getAttribute('onclick');
      const m = orig && orig.match(/addToCart\(\{name:'(.+?)',price:(\d+)\}\)/);
      if (m) { name = m[1]; price = parseInt(m[2]); }
    }
    if (!name) {
      // Last fallback: use h3 text and price paragraph
      const h3 = card.querySelector('h3');
      const pEl = card.querySelector('.product-info > p');
      if (h3) name = h3.textContent.trim();
      if (pEl) price = parseInt(pEl.textContent.replace(/[^\d]/g, ''));
    }
    if (!name) return;

    // Store for other functions
    card.dataset.productName  = name;
    card.dataset.productPrice = price;

    // Also store image src for wishlist display
    const img = card.querySelector('.product-image img');
    if (img && img.src) card.dataset.productImg = img.src;

    const product = { name, price, img: card.dataset.productImg || '' };
    const wBtn = document.createElement('button');
    wBtn.className = 'wishlist-btn';
    const isWished = wl.some(i => i.name === name);
    wBtn.textContent = isWished ? '♥' : '♡';
    if (isWished) wBtn.classList.add('wishlisted');
    wBtn.setAttribute('aria-label', isWished ? 'Remove from wishlist' : 'Add to wishlist');
    wBtn.onclick = e => {
      e.stopPropagation();
      toggleWishlist(wBtn, product);
      wBtn.setAttribute('aria-label', wBtn.classList.contains('wishlisted') ? 'Remove from wishlist' : 'Add to wishlist');
    };
    imgWrap.appendChild(wBtn);
  });
}

// ============================================================
// CART
// ============================================================
function getCart() { return JSON.parse(localStorage.getItem('cart')) || []; }
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); updateCartBadge(); }

function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = total;
    el.style.display = total > 0 ? 'flex' : 'none';
  });
}
function addToCartQty(product, qty) {
  const cart = getCart();
  const ex = cart.find(i => i.name === product.name);
  if (ex) ex.qty = (ex.qty || 1) + qty;
  else cart.push({ ...product, qty });
  saveCart(cart);
  const msg = qty > 1 ? `✓  ${qty}× ${product.name} added to cart` : `✓  ${product.name} added to cart`;
  showToast(msg);
}
function addToCart(product) { addToCartQty(product, 1); }
function payNow(name, price, qty = 1) {
  saveCart([{ name, price, qty }]);
  window.location.href = 'paiement.html';
}

// ============================================================
// CART BADGE & WISHLIST BADGE — inject into header
// ============================================================
function injectHeaderBadges() {
  const actions = document.querySelector('.header-actions');

  // Auto-inject wishlist link in header if not present
  if (actions && !actions.querySelector('a[href="wishlist.html"]')) {
    const wlLink = document.createElement('a');
    wlLink.href = 'wishlist.html';
    wlLink.setAttribute('aria-label', 'Wishlist');
    wlLink.innerHTML = '♡';
    wlLink.style.position = 'relative';
    // Insert before cart icon
    const cartLink = actions.querySelector('a[href="panier.html"]');
    actions.insertBefore(wlLink, cartLink || actions.firstChild);
  }

  document.querySelectorAll('a[href="panier.html"]').forEach(a => {
    if (a.querySelector('.cart-badge')) return;
    a.style.position = 'relative';
    const b = document.createElement('span');
    b.className = 'cart-badge';
    Object.assign(b.style, {
      position:'absolute', top:'-8px', right:'-10px',
      background:'var(--accent)', color:'#fff',
      borderRadius:'50%', width:'18px', height:'18px',
      fontSize:'0.65rem', fontWeight:'700',
      display:'none', alignItems:'center', justifyContent:'center',
      fontFamily:"'DM Sans',sans-serif", lineHeight:'1'
    });
    a.appendChild(b);
  });
  document.querySelectorAll('a[href="wishlist.html"]').forEach(a => {
    if (a.querySelector('.wishlist-badge')) return;
    a.style.position = 'relative';
    const b = document.createElement('span');
    b.className = 'wishlist-badge';
    Object.assign(b.style, {
      position:'absolute', top:'-8px', right:'-10px',
      background:'var(--accent)', color:'#fff',
      borderRadius:'50%', width:'18px', height:'18px',
      fontSize:'0.65rem', fontWeight:'700',
      display:'none', alignItems:'center', justifyContent:'center',
      fontFamily:"'DM Sans',sans-serif", lineHeight:'1'
    });
    a.appendChild(b);
  });
  updateCartBadge();
  updateWishlistBadge();
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, color) {
  color = color || '#0e0d0b';
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position:'fixed', bottom:'28px', right:'28px', background:color,
    color:'#fff', padding:'14px 22px', borderRadius:'2px', fontSize:'0.82rem',
    letterSpacing:'0.08em', zIndex:'9999', opacity:'0',
    transition:'opacity 0.25s ease', fontFamily:"'DM Sans',sans-serif", maxWidth:'300px'
  });
  document.body.appendChild(t);
  requestAnimationFrame(() => t.style.opacity = '1');
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2400);
}

// ============================================================
// LIGHTBOX
// ============================================================
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.style.display = 'none';
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product-image img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      const lb = document.getElementById('lightbox');
      if (lb) { document.getElementById('lightbox-img').src = img.src; lb.style.display = 'flex'; }
    });
  });

  buildFilters();
  buildQuantitySelectors();
  buildWishlistButtons();
  injectHeaderBadges();
  buildMobileNav();
  buildSearchBar();

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
});
