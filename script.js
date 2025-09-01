// Global Variables
let products = [];
let cart = [];
let wishlist = [];
let sellers = [];
let orders = [];
let currentSeller = null;
let currentFilter = 'all';
let currentCurrency = 'INR';
let exchangeRates = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095 };

// Initialize the website
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    displayProducts();
    updateCartCount();
    updateWishlistCount();
    updateSellerButton();
});

// Sample data with enhanced features
const sampleProducts = [
    {
        id: 1,
        name: "iPhone 15 Pro",
        price: 129900,
        originalPrice: 139900,
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300",
        description: "Latest iPhone with advanced camera and A17 Pro chip",
        category: "electronics",
        brand: "Apple",
        rating: 5,
        stock: 50,
        sellerId: "demo_seller",
        sellerName: "TechWorld Store",
        dateAdded: new Date().toISOString()
    },
    {
        id: 2,
        name: "Nike Air Max",
        price: 8999,
        originalPrice: 12999,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300",
        description: "Premium running shoes with air cushioning",
        category: "sports",
        brand: "Nike",
        rating: 4,
        stock: 25,
        sellerId: "demo_seller",
        sellerName: "Sports Hub",
        dateAdded: new Date().toISOString()
    }
];

// Load all data from localStorage
function loadData() {
    products = JSON.parse(localStorage.getItem('shopkart_products')) || [...sampleProducts];
    cart = JSON.parse(localStorage.getItem('shopkart_cart')) || [];
    wishlist = JSON.parse(localStorage.getItem('shopkart_wishlist')) || [];
    sellers = JSON.parse(localStorage.getItem('shopkart_sellers')) || [];
    orders = JSON.parse(localStorage.getItem('shopkart_orders')) || [];
    currentSeller = JSON.parse(localStorage.getItem('shopkart_current_seller')) || null;
    currentCurrency = localStorage.getItem('shopkart_currency') || 'INR';
    document.getElementById('currencySelect').value = currentCurrency;
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('shopkart_products', JSON.stringify(products));
    localStorage.setItem('shopkart_cart', JSON.stringify(cart));
    localStorage.setItem('shopkart_wishlist', JSON.stringify(wishlist));
    localStorage.setItem('shopkart_sellers', JSON.stringify(sellers));
    localStorage.setItem('shopkart_orders', JSON.stringify(orders));
    localStorage.setItem('shopkart_current_seller', JSON.stringify(currentSeller));
    localStorage.setItem('shopkart_currency', currentCurrency);
}

// Currency conversion
function convertPrice(price) {
    const converted = price * exchangeRates[currentCurrency];
    const symbol = currentCurrency === 'INR' ? '₹' : currentCurrency === 'USD' ? '$' : currentCurrency === 'EUR' ? '€' : '£';
    return symbol + Math.round(converted).toLocaleString();
}

// Change currency
function changeCurrency() {
    currentCurrency = document.getElementById('currencySelect').value;
    saveData();
    displayProducts();
    displayCartItems();
    if (currentSeller) loadSellerEarnings();
}

// Update seller button text
function updateSellerButton() {
    const btnText = document.getElementById('sellerBtnText');
    if (currentSeller) {
        btnText.textContent = currentSeller.shopName;
    } else {
        btnText.textContent = 'Seller Login';
    }
}

// Seller registration
function sellerRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const shopName = document.getElementById('regShopName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();

    if (!username || !password || !shopName || !email || !phone) {
        alert('सभी fields भरें!');
        return;
    }

    if (sellers.find(s => s.username === username)) {
        alert('Username already exists!');
        return;
    }

    const newSeller = {
        id: Date.now().toString(),
        username, password, shopName, email, phone,
        joinDate: new Date().toISOString(),
        totalEarnings: 0,
        productsSold: 0
    };

    sellers.push(newSeller);
    saveData();
    
    // Clear form
    ['regUsername', 'regPassword', 'regShopName', 'regEmail', 'regPhone'].forEach(id => {
        document.getElementById(id).value = '';
    });

    alert('Registration successful! अब login करें।');
    showLoginForm();
}

// Seller login
function sellerLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!username || !password) {
        alert('Username और password दोनों भरें!');
        return;
    }

    const seller = sellers.find(s => s.username === username && s.password === password);
    
    if (seller) {
        currentSeller = seller;
        saveData();
        updateSellerButton();
        toggleSellerAuth();
        toggleSellerDashboard();
        
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    } else {
        alert('Invalid username या password!');
    }
}

// Toggle seller auth modal
function toggleSellerAuth() {
    if (currentSeller) {
        toggleSellerDashboard();
    } else {
        document.getElementById('sellerAuthModal').classList.toggle('hidden');
    }
}

// Show login/register forms
function showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

// Seller logout
function sellerLogout() {
    currentSeller = null;
    saveData();
    updateSellerButton();
    toggleSellerDashboard();
}

// Toggle seller dashboard
function toggleSellerDashboard() {
    const dashboard = document.getElementById('sellerDashboard');
    dashboard.classList.toggle('hidden');
    
    if (!dashboard.classList.contains('hidden')) {
        document.getElementById('sellerShopName').textContent = currentSeller.shopName;
        showTab('addProduct');
        loadSellerProducts();
        loadSellerOrders();
        loadSellerEarnings();
    }
}

