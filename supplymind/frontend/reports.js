// Reports Module

async function downloadReport(type) {
    showLoading(`Generating ${type} report...`);
    
    try {
        let data, filename;
        
        switch(type) {
            case 'inventory':
                data = await generateInventoryReport();
                filename = `inventory_report_${getDateString()}.csv`;
                break;
            case 'sales':
                data = await generateSalesReport();
                filename = `sales_report_${getDateString()}.csv`;
                break;
            case 'forecast':
                data = await generateForecastReport();
                filename = `forecast_report_${getDateString()}.csv`;
                break;
            case 'alerts':
                data = await generateAlertsReport();
                filename = `alerts_report_${getDateString()}.csv`;
                break;
        }
        
        if (data) {
            downloadCSV(data, filename);
            showNotification('Report downloaded successfully!', 'success');
        }
    } catch (error) {
        showNotification('Failed to generate report', 'error');
    } finally {
        hideLoading();
    }
}

async function generateInventoryReport() {
    const result = await apiCall('/products');
    const products = result.products;
    
    let csv = 'Product Name,Brand,Category,Current Stock,Purchase Price,Selling Price,Stock Status\n';
    
    products.forEach(p => {
        const status = p.current_quantity <= p.reorder_level ? 'Low' :
                      p.current_quantity >= p.max_stock_level * 0.8 ? 'High' : 'Normal';
        
        csv += `"${p.product_name}","${p.brand}","${p.category}",${p.current_quantity},${p.purchase_price},${p.selling_price},"${status}"\n`;
    });
    
    return csv;
}

async function generateSalesReport() {
    const result = await apiCall('/analytics/sales?days=30');
    const analytics = result.analytics;
    
    let csv = 'Product Name,Units Sold,Revenue\n';
    
    analytics.top_products.forEach(p => {
        csv += `"${p.product_name}",${p.quantity_sold},${p.revenue}\n`;
    });
    
    csv += `\nTotal Sales,${analytics.total_sales}\n`;
    csv += `Total Revenue,${analytics.total_revenue}\n`;
    csv += `Average Sale Value,${analytics.avg_sale_value}\n`;
    
    return csv;
}

async function generateForecastReport() {
    const products = allProducts;
    
    let csv = 'Product Name,Current Stock,30-Day Forecast,Status\n';
    
    for (const product of products) {
        try {
            const forecast = await apiCall(`/forecast/${product.product_id}`);
            const totalDemand = forecast.forecast.reduce((sum, f) => sum + f.predicted_demand, 0);
            const status = product.current_quantity >= totalDemand ? 'Sufficient' : 'Reorder Needed';
            
            csv += `"${product.product_name}",${product.current_quantity},${totalDemand.toFixed(2)},"${status}"\n`;
        } catch (e) {
            csv += `"${product.product_name}",${product.current_quantity},N/A,"No Data"\n`;
        }
    }
    
    return csv;
}

async function generateAlertsReport() {
    const result = await apiCall('/alerts');
    const alerts = result.alerts;
    
    let csv = 'Product Name,Alert Type,Severity,Message,Date\n';
    
    alerts.forEach(a => {
        const date = new Date(a.created_at).toLocaleDateString();
        csv += `"${a.product_name}","${a.alert_type}","${a.severity}","${a.message}","${date}"\n`;
    });
    
    return csv;
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function getDateString() {
    const now = new Date();
    return `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
}