
// ============================================================
// STATE
// ============================================================
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('ec_cart') || '[]');
let currentUser = JSON.parse(localStorage.getItem('ec_user') || 'null');
let currentFilter = { home: 'all', products: 'all' };
let modalProduct = null;

// ============================================================
// NAVIGATION
// ============================================================
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const nl = document.getElementById('nav-' + page);
  if (nl) nl.classList.add('active');
  // Close mobile menu
  const nc = document.getElementById('navMenu');
  if (nc && nc.classList.contains('show')) {
    bootstrap.Collapse.getInstance(nc)?.hide();
  }
  window.scrollTo(0, 0);
  if (page === 'home' || page === 'products') renderProducts();
  if (page === 'cart') renderCart();
}

// ============================================================
// FETCH PRODUCTS
// ============================================================
async function fetchProducts() {
  try {
    const res = await fetch('https://fakestoreapi.com/products');
    allProducts = await res.json();
    renderProducts();
  } catch(e) {
    document.getElementById('homeProductsGrid').innerHTML =
      '<div class="col-12 text-center text-danger py-4">Failed to load products. Please check your internet connection.</div>';
    document.getElementById('productsGrid').innerHTML =
      '<div class="col-12 text-center text-danger py-4">Failed to load products. Please check your internet connection.</div>';
  }
}

function productCard(p) {
  return `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${p.image}" alt="${p.title}" loading="lazy"/>
        </div>
        <div class="product-body">
          <div class="product-title">${p.title}</div>
          <div class="product-desc">${p.description}</div>
          <div class="product-price">$ ${p.price.toFixed(2)}</div>
          <div class="product-actions">
            <button class="btn btn-outline-dark btn-sm" onclick="showDetail(${p.id})">Details</button>
            <button class="btn btn-dark btn-sm" onclick="addToCart(${p.id})"><i class="bi bi-cart-plus me-1"></i>Add to Cart</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderProducts() {
  ['home', 'products'].forEach(view => {
    const filter = currentFilter[view];
    const filtered = filter === 'all' ? allProducts : allProducts.filter(p => p.category === filter);
    const gridId = view === 'home' ? 'homeProductsGrid' : 'productsGrid';
    const grid = document.getElementById(gridId);
    if (!grid) return;
    if (allProducts.length === 0) return;
    grid.innerHTML = filtered.map(productCard).join('');
  });
}

function filterProducts(cat, view) {
  currentFilter[view] = cat;
  const filterId = view === 'home' ? 'homeFilter' : 'productsFilter';
  const filterContainer = document.getElementById(filterId);
  if (filterContainer) {
    Array.from(filterContainer.querySelectorAll('.filter-btn')).forEach(b => {
      b.classList.toggle('active',
        (cat === 'all' && b.textContent.trim() === 'All') ||
        b.textContent.trim().toLowerCase().replace("'","'") === cat.toLowerCase().replace("'","'") ||
        (cat === 'jewelery' && b.textContent.trim() === 'Jewelry')
      );
    });
  }
  renderProducts();
}

// ============================================================
// PRODUCT DETAIL MODAL
// ============================================================
function showDetail(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  modalProduct = p;
  document.getElementById('modalImg').src = p.image;
  document.getElementById('modalImg').alt = p.title;
  document.getElementById('modalTitle').textContent = p.title;
  document.getElementById('modalDesc').textContent = p.description;
  document.getElementById('modalPrice').textContent = `$ ${p.price.toFixed(2)}`;
  document.getElementById('modalCategory').textContent = p.category;
  const r = p.rating;
  document.getElementById('modalRating').innerHTML = `${'★'.repeat(Math.round(r.rate))}${'☆'.repeat(5-Math.round(r.rate))} <span class="text-muted">(${r.count})</span>`;
  new bootstrap.Modal(document.getElementById('productModal')).show();
}

function addToCartFromModal() {
  if (modalProduct) {
    addToCart(modalProduct.id);
    bootstrap.Modal.getInstance(document.getElementById('productModal'))?.hide();
  }
}

// ============================================================
// CART
// ============================================================
function addToCart(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(c => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: p.id, title: p.title, price: p.price, image: p.image, qty: 1 });
  }
  saveCart();
  updateCartCount();
  showToast(`"${p.title.substring(0,30)}..." added to cart!`);
}

function saveCart() {
  localStorage.setItem('ec_cart', JSON.stringify(cart));
}

function updateCartCount() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  const cartCountSpan = document.getElementById('cartCount');
  if (cartCountSpan) cartCountSpan.textContent = total;
}

function renderCart() {
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const contentEl = document.getElementById('cartContent');

  if (!itemsEl || !emptyEl || !contentEl) return;

  if (cart.length === 0) {
    emptyEl.classList.remove('d-none');
    contentEl.classList.add('d-none');
    return;
  }
  emptyEl.classList.add('d-none');
  contentEl.classList.remove('d-none');

  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item" id="cart-item-${item.id}">
      <img src="${item.image}" alt="${item.title}"/>
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">${item.qty} x $${item.price.toFixed(2)}</div>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <button class="remove-btn" onclick="removeItem(${item.id})" title="Remove"><i class="bi bi-trash3"></i></button>
    </div>
  `).join('');

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalItems = cart.reduce((s, c) => s + c.qty, 0);
  const productCountLabel = document.getElementById('productCountLabel');
  const subtotalDisplay = document.getElementById('subtotalDisplay');
  const totalDisplay = document.getElementById('totalDisplay');
  if (productCountLabel) productCountLabel.textContent = `Products (${totalItems})`;
  if (subtotalDisplay) subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
  if (totalDisplay) totalDisplay.textContent = `$${(subtotal + 30).toFixed(2)}`;
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartCount();
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartCount();
  renderCart();
}

