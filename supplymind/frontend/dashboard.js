// Dashboard functionality
let categoryChart = null;

async function loadDashboard() {
    try {
        // Load stats
        const statsResult = await apiCall('/stats');
        updateStats(statsResult.stats);
        
        // Load products for charts
        const productsResult = await apiCall('/products');
        allProducts = productsResult.products;
        
        // Load alerts count
        const alertsResult = await apiCall('/alerts');
        document.getElementById('alertCount').textContent = alertsResult.alerts.length;
        
        // Update charts
        updateCategoryChart();
        updateLowStockList();
        
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

function updateStats(stats) {
    document.getElementById('totalProducts').textContent = stats.total_products || 0;
    document.getElementById('inventoryValue').textContent = formatCurrency(stats.inventory_value || 0);
    document.getElementById('activeAlerts').textContent = stats.active_alerts || 0;
    document.getElementById('monthlyRevenue').textContent = formatCurrency(stats.monthly_revenue || 0);
}

function updateCategoryChart() {
    if (!allProducts.length) return;
    
    // Aggregate by category
    const categoryData = {};
    allProducts.forEach(p => {
        if (!categoryData[p.category]) {
            categoryData[p.category] = 0;
        }
        categoryData[p.category] += p.current_quantity;
    });
    
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    
    const ctx = document.getElementById('categoryChart');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Stock Quantity',
                data: data,
                backgroundColor: [
                    '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
                    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
                    '#06b6d4', '#84cc16'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateLowStockList() {
    const container = document.getElementById('lowStockList');
    
    // Filter low stock products
    const lowStock = allProducts
        .filter(p => p.current_quantity <= p.reorder_level)
        .sort((a, b) => a.current_quantity - b.current_quantity)
        .slice(0, 10);
    
    if (lowStock.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#6b7280;padding:20px;">All products are adequately stocked! 🎉</p>';
        return;
    }
    
    container.innerHTML = lowStock.map(p => `
        <div class="low-stock-item">
            <div>
                <strong>${p.product_name}</strong>
                <div style="font-size:12px;color:#6b7280;">${p.brand} • ${p.category}</div>
            </div>
            <div style="text-align:right;">
                <div class="stock-badge stock-low">${p.current_quantity} units</div>
                <div style="font-size:11px;color:#6b7280;margin-top:4px;">
                    Reorder: ${p.reorder_level}
                </div>
            </div>
        </div>
    `).join('');
}