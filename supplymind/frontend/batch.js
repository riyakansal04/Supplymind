// Batch Operations Module - NEW FEATURE

let batchOperations = [];

// Load batch history
async function loadBatchHistory() {
    const historyDiv = document.getElementById('batchHistory');
    
    if (batchOperations.length === 0) {
        historyDiv.innerHTML = '<p style="padding:20px;color:var(--gray);text-align:center;">No batch operations performed yet.</p>';
        return;
    }
    
    historyDiv.innerHTML = batchOperations.map(op => `
        <div style="padding:16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <div>
                <strong style="color:var(--dark);">${op.type}</strong>
                <p style="font-size:13px;color:var(--gray);margin-top:4px;">${op.description}</p>
                <p style="font-size:12px;color:var(--gray);margin-top:4px;">${new Date(op.timestamp).toLocaleString()}</p>
            </div>
            <div style="text-align:right;">
                <span class="stock-badge ${op.success ? 'stock-normal' : 'stock-low'}">
                    ${op.success ? 'Success' : 'Failed'}
                </span>
                <p style="font-size:13px;color:var(--dark);margin-top:4px;font-weight:600;">
                    ${op.affected} items affected
                </p>
            </div>
        </div>
    `).join('');
}

// Batch Update Prices
async function batchUpdatePrices() {
    const category = prompt('Enter category to update (leave empty for all):');
    const percentage = prompt('Enter percentage change (e.g., 10 for 10% increase, -10 for 10% decrease):');
    
    if (!percentage || isNaN(percentage)) {
        showNotification('Invalid percentage value', 'error');
        return;
    }
    
    const change = parseFloat(percentage) / 100;
    
    if (!confirm(`This will ${change > 0 ? 'increase' : 'decrease'} prices by ${Math.abs(percentage)}% ${category ? 'for ' + category : 'for all products'}. Continue?`)) {
        return;
    }
    
    showLoading('Updating prices...');
    
    try {
        const result = await apiCall('/products');
        let productsToUpdate = result.products;
        
        // Filter by category if specified
        if (category) {
            productsToUpdate = productsToUpdate.filter(p => 
                p.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        if (productsToUpdate.length === 0) {
            showNotification('No products found matching criteria', 'error');
            hideLoading();
            return;
        }
        
        // Update each product
        let successCount = 0;
        for (const product of productsToUpdate) {
            const newPrice = product.selling_price * (1 + change);
            
            try {
                await apiCall(`/products/${product.product_id}/update`, 'PUT', {
                    selling_price: newPrice.toFixed(2)
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to update ${product.product_name}:`, error);
            }
        }
        
        // Log operation
        batchOperations.push({
            type: 'Price Update',
            description: `Updated prices by ${percentage}% ${category ? 'for ' + category : 'for all products'}`,
            affected: successCount,
            success: true,
            timestamp: new Date().toISOString()
        });
        
        showNotification(`Successfully updated ${successCount} products!`, 'success');
        loadBatchHistory();
        loadInventory();
        loadDashboard();
        
    } catch (error) {
        batchOperations.push({
            type: 'Price Update',
            description: `Failed to update prices`,
            affected: 0,
            success: false,
            timestamp: new Date().toISOString()
        });
        console.error('Batch update error:', error);
    } finally {
        hideLoading();
    }
}

// Batch Adjust Stock
async function batchAdjustStock() {
    const category = prompt('Enter category to adjust (leave empty for all):');
    const action = prompt('Enter "add" or "remove":');
    const quantity = prompt('Enter quantity:');
    
    if (!action || !['add', 'remove'].includes(action.toLowerCase())) {
        showNotification('Invalid action. Use "add" or "remove"', 'error');
        return;
    }
    
    if (!quantity || isNaN(quantity)) {
        showNotification('Invalid quantity', 'error');
        return;
    }
    
    const qty = parseInt(quantity);
    const isAdd = action.toLowerCase() === 'add';
    
    if (!confirm(`This will ${isAdd ? 'add' : 'remove'} ${qty} units ${category ? 'for ' + category : 'for all products'}. Continue?`)) {
        return;
    }
    
    showLoading(`${isAdd ? 'Adding' : 'Removing'} stock...`);
    
    try {
        const result = await apiCall('/products');
        let productsToUpdate = result.products;
        
        // Filter by category if specified
        if (category) {
            productsToUpdate = productsToUpdate.filter(p => 
                p.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        if (productsToUpdate.length === 0) {
            showNotification('No products found matching criteria', 'error');
            hideLoading();
            return;
        }
        
        // Update each product
        let successCount = 0;
        for (const product of productsToUpdate) {
            try {
                if (isAdd) {
                    await apiCall(`/products/${product.product_id}/purchase`, 'POST', {
                        quantity: qty,
                        notes: 'Batch stock addition'
                    });
                } else {
                    await apiCall(`/products/${product.product_id}/sale`, 'POST', {
                        quantity: qty
                    });
                }
                successCount++;
            } catch (error) {
                console.error(`Failed to update ${product.product_name}:`, error);
            }
        }
        
        // Log operation
        batchOperations.push({
            type: 'Stock Adjustment',
            description: `${isAdd ? 'Added' : 'Removed'} ${qty} units ${category ? 'for ' + category : 'for all products'}`,
            affected: successCount,
            success: true,
            timestamp: new Date().toISOString()
        });
        
        showNotification(`Successfully updated ${successCount} products!`, 'success');
        loadBatchHistory();
        loadInventory();
        loadDashboard();
        
    } catch (error) {
        batchOperations.push({
            type: 'Stock Adjustment',
            description: `Failed to adjust stock`,
            affected: 0,
            success: false,
            timestamp: new Date().toISOString()
        });
        console.error('Batch adjustment error:', error);
    } finally {
        hideLoading();
    }
}

// Batch Apply Discount
async function batchApplyDiscount() {
    const category = prompt('Enter category to apply discount (required):');
    
    if (!category) {
        showNotification('Category is required', 'error');
        return;
    }
    
    const discount = prompt('Enter discount percentage (e.g., 20 for 20% off):');
    
    if (!discount || isNaN(discount)) {
        showNotification('Invalid discount percentage', 'error');
        return;
    }
    
    const discountPercent = parseFloat(discount);
    
    if (discountPercent <= 0 || discountPercent > 100) {
        showNotification('Discount must be between 0 and 100', 'error');
        return;
    }
    
    if (!confirm(`This will apply a ${discountPercent}% discount to all ${category} products. Continue?`)) {
        return;
    }
    
    showLoading('Applying discount...');
    
    try {
        const result = await apiCall('/products');
        const productsToUpdate = result.products.filter(p => 
            p.category.toLowerCase() === category.toLowerCase()
        );
        
        if (productsToUpdate.length === 0) {
            showNotification(`No products found in ${category} category`, 'error');
            hideLoading();
            return;
        }
        
        // Apply discount
        let successCount = 0;
        for (const product of productsToUpdate) {
            const discountedPrice = product.selling_price * (1 - discountPercent / 100);
            
            try {
                await apiCall(`/products/${product.product_id}/update`, 'PUT', {
                    selling_price: discountedPrice.toFixed(2)
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to update ${product.product_name}:`, error);
            }
        }
        
        // Log operation
        batchOperations.push({
            type: 'Apply Discount',
            description: `Applied ${discountPercent}% discount to ${category}`,
            affected: successCount,
            success: true,
            timestamp: new Date().toISOString()
        });
        
        showNotification(`Successfully applied discount to ${successCount} products!`, 'success');
        loadBatchHistory();
        loadInventory();
        loadDashboard();
        
    } catch (error) {
        batchOperations.push({
            type: 'Apply Discount',
            description: `Failed to apply discount`,
            affected: 0,
            success: false,
            timestamp: new Date().toISOString()
        });
        console.error('Batch discount error:', error);
    } finally {
        hideLoading();
    }
}

// Batch Delete Products
async function batchDeleteProducts() {
    const category = prompt('Enter category to delete products from:');
    
    if (!category) {
        showNotification('Category is required', 'error');
        return;
    }
    
    const condition = prompt('Delete products with stock below (enter number):');
    
    if (!condition || isNaN(condition)) {
        showNotification('Invalid stock level', 'error');
        return;
    }
    
    const stockThreshold = parseInt(condition);
    
    if (!confirm(`⚠️ WARNING: This will PERMANENTLY delete all ${category} products with stock below ${stockThreshold} units. This cannot be undone. Continue?`)) {
        return;
    }
    
    showLoading('Deleting products...');
    
    try {
        const result = await apiCall('/products');
        const productsToDelete = result.products.filter(p => 
            p.category.toLowerCase() === category.toLowerCase() &&
            p.current_quantity < stockThreshold
        );
        
        if (productsToDelete.length === 0) {
            showNotification(`No products found matching criteria`, 'info');
            hideLoading();
            return;
        }
        
        // Show final confirmation with exact count
        if (!confirm(`Found ${productsToDelete.length} products to delete. Proceed?`)) {
            hideLoading();
            return;
        }
        
        // Delete each product
        let successCount = 0;
        for (const product of productsToDelete) {
            try {
                await apiCall(`/products/${product.product_id}`, 'DELETE');
                successCount++;
            } catch (error) {
                console.error(`Failed to delete ${product.product_name}:`, error);
            }
        }
        
        // Log operation
        batchOperations.push({
            type: 'Delete Products',
            description: `Deleted ${category} products with stock below ${stockThreshold}`,
            affected: successCount,
            success: true,
            timestamp: new Date().toISOString()
        });
        
        showNotification(`Successfully deleted ${successCount} products!`, 'success');
        loadBatchHistory();
        loadInventory();
        loadDashboard();
        
    } catch (error) {
        batchOperations.push({
            type: 'Delete Products',
            description: `Failed to delete products`,
            affected: 0,
            success: false,
            timestamp: new Date().toISOString()
        });
        console.error('Batch delete error:', error);
    } finally {
        hideLoading();
    }
}

// Load batch view
function loadBatchView() {
    loadBatchHistory();
}