// Show dashboard tab
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
    event.target.classList.add('active');
}

// Load seller's earnings
function loadSellerEarnings() {
    const sellerOrders = orders.filter(order => 
        order.items.some(item => 
            products.find(p => p.id === item.id && p.sellerId === currentSeller.id)
        )
    );
    
    let totalEarnings = 0;
    let monthlyEarnings = 0;
    let productsSold = 0;
    const currentMonth = new Date().getMonth();
    
    sellerOrders.forEach(order => {
        const orderDate = new Date(order.date);
        order.items.forEach(item => {
            const product = products.find(p => p.id === item.id && p.sellerId === currentSeller.id);
            if (product) {
                const earnings = item.price * item.quantity;
                totalEarnings += earnings;
                productsSold += item.quantity;
                
                if (orderDate.getMonth() === currentMonth) {
                    monthlyEarnings += earnings;
                }
            }
        });
    });
    
    document.getElementById('totalEarnings').textContent = convertPrice(totalEarnings);
    document.getElementById('monthlyEarnings').textContent = convertPrice(monthlyEarnings);
    document.getElementById('productsSold').textContent = productsSold;
}

// Add new product
function addProduct() {
    if (!currentSeller) {
        alert('Product add करने के लिए seller login करें!');
        return;
    }

    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const originalPrice = parseFloat(document.getElementById('productOriginalPrice').value) || price;
    const image = document.getElementById('productImage').value.trim();
    const brand = document.getElementById('productBrand').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    const category = document.getElementById('productCategory').value;
    const stock = parseInt(document.getElementById('productStock').value) || 0;
    const rating = parseInt(document.getElementById('productRating').value) || 0;

    if (!name || !price || !description || !category || !brand) {
        alert('कृपया सभी required fields भरें!');
        return;
    }

    const newProduct = {
        id: Date.now(),
        name, price, originalPrice, image: image || 'https://via.placeholder.com/300x200?text=No+Image',
        brand, description, category, stock, rating,
        sellerId: currentSeller.id,
        sellerName: currentSeller.shopName,
        dateAdded: new Date().toISOString()
    };

    products.push(newProduct);
    saveData();
    displayProducts();
    loadSellerProducts();

    // Clear form
    ['productName', 'productPrice', 'productOriginalPrice', 'productImage', 'productBrand', 'productDescription', 'productCategory', 'productStock', 'productRating'].forEach(id => {
        document.getElementById(id).value = '';
    });

    alert('Product successfully add हो गया!');
}

