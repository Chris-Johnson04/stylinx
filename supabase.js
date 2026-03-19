// ============================================================
// STYLINX — Supabase Backend
// Inclure dans toutes les pages : <script src="supabase.js"></script>
// ============================================================

const SUPABASE_URL = 'https://bjtqwptaimempklxaiqv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_F5HC6JBBV8IrTUYLTCNLHg_tCLzDHNZ';
const SB_FREE_SHIPPING = 3000;
const SB_SHIPPING_COST = 150;

// Load Supabase SDK dynamically
(function loadSupabase() {
  if (window.supabase) return;
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  s.onload = () => {
    window._sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.dispatchEvent(new Event('supabase:ready'));
    SB.onReady();
  };
  document.head.appendChild(s);
})();

// ============================================================
// MAIN SB OBJECT
// ============================================================
const SB = {

  _readyCallbacks: [],
  _ready: false,

  onReady() {
    this._ready = true;
    this._readyCallbacks.forEach(fn => fn());
    this._readyCallbacks = [];
    this.updateHeaderUI();
  },

  ready(fn) {
    if (this._ready) fn();
    else this._readyCallbacks.push(fn);
  },

  client() { return window._sb; },

  // ── AUTH ────────────────────────────────────────────────────

  async getUser() {
    const { data: { user } } = await this.client().auth.getUser();
    return user;
  },

  async signUp(email, password, fullName) {
    const { data, error } = await this.client().auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    return { data, error };
  },

  async signIn(email, password) {
    const { data, error } = await this.client().auth.signInWithPassword({ email, password });
    return { data, error };
  },

  async signOut() {
    await this.client().auth.signOut();
    this.updateHeaderUI();
    window.location.href = 'index.html';
  },

  // ── HEADER UI ───────────────────────────────────────────────

  async updateHeaderUI() {
    const user = await this.getUser();

    // Update account icon → avatar with initials if logged in
    document.querySelectorAll('a[href="login.html"], a[href="profil.html"]').forEach(a => {
      if (user) {
        // Get name from metadata or email
        const name     = user.user_metadata?.full_name || user.email || '';
        const initials = name.split(/[\s@]/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

        // Replace with avatar
        a.href = 'profil.html';
        a.setAttribute('aria-label', 'My Profile');
        a.innerHTML = '';
        a.style.cssText = 'width:36px;height:36px;border-radius:50%;background:var(--ink);color:#fff;display:flex;align-items:center;justify-content:center;font-family:"Playfair Display",serif;font-size:0.82rem;font-weight:700;text-decoration:none;border:2px solid var(--ink);transition:all 0.2s;flex-shrink:0;';
        a.textContent = initials;
        a.onmouseover = () => { a.style.background = 'var(--accent)'; a.style.borderColor = 'var(--accent)'; };
        a.onmouseout  = () => { a.style.background = 'var(--ink)';    a.style.borderColor = 'var(--ink)'; };

        // Fetch full name from profile to get proper initials
        this.client().from('profiles').select('full_name').eq('id', user.id).maybeSingle().then(({ data }) => {
          if (data && data.full_name) {
            const pi = data.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            a.textContent = pi;
          }
        });
      } else {
        a.href = 'login.html';
        a.setAttribute('aria-label', 'Account');
        a.innerHTML = '👤';
        a.style.cssText = '';
        a.onmouseover = null;
        a.onmouseout  = null;
      }
    });

    if (user) {
      this.updateCartBadge();
      this.updateWishlistBadge();
    }
  },

  // ── CART ────────────────────────────────────────────────────

  async getCart() {
    const user = await this.getUser();
    if (!user) {
      // Guest: read from localStorage, normalize format
      try {
        const raw = JSON.parse(localStorage.getItem('cart')) || [];
        return raw.map(i => ({
          id:    null,
          name:  i.name  || '',
          price: Number(i.price) || 0,
          img:   i.img   || '',
          size:  i.size  || '',
          qty:   i.qty   || 1
        }));
      } catch(e) { return []; }
    }
    const { data, error } = await this.client()
      .from('cart')
      .select('*')
      .eq('user_id', user.id);
    if (error) { console.error('Cart error:', error); return []; }
    return (data || []).map(row => ({
      id:    row.id,
      name:  row.product_name,
      price: row.product_price,
      img:   row.product_img,
      size:  row.size,
      qty:   row.qty
    }));
  },

  async addToCart(product, qty = 1) {
    const user = await this.getUser();
    if (!user) {
      // Guest: use localStorage
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const key = product.name + (product.size ? '|' + product.size : '');
      const ex = cart.find(i => (i.name + (i.size ? '|' + i.size : '')) === key);
      if (ex) ex.qty = (ex.qty || 1) + qty;
      else cart.push({ ...product, qty });
      localStorage.setItem('cart', JSON.stringify(cart));
      this.updateCartBadge();
      showToast('✓  ' + product.name + ' added to cart');
      return;
    }
    // Check if item already exists
    const productName = product.name;
    const size = product.size || null;
    const { data: existing } = await this.client()
      .from('cart')
      .select('id, qty')
      .eq('user_id', user.id)
      .eq('product_name', productName)
      .eq('size', size || '')
      .maybeSingle();

    if (existing) {
      await this.client().from('cart').update({ qty: existing.qty + qty }).eq('id', existing.id);
    } else {
      await this.client().from('cart').insert({
        user_id: user.id,
        product_name: productName,
        product_price: product.price,
        product_img: product.img || '',
        size: size || '',
        qty
      });
    }
    this.updateCartBadge();
    showToast('✓  ' + product.name + (size ? ' — Size ' + size : '') + ' added to cart');
  },

  async updateCartQty(itemId, qty) {
    const user = await this.getUser();
    if (!user) return;
    if (qty <= 0) { await this.removeFromCart(itemId); return; }
    await this.client().from('cart').update({ qty }).eq('id', itemId).eq('user_id', user.id);
  },

  async removeFromCart(itemId) {
    const user = await this.getUser();
    if (!user) return;
    await this.client().from('cart').delete().eq('id', itemId).eq('user_id', user.id);
    this.updateCartBadge();
  },

  async clearCart() {
    const user = await this.getUser();
    if (!user) { localStorage.removeItem('cart'); this.updateCartBadge(); return; }
    await this.client().from('cart').delete().eq('user_id', user.id);
    this.updateCartBadge();
  },

  async updateCartBadge() {
    const cart = await this.getCart();
    const total = cart.reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = total;
      el.style.display = total > 0 ? 'flex' : 'none';
    });
  },

  // ── WISHLIST ─────────────────────────────────────────────────

  async getWishlist() {
    const user = await this.getUser();
    if (!user) {
      try { return JSON.parse(localStorage.getItem('wishlist')) || []; } catch(e) { return []; }
    }
    const { data } = await this.client()
      .from('wishlist')
      .select('*')
      .eq('user_id', user.id);
    return (data || []).map(row => ({
      id: row.id,
      name: row.product_name,
      price: row.product_price,
      img: row.product_img
    }));
  },

  async toggleWishlist(product, btn) {
    const user = await this.getUser();
    if (!user) {
      // Guest fallback
      let wl = JSON.parse(localStorage.getItem('wishlist')) || [];
      const idx = wl.findIndex(i => i.name === product.name);
      if (idx === -1) {
        wl.push(product);
        if (btn) { btn.classList.add('wishlisted'); btn.textContent = '♥'; }
        showToast('♥  ' + product.name + ' added to wishlist', '#e85d04');
      } else {
        wl.splice(idx, 1);
        if (btn) { btn.classList.remove('wishlisted'); btn.textContent = '♡'; }
        showToast('♡  Removed from wishlist', '#6b6560');
      }
      localStorage.setItem('wishlist', JSON.stringify(wl));
      this.updateWishlistBadge();
      return;
    }
    const { data: existing } = await this.client()
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_name', product.name)
      .maybeSingle();

    if (existing) {
      await this.client().from('wishlist').delete().eq('id', existing.id);
      if (btn) { btn.classList.remove('wishlisted'); btn.textContent = '♡'; }
      showToast('♡  Removed from wishlist', '#6b6560');
    } else {
      await this.client().from('wishlist').insert({
        user_id: user.id,
        product_name: product.name,
        product_price: product.price,
        product_img: product.img || ''
      });
      if (btn) { btn.classList.add('wishlisted'); btn.textContent = '♥'; }
      showToast('♥  ' + product.name + ' added to wishlist', '#e85d04');
    }
    // Pop animation
    if (btn) {
      btn.classList.remove('pop');
      requestAnimationFrame(() => requestAnimationFrame(() => btn.classList.add('pop')));
      setTimeout(() => btn.classList.remove('pop'), 400);
    }
    this.updateWishlistBadge();
  },

  async updateWishlistBadge() {
    const wl = await this.getWishlist();
    document.querySelectorAll('.wishlist-badge').forEach(el => {
      el.textContent = wl.length;
      el.style.display = wl.length > 0 ? 'flex' : 'none';
    });
  },

  // ── PROMO CODES ──────────────────────────────────────────────

  async validatePromo(code, subtotal) {
    const { data, error } = await this.client()
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .maybeSingle();

    if (error || !data) return { valid: false, message: 'Invalid promo code' };
    if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false, message: 'Promo code expired' };
    if (subtotal < data.min_order) return { valid: false, message: 'Minimum order ₹' + data.min_order.toLocaleString('en-IN') + ' required' };

    let discount = 0;
    if (data.discount_percent) discount = Math.round(subtotal * data.discount_percent / 100);
    if (data.discount_fixed)   discount = data.discount_fixed;

    return { valid: true, discount, message: data.discount_percent ? data.discount_percent + '% off applied!' : '₹' + discount + ' off applied!' };
  },

  // ── ORDERS ───────────────────────────────────────────────────

  async createOrder({ cart, subtotal, shipping, discount, promoCode, customerInfo, paymentMethod }) {
    const user = await this.getUser();
    const orderNumber = 'STX-' + Date.now().toString(36).toUpperCase().slice(-6);
    const total = subtotal + shipping - discount;

    const orderData = {
      order_number:     orderNumber,
      user_id:          user ? user.id : null,
      status:           'pending',
      subtotal:         subtotal,
      shipping:         shipping,
      discount:         discount,
      total:            total,
      promo_code:       promoCode || null,
      customer_name:    customerInfo.name,
      customer_email:   customerInfo.email || (user ? user.email : null),
      customer_phone:   customerInfo.phone,
      delivery_address: customerInfo.address,
      payment_method:   paymentMethod
    };

    let order = null;

    // Try Supabase first
    try {
      const { data, error } = await this.client()
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) {
        console.warn('Supabase order error:', error.message);
        // Fallback: create order object locally
        order = { ...orderData, id: 'local-' + Date.now(), created_at: new Date().toISOString() };
      } else {
        order = data;
        // Insert order items
        const items = cart.map(item => ({
          order_id:      order.id,
          product_name:  item.name,
          product_price: item.price,
          product_img:   item.img || '',
          size:          item.size || '',
          qty:           item.qty || 1
        }));
        await this.client().from('order_items').insert(items);
      }
    } catch(e) {
      console.warn('Order save failed, using local fallback:', e);
      order = { ...orderData, id: 'local-' + Date.now(), created_at: new Date().toISOString() };
    }

    // Clear cart
    await this.clearCart();

    // Save to localStorage for confirmation page
    localStorage.setItem('last_order', JSON.stringify({ ...order, items: cart }));

    return order;
  },

  async getOrders() {
    const user = await this.getUser();
    if (!user) return [];
    const { data } = await this.client()
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return data || [];
  },

  // ── MIGRATE localStorage → Supabase on login ─────────────────

  async migrateLocalData() {
    const user = await this.getUser();
    if (!user) return;

    // Migrate cart
    const localCart = JSON.parse(localStorage.getItem('cart')) || [];
    for (const item of localCart) {
      await this.addToCart(item, item.qty || 1);
    }
    if (localCart.length > 0) localStorage.removeItem('cart');

    // Migrate wishlist
    const localWl = JSON.parse(localStorage.getItem('wishlist')) || [];
    for (const item of localWl) {
      await this.toggleWishlist(item, null);
    }
    if (localWl.length > 0) localStorage.removeItem('wishlist');
  }
};

// ── Global helpers (backward compat with existing HTML) ──────
function showToast(msg, color) {
  color = color || '#0e0d0b';
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:28px;right:28px;background:' + color + ';color:#fff;padding:14px 22px;border-radius:2px;font-size:0.82rem;letter-spacing:0.08em;z-index:9999;opacity:0;transition:opacity 0.25s;font-family:DM Sans,sans-serif;max-width:300px;';
  document.body.appendChild(t);
  setTimeout(() => t.style.opacity = '1', 10);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2400);
}
