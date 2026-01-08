// Sales Analytics Module
let dailySalesChart = null;
let categoryPerfChart = null;

async function loadAnalytics() {
    const days = parseInt(document.getElementById('analyticsTimeRange').value);
    
    showLoading('Loading analytics data...');
    
    try {
        const result = await apiCall(`/analytics/sales?days=${days}`);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        displayAnalytics(result.analytics);
        
    } catch (error) {
        console.error('Analytics load error:', error);
        showNotification('Failed to load analytics: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function displayAnalytics(analytics) {
    // Update summary stats
    document.getElementById('totalSalesUnits').textContent = 
        formatNumber(analytics.total_sales);
    document.getElementById('totalSalesRevenue').textContent = 
        formatCurrency(analytics.total_revenue);
    document.getElementById('avgSaleValue').textContent = 
        formatCurrency(analytics.avg_sale_value);
    
    // Display charts
    displayDailySalesChart(analytics.daily_sales);
    displayCategoryPerfChart(analytics.category_performance);
    displayTopProducts(analytics.top_products);
}

function displayDailySalesChart(dailySales) {
    const canvas = document.getElementById('dailySalesChart');
    const ctx = canvas.getContext('2d');
    
    if (dailySalesChart) {
        dailySalesChart.destroy();
        dailySalesChart = null;
    }
    
    if (!dailySales || dailySales.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        ctx.fillText('No sales data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const labels = dailySales.map(d => {
        const date = new Date(d.sale_date);
        return date.toLocaleDateString('en-IN', {month: 'short', day: 'numeric'});
    });
    
    const revenueData = dailySales.map(d => d.revenue);
    const quantityData = dailySales.map(d => d.quantity_sold);
    
    dailySalesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Revenue (₹)',
                    data: revenueData,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y',
                    fill: true
                },
                {
                    label: 'Units Sold',
                    data: quantityData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    yAxisID: 'y1',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.yAxisID === 'y') {
                                label += '₹' + context.parsed.y.toLocaleString('en-IN');
                            } else {
                                label += context.parsed.y + ' units';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenue (₹)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Units Sold'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function displayCategoryPerfChart(categoryPerf) {
    const canvas = document.getElementById('categoryPerfChart');
    const ctx = canvas.getContext('2d');
    
    if (categoryPerfChart) {
        categoryPerfChart.destroy();
        categoryPerfChart = null;
    }
    
    if (!categoryPerf || categoryPerf.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        ctx.fillText('No category data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const labels = categoryPerf.map(c => c.category);
    const revenueData = categoryPerf.map(c => c.revenue);
    
    const colors = [
        '#4f46e5', '#10b981', '#f59e0b', '#ef4444',
        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
        '#06b6d4', '#84cc16'
    ];
    
    categoryPerfChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: revenueData,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function displayTopProducts(topProducts) {
    const container = document.getElementById('topProductsList');
    
    if (!topProducts || topProducts.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#6b7280;padding:40px;">No sales data available yet.</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody>
                ${topProducts.map((product, index) => `
                    <tr>
                        <td>
                            <div style="width:30px;height:30px;border-radius:50%;background:${
                                index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : '#e5e7eb'
                            };display:flex;align-items:center;justify-content:center;font-weight:bold;">
                                ${index + 1}
                            </div>
                        </td>
                        <td>
                            <strong>${product.product_name}</strong>
                        </td>
                        <td>${formatNumber(product.quantity_sold)} units</td>
                        <td><strong>${formatCurrency(product.revenue)}</strong></td>
                        <td>
                            ${index < 3 ? '🔥' : index < 7 ? '📈' : '📊'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}