// Display products with enhanced features
function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    let filteredProducts = [...products];

    // Apply category filter
    if (currentFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === currentFilter);
    }

    // Apply search filter
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm)
        );
    }

    // Apply sorting
    const sortBy = document.getElementById('sortSelect').value;
    switch(sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
    }

    productsGrid.innerHTML = '';

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<div style="text-align: center; grid-column: 1/-1; padding: 2rem;"><h3>कोई product नहीं मिला</h3></div>';
        return;
    }

    filteredProducts.forEach(product => {
        const discount = product.originalPrice > product.price ? 
            Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
        
        const stars = '★'.repeat(product.rating) + '☆'.repeat(5 - product.rating);
        
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.style.position = 'relative';
        
        productCard.innerHTML = `
            ${discount > 0 ? `<div class="product-badge">${discount}% OFF</div>` : ''}
            <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-rating">
                    <span class="stars">${stars}</span>
                    <span>(${product.rating})</span>
                </div>
                <div class="price-section">
                    <div class="product-price">${convertPrice(product.price)}</div>
                    ${product.originalPrice > product.price ? 
                        `<div class="original-price">${convertPrice(product.originalPrice)}</div>
                         <div class="discount">${discount}% off</div>` : ''}
                </div>
                <div class="stock-info">${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</div>
                <div class="product-description">${product.description}</div>
                <div style="font-size: 0.8rem; color: #666; margin-bottom: 1rem;">
                    <i class="fas fa-store"></i> ${product.sellerName}
                </div>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn-wishlist-product" onclick="toggleWishlistItem(${product.id})">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Sort products
function sortProducts() {
    displayProducts();
}

// Filter products by category
function filterProducts(category) {
    currentFilter = category;
    displayProducts();
}

// Search products
function searchProducts() {
    displayProducts();
}

// Wishlist functions
function toggleWishlistItem(productId) {
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    
    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        alert('Product removed from wishlist!');
    } else {
        const product = products.find(p => p.id === productId);
        if (product) {
            wishlist.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                brand: product.brand
            });
            alert('Product added to wishlist!');
        }
    }
    
    saveData();
    updateWishlistCount();
}

function toggleWishlist() {
    const wishlistModal = document.getElementById('wishlistModal');
    wishlistModal.classList.toggle('hidden');
    if (!wishlistModal.classList.contains('hidden')) {
        displayWishlistItems();
    }
}

function displayWishlistItems() {
    const wishlistItems = document.getElementById('wishlistItems');
    
    if (wishlist.length === 0) {
        wishlistItems.innerHTML = '<div style="text-align: center; padding: 2rem;"><h3>Your wishlist is empty</h3></div>';
        return;
    }
    
    wishlistItems.innerHTML = wishlist.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${convertPrice(item.price)}</div>
                <div style="font-size: 0.8rem; color: #666;">${item.brand}</div>
            </div>
            <button class="btn-add-cart" onclick="moveToCart(${item.id})">Move to Cart</button>
            <button class="btn-delete" onclick="removeFromWishlist(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function moveToCart(productId) {
    addToCart(productId);
    removeFromWishlist(productId);
}

function removeFromWishlist(productId) {
    wishlist = wishlist.filter(item => item.id !== productId);
    saveData();
    updateWishlistCount();
    displayWishlistItems();
}

function updateWishlistCount() {
    document.getElementById('wishlistCount').textContent = wishlist.length;
}

// Cart functions (enhanced)
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
        } else {
            alert('Maximum stock reached!');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1,
            sellerId: product.sellerId,
            sellerName: product.sellerName,
            brand: product.brand
        });
    }

    saveData();
    updateCartCount();
    
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Added!';
    button.style.background = '#4CAF50';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 1000);
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = totalItems;
}

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    cartModal.classList.toggle('hidden');
    if (!cartModal.classList.contains('hidden')) {
        displayCartItems();
    }
}

function displayCartItems() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItems.innerHTML = '<div style="text-align: center; padding: 2rem;"><h3>Your cart is empty</h3></div>';
        cartTotal.textContent = convertPrice(0);
        return;
    }

    let total = 0;
    cartItems.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${convertPrice(item.price)}</div>
                    <div style="font-size: 0.8rem; color: #666;">by ${item.sellerName}</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span style="margin: 0 0.5rem; font-weight: bold;">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
                <button class="btn-delete" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');

    cartTotal.textContent = convertPrice(total);
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    if (!item || !product) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (item.quantity > product.stock) {
        item.quantity = product.stock;
        alert('Maximum stock reached!');
    }

    saveData();
    updateCartCount();
    displayCartItems();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveData();
    updateCartCount();
    displayCartItems();
}

// Enhanced checkout
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (confirm(`Proceed with payment of ${convertPrice(total)}?\n\nTotal Items: ${itemCount}\nTotal Amount: ${convertPrice(total)}`)) {
        // Create order
        const newOrder = {
            id: Date.now(),
            items: [...cart],
            total: total,
            date: new Date().toISOString(),
            status: 'confirmed',
            currency: currentCurrency
        };
        
        orders.push(newOrder);
        
        // Update product stock
        cart.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id);
            if (product) {
                product.stock -= cartItem.quantity;
            }
        });
        
        cart = [];
        saveData();
        updateCartCount();
        toggleCart();
        
        alert(`🎉 Order placed successfully!\n\nOrder ID: #${newOrder.id}\nAmount: ${convertPrice(total)}\n\nThank you for shopping with ShopKart!`);
    }
}

// Load seller data
function loadSellerProducts() {
    const sellerProducts = products.filter(p => p.sellerId === currentSeller.id);
    const container = document.getElementById('sellerProducts');
    
    if (sellerProducts.length === 0) {
        container.innerHTML = '<p>You haven\'t added any products yet.</p>';
        return;
    }
    
    container.innerHTML = sellerProducts.map(product => `
        <div class="seller-product-card">
            <div>
                <h4>${product.name}</h4>
                <p>${convertPrice(product.price)} - ${product.category} - Stock: ${product.stock}</p>
            </div>
            <button onclick="deleteProduct(${product.id})" class="btn-delete">Delete</button>
        </div>
    `).join('');
}

function loadSellerOrders() {
    const sellerOrders = orders.filter(order => 
        order.items.some(item => 
            products.find(p => p.id === item.id && p.sellerId === currentSeller.id)
        )
    );
    
    const container = document.getElementById('sellerOrders');
    
    if (sellerOrders.length === 0) {
        container.innerHTML = '<p>No orders received yet.</p>';
        return;
    }
    
    container.innerHTML = sellerOrders.map(order => `
        <div class="order-item">
            <h4>Order #${order.id}</h4>
            <p>Date: ${new Date(order.date).toLocaleDateString()}</p>
            <p>Total: ${convertPrice(order.total)}</p>
            <p>Items: ${order.items.length}</p>
            <p>Status: ${order.status}</p>
        </div>
    `).join('');
}

function deleteProduct(productId) {
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    if (currentSeller && product.sellerId !== currentSeller.id) {
        alert('You can only delete your own products!');
        return;
    }

    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(product => product.id !== productId);
        saveData();
        displayProducts();
        if (currentSeller) loadSellerProducts();
        alert('Product deleted successfully!');
    }
}

// Event listeners
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchProducts();
});

document.addEventListener('click', function(e) {
    const modals = ['sellerAuthModal', 'sellerDashboard', 'cartModal', 'wishlistModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});