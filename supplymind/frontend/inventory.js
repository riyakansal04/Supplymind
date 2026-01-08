// Inventory management
async function loadInventory() {
    try {
        const result = await apiCall('/products');
        allProducts = result.products;
        displayProducts(allProducts);
        setupInventoryFilters();
    } catch (error) {
        console.error('Inventory load error:', error);
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('productsTable');
    
    if (!products.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#6b7280;">No products found. Click "Initialize Sample Data" or add products manually.</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(p => {
        const stockClass = p.current_quantity <= p.reorder_level ? 'stock-low' :
                          p.current_quantity >= p.max_stock_level * 0.8 ? 'stock-high' :
                          'stock-normal';
        
        return `
            <tr>
                <td>
                    <strong>${p.product_name}</strong>
                </td>
                <td>${p.brand}</td>
                <td>${p.category}</td>
                <td>
                    <span class="stock-badge ${stockClass}">
                        ${p.current_quantity} units
                    </span>
                </td>
                <td>${formatCurrency(p.purchase_price)}</td>
                <td>${formatCurrency(p.selling_price)}</td>
                <td>
                    <button class="action-btn" onclick="addStock(${p.product_id})" style="background:#10b981;color:white;">
                        ➕ Add Stock
                    </button>
                    <button class="action-btn" onclick="recordSale(${p.product_id})" style="background:#4f46e5;color:white;">
                        💰 Sale
                    </button>
                    <button class="action-btn" onclick="viewDetails(${p.product_id})" style="background:#6b7280;color:white;">
                        👁️ View
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function setupInventoryFilters() {
    // Search
    document.getElementById('searchProducts').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allProducts.filter(p => 
            p.product_name.toLowerCase().includes(query) ||
            p.brand.toLowerCase().includes(query)
        );
        displayProducts(filtered);
    });
    
    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        const category = e.target.value;
        const filtered = category ? allProducts.filter(p => p.category === category) : allProducts;
        displayProducts(filtered);
    });
}

async function addStock(productId) {
    const quantity = prompt('Enter quantity to add:');
    if (!quantity || isNaN(quantity)) return;
    
    showLoading('Adding stock...');
    
    try {
        await apiCall(`/products/${productId}/purchase`, 'POST', {
            quantity: parseInt(quantity),
            notes: 'Manual stock addition'
        });
        showNotification('Stock added successfully!', 'success');
        loadInventory();
        loadDashboard();
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function recordSale(productId) {
    const quantity = prompt('Enter quantity sold:');
    if (!quantity || isNaN(quantity)) return;
    
    showLoading('Recording sale...');
    
    try {
        await apiCall(`/products/${productId}/sale`, 'POST', {
            quantity: parseInt(quantity)
        });
        showNotification('Sale recorded successfully!', 'success');
        loadInventory();
        loadDashboard();
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}

async function viewDetails(productId) {
    const product = allProducts.find(p => p.product_id === productId);
    if (!product) return;
    
    const details = `
        Product: ${product.product_name}
        Brand: ${product.brand}
        Category: ${product.category}
        Current Stock: ${product.current_quantity}
        Reorder Level: ${product.reorder_level}
        Max Stock: ${product.max_stock_level}
        Purchase Price: ${formatCurrency(product.purchase_price)}
        Selling Price: ${formatCurrency(product.selling_price)}
    `;
    
    alert(details);
}