function checkout() {
  if (!currentUser) {
    showToast('Please login to proceed to checkout!');
    navigate('login');
    return;
  }
  showToast('Order placed successfully! 🎉');
  cart = [];
  saveCart();
  updateCartCount();
  renderCart();
}

// ============================================================
// CONTACT
// ============================================================
function sendContact() {
  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const msg = document.getElementById('contactMsg').value.trim();
  const alertEl = document.getElementById('contactAlert');
  if (!name || !email || !msg) {
    alertEl.className = 'alert auth-alert alert-danger';
    alertEl.textContent = 'Please fill in all fields.';
    alertEl.classList.remove('d-none');
    return;
  }
  alertEl.className = 'alert auth-alert alert-success';
  alertEl.textContent = 'Message sent successfully! We\'ll get back to you soon.';
  alertEl.classList.remove('d-none');
  document.getElementById('contactName').value = '';
  document.getElementById('contactEmail').value = '';
  document.getElementById('contactMsg').value = '';
  setTimeout(() => alertEl.classList.add('d-none'), 4000);
}

// ============================================================
// AUTH
// ============================================================
function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const alertEl = document.getElementById('loginAlert');

  if (!email || !pass) {
    showAuthAlert(alertEl, 'danger', 'Please enter email and password.');
    return;
  }

  const users = JSON.parse(localStorage.getItem('ec_users') || '[]');
  const user = users.find(u => u.email === email && u.password === pass);

  if (!user) {
    showAuthAlert(alertEl, 'danger', 'Invalid email or password. Please try again.');
    return;
  }

  currentUser = { name: user.name, email: user.email };
  localStorage.setItem('ec_user', JSON.stringify(currentUser));
  updateAuthUI();
  showToast(`Welcome back, ${user.name}! 👋`);
  navigate('home');
}

function doRegister() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;
  const alertEl = document.getElementById('registerAlert');

  if (!name || !email || !pass || !confirm) {
    showAuthAlert(alertEl, 'danger', 'Please fill in all fields.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showAuthAlert(alertEl, 'danger', 'Please enter a valid email address.');
    return;
  }
  if (pass.length < 6) {
    showAuthAlert(alertEl, 'danger', 'Password must be at least 6 characters.');
    return;
  }
  if (pass !== confirm) {
    showAuthAlert(alertEl, 'danger', 'Passwords do not match.');
    return;
  }

  const users = JSON.parse(localStorage.getItem('ec_users') || '[]');
  if (users.find(u => u.email === email)) {
    showAuthAlert(alertEl, 'danger', 'An account with this email already exists.');
    return;
  }

  users.push({ name, email, password: pass });
  localStorage.setItem('ec_users', JSON.stringify(users));
  currentUser = { name, email };
  localStorage.setItem('ec_user', JSON.stringify(currentUser));
  updateAuthUI();
  showToast(`Account created! Welcome, ${name}! 🎉`);
  navigate('home');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('ec_user');
  updateAuthUI();
  showToast('Logged out successfully.');
  navigate('home');
}

function showAuthAlert(el, type, msg) {
  el.className = `alert auth-alert alert-${type}`;
  el.textContent = msg;
  el.classList.remove('d-none');
}

function updateAuthUI() {
  const isLoggedIn = !!currentUser;
  const btnLogin = document.getElementById('btnLogin');
  const btnRegister = document.getElementById('btnRegister');
  const btnLogout = document.getElementById('btnLogout');
  const badge = document.getElementById('userBadge');
  
  if (btnLogin) btnLogin.style.display = isLoggedIn ? 'none' : '';
  if (btnRegister) btnRegister.style.display = isLoggedIn ? 'none' : '';
  if (btnLogout) btnLogout.classList.toggle('d-none', !isLoggedIn);
  if (badge) badge.style.display = isLoggedIn ? 'inline-flex' : 'none';
  if (currentUser && document.getElementById('userNameDisplay')) {
    document.getElementById('userNameDisplay').textContent = currentUser.name;
  }
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
  const toastMsg = document.getElementById('toastMsg');
  if (toastMsg) toastMsg.textContent = msg;
  const toastEl = document.getElementById('mainToast');
  if (toastEl) {
    const t = new bootstrap.Toast(toastEl, { delay: 2800 });
    t.show();
  }
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  updateAuthUI();
  fetchProducts();
});





