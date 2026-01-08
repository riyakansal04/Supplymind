// ============================================
// auth.js - Authentication Module
// Save this as: frontend/auth.js
// ============================================

// Check if user is logged in on page load
function checkAuth() {
    console.log('Checking authentication...');
    const user = getUser();
    if (user) {
        console.log('User found:', user.email);
        showMainApp(user);
    } else {
        console.log('No user found, showing login');
        showLogin();
    }
}

function showLogin() {
    console.log('Showing login page');
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'none';
}

function showRegister() {
    console.log('Showing register page');
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp(user) {
    console.log('Showing main app for:', user.email);
    
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'flex';
    
    // Set user info
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    
    // Setup navigation
    setupNavigation();
    
    // Load dashboard after a short delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Loading dashboard...');
        loadDashboard();
    }, 200);
}

// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            
            console.log('Login attempt:', email);
            
            // Check if user exists in localStorage
            const storedUser = getUserByEmail(email);
            
            if (storedUser && storedUser.password === password) {
                // User exists, login with existing data
                console.log('User authenticated, restoring session');
                saveUser(storedUser);
                showMainApp(storedUser);
                showNotification('Welcome back! Your data has been restored.', 'success');
            } else if (storedUser) {
                // User exists but wrong password
                showNotification('Incorrect password. Please try again.', 'error');
            } else {
                // New user, create account
                console.log('New user, creating account');
                const user = {
                    name: email.split('@')[0], // Use email prefix as name
                    email: email,
                    password: password,
                    store: 'My Store',
                    createdAt: new Date().toISOString()
                };
                
                saveUserAccount(user);
                saveUser(user);
                showMainApp(user);
                showNotification('Account created! Welcome to SupplyMind.', 'success');
            }
        });
    }
});

// Register Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const name = formData.get('name');
            const email = formData.get('email');
            const password = formData.get('password');
            const store_name = formData.get('store_name');
            
            console.log('Registration attempt:', email);
            
            // Check if user already exists
            const existingUser = getUserByEmail(email);
            
            if (existingUser) {
                showNotification('Email already registered. Please login instead.', 'error');
                return;
            }
            
            // Create new user
            const user = {
                name: name,
                email: email,
                password: password,
                store: store_name,
                createdAt: new Date().toISOString()
            };
            
            saveUserAccount(user);
            saveUser(user);
            showMainApp(user);
            showNotification('Account created successfully! Welcome to SupplyMind.', 'success');
        });
    }
});

// Logout
function logout() {
    if (confirm('Are you sure you want to logout? Your data will be saved.')) {
        console.log('User logging out');
        clearCurrentSession();
        showLogin();
        showNotification('Logged out successfully. Your data is safe!', 'info');
    }
}

// Local Storage Helpers for User Session
function saveUser(user) {
    // Save current session
    localStorage.setItem('supplymind_current_user', JSON.stringify(user));
    console.log('Current session saved for:', user.email);
}

function getUser() {
    // Get current session
    const user = localStorage.getItem('supplymind_current_user');
    return user ? JSON.parse(user) : null;
}

function clearCurrentSession() {
    // Clear only current session, keep user accounts
    localStorage.removeItem('supplymind_current_user');
}

// Local Storage Helpers for User Accounts (with data persistence)
function saveUserAccount(user) {
    // Get all accounts
    let accounts = getAllAccounts();
    
    // Check if account exists
    const index = accounts.findIndex(acc => acc.email === user.email);
    
    if (index >= 0) {
        // Update existing account
        accounts[index] = { ...accounts[index], ...user };
    } else {
        // Add new account
        accounts.push(user);
    }
    
    // Save back to localStorage
    localStorage.setItem('supplymind_accounts', JSON.stringify(accounts));
    console.log('Account saved:', user.email);
}

function getUserByEmail(email) {
    const accounts = getAllAccounts();
    return accounts.find(acc => acc.email === email);
}

function getAllAccounts() {
    const accounts = localStorage.getItem('supplymind_accounts');
    return accounts ? JSON.parse(accounts) : [];
}

// Data persistence helpers (associate data with user email)
function saveUserData(dataKey, data) {
    const user = getUser();
    if (!user) return;
    
    const key = `${user.email}_${dataKey}`;
    localStorage.setItem(key, JSON.stringify(data));
    console.log('Data saved for user:', user.email, 'key:', dataKey);
}

function getUserData(dataKey) {
    const user = getUser();
    if (!user) return null;
    
    const key = `${user.email}_${dataKey}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Export functions for use in other modules
window.saveUserData = saveUserData;
window.getUserData = getUserData;

console.log('✅ Authentication module loaded with data persistence');