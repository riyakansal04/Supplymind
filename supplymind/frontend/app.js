// API Base URL
const API_URL = 'http://localhost:5000/api';

// Global state
let currentView = 'dashboard';
let allProducts = [];
let allAlerts = [];
let allSuppliers = [];

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SupplyMind Initializing...');
    checkAuth();
});

// Setup navigation after login
function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            switchView(view);
        });
    });
}

// Switch views
function switchView(view) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });
    document.getElementById(`${view}View`).classList.add('active');
    
    // Update header
    const titles = {
        dashboard: ['Dashboard', 'Real-time inventory insights'],
        billing: ['Billing & Sales', 'Process customer purchases and generate bills'],
        inventory: ['Inventory Management', 'Manage your products and stock'],
        forecasting: ['AI Forecasting', 'Predict future demand with advanced AI'],
        analytics: ['Sales Analytics', 'Detailed sales performance metrics'],
        batch: ['Batch Operations', 'Perform bulk updates efficiently'],
        reports: ['Reports', 'Generate and download reports'],
        suppliers: ['Supplier Management', 'Manage your suppliers'],
        alerts: ['Alerts & Notifications', 'Stock alerts and recommendations']
    };
    
    document.getElementById('pageTitle').textContent = titles[view][0];
    document.getElementById('pageSubtitle').textContent = titles[view][1];
    
    currentView = view;
    
    // Load view data
    switch(view) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'billing':
            loadBillingView();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'forecasting':
            loadForecasting();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'batch':
            loadBatchView();
            break;
        case 'suppliers':
            loadSuppliers();
            break;
        case 'alerts':
            loadAlerts();
            break;
    }
}

// API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {'Content-Type': 'application/json'}
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}

// Initialize system with sample data
async function initializeSystem() {
    if (!confirm('This will initialize the system with sample data. Continue?')) {
        return;
    }
    
    showLoading('Initializing system with sample data...');
    
    try {
        const result = await apiCall('/init', 'POST');
        showNotification(result.message, 'success');
        setTimeout(() => {
            loadDashboard();
            loadInventory();
        }, 1000);
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Analyze inventory
async function analyzeInventory() {
    showLoading('Analyzing inventory with AI...');
    
    try {
        const result = await apiCall('/alerts/analyze', 'POST');
        showNotification(`Analysis complete! Found ${result.alerts.length} alerts`, 'success');
        setTimeout(() => {
            switchView('alerts');
        }, 1000);
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Modals
function showAddProductModal() {
    document.getElementById('addProductModal').classList.add('active');
}

function showAddSupplierModal() {
    document.getElementById('addSupplierModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal on background click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Add product form
document.getElementById('addProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    showLoading('Adding product...');
    
    try {
        await apiCall('/products/add', 'POST', data);
        showNotification('Product added/updated successfully!', 'success');
        closeModal('addProductModal');
        e.target.reset();
        loadInventory();
        loadDashboard();
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
});

// Add supplier form
document.getElementById('addSupplierForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    showLoading('Adding supplier...');
    
    try {
        await apiCall('/suppliers/add', 'POST', data);
        showNotification('Supplier added successfully!', 'success');
        closeModal('addSupplierModal');
        e.target.reset();
        loadSuppliers();
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
});

// Loading overlay
function showLoading(text = 'Processing...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Notifications
function showNotification(message, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#2563eb',
        warning: '#f59e0b'
    };
    
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 3000;
        font-weight: 600;
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <span style="font-size:20px;">${icons[type]}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Format currency
function formatCurrency(value) {
    return '₹' + Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

// Format number
function formatNumber(value) {
    return Number(value).toLocaleString('en-IN');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Delete product with confirmation
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
        return;
    }
    
    showLoading('Deleting product...');
    
    try {
        await apiCall(`/products/${productId}`, 'DELETE');
        showNotification('Product deleted successfully!', 'success');
        loadInventory();
        loadDashboard();
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Delete supplier with confirmation
async function deleteSupplier(supplierId) {
    if (!confirm('Are you sure you want to delete this supplier?')) {
        return;
    }
    
    showLoading('Deleting supplier...');
    
    try {
        await apiCall(`/suppliers/${supplierId}`, 'DELETE');
        showNotification('Supplier deleted successfully!', 'success');
        loadSuppliers();
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.focus();
        }
    }
    
    // ESC to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Auto-refresh dashboard stats every 30 seconds
setInterval(() => {
    if (currentView === 'dashboard' && getUser()) {
        loadDashboard();
    }
}, 30000);

// Console welcome message
console.log('%c🚀 SupplyMind', 'font-size: 24px; font-weight: bold; color: #2563eb;');
console.log('%cAI-Powered Inventory Management System', 'font-size: 14px; color: #64748b;');
console.log('%cVersion 1.0.0', 'font-size: 12px; color: #94a3b8;');