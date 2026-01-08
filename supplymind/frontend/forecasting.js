// Forecasting functionality - FIXED
let forecastChart = null;

async function loadForecasting() {
    try {
        const result = await apiCall('/products');
        allProducts = result.products;
        populateForecastSelector();
    } catch (error) {
        console.error('Forecasting load error:', error);
    }
}

function populateForecastSelector() {
    const select = document.getElementById('forecastProductSelect');
    select.innerHTML = '<option value="">Select a product...</option>';
    
    allProducts.forEach(p => {
        const option = document.createElement('option');
        option.value = p.product_id;
        option.textContent = `${p.product_name} (${p.brand})`;
        select.appendChild(option);
    });
}

async function generateForecast() {
    const productId = document.getElementById('forecastProductSelect').value;
    
    if (!productId) {
        showNotification('Please select a product', 'error');
        return;
    }
    
    showLoading('Training AI model... Please wait 30-60 seconds.');
    
    try {
        const result = await apiCall(`/forecast/${productId}`, 'POST', {days: 30});
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        displayForecastResults(result);
        showNotification('Forecast generated successfully!', 'success');
        
    } catch (error) {
        console.error('Forecast error:', error);
        showNotification(`Forecast failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function displayForecastResults(result) {
    const resultsDiv = document.getElementById('forecastResults');
    resultsDiv.style.display = 'block';
    
    // Scroll to results smoothly
    setTimeout(() => {
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Display chart
    displayForecastChart(result.forecast);
    
    // Display recommendations
    displayRecommendations(result.recommendations || []);
}

function displayForecastChart(forecast) {
    const canvas = document.getElementById('forecastChart');
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (forecastChart) {
        forecastChart.destroy();
        forecastChart = null;
    }
    
    if (!forecast || forecast.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Inter';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('No forecast data available', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const labels = forecast.map(f => {
        const date = new Date(f.date);
        return date.toLocaleDateString('en-IN', {month: 'short', day: 'numeric'});
    });
    
    const demandData = forecast.map(f => f.demand);
    const lowerData = forecast.map(f => f.lower);
    const upperData = forecast.map(f => f.upper);
    
    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Predicted Demand',
                    data: demandData,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#7c3aed'
                },
                {
                    label: 'Lower Bound',
                    data: lowerData,
                    borderColor: '#10b981',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Upper Bound',
                    data: upperData,
                    borderColor: '#ef4444',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        padding: 20,
                        font: {
                            size: 13,
                            family: 'Inter',
                            weight: '600'
                        },
                        usePointStyle: true,
                        boxWidth: 8,
                        boxHeight: 8
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 13,
                        family: 'Inter',
                        weight: '600'
                    },
                    bodyFont: {
                        size: 12,
                        family: 'Inter'
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += Math.round(context.parsed.y * 100) / 100;
                            label += ' units';
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Units Demanded',
                        font: {
                            size: 13,
                            family: 'Inter',
                            weight: '600'
                        },
                        color: '#64748b'
                    },
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Inter'
                        },
                        color: '#64748b',
                        callback: function(value) {
                            return Math.round(value);
                        }
                    },
                    grid: {
                        color: '#f1f5f9',
                        drawBorder: false
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Forecast Period (30 Days)',
                        font: {
                            size: 13,
                            family: 'Inter',
                            weight: '600'
                        },
                        color: '#64748b'
                    },
                    ticks: {
                        font: {
                            size: 11,
                            family: 'Inter'
                        },
                        color: '#64748b',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationsList');
    
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <div style="font-size:48px;margin-bottom:16px;">✅</div>
                <h4 style="color:#64748b;margin-bottom:8px;font-size:16px;">Stock Levels Optimal</h4>
                <p style="color:#94a3b8;font-size:14px;">No immediate action required based on current forecast</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendations.map(rec => {
        const priorityColors = {
            high: {bg: '#fee2e2', border: '#ef4444', text: '#991b1b'},
            medium: {bg: '#fef3c7', border: '#f59e0b', text: '#92400e'},
            low: {bg: '#d1fae5', border: '#10b981', text: '#065f46'}
        };
        
        const colors = priorityColors[rec.priority] || priorityColors.medium;
        
        return `
            <div class="recommendation-card" style="
                background: white;
                border-left: 4px solid ${colors.border};
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                margin-bottom: 16px;
            ">
                <div style="display:flex;align-items:start;gap:16px;">
                    <div style="font-size:32px;">${rec.icon}</div>
                    <div style="flex:1;">
                        <div style="
                            display:inline-block;
                            background:${colors.bg};
                            color:${colors.text};
                            padding:4px 12px;
                            border-radius:6px;
                            font-size:11px;
                            font-weight:700;
                            text-transform:uppercase;
                            letter-spacing:0.5px;
                            margin-bottom:12px;
                        ">
                            ${rec.priority} Priority
                        </div>
                        <div style="
                            color:#1e293b;
                            font-size:15px;
                            line-height:1.6;
                            margin-bottom:12px;
                            font-weight:500;
                        ">${rec.message}</div>
                        <div style="
                            padding:16px;
                            background:#f8fafc;
                            border-radius:8px;
                            color:#334155;
                            font-size:14px;
                            line-height:1.6;
                            border:1px solid #e2e8f0;
                        ">
                            <strong style="color:#7c3aed;">💡 Recommended Action:</strong><br>
                            ${rec.action.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}