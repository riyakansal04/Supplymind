// Supplier Management Module
let allSuppliers = [];

async function loadSuppliers() {
    try {
        const result = await apiCall('/suppliers');
        allSuppliers = result.suppliers;
        displaySuppliers(allSuppliers);
        setupSupplierSearch();
    } catch (error) {
        console.error('Suppliers load error:', error);
    }
}

function displaySuppliers(suppliers) {
    const grid = document.getElementById('suppliersGrid');
    
    if (!suppliers || suppliers.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center;padding:60px;grid-column:1/-1;">
                <div style="font-size:64px;margin-bottom:16px;">🏢</div>
                <h3 style="color:#6b7280;margin-bottom:8px;">No Suppliers Yet</h3>
                <p style="color:#9ca3af;margin-bottom:20px;">Add your first supplier to get started</p>
                <button class="btn-primary" onclick="showAddSupplierModal()">
                    ➕ Add Supplier
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = suppliers.map(supplier => `
        <div class="supplier-card">
            <div class="supplier-header">
                <div class="supplier-icon">🏢</div>
                <div class="supplier-title">
                    <h3>${supplier.supplier_name}</h3>
                    <p>${supplier.contact_person || 'No contact person'}</p>
                </div>
            </div>
            
            <div class="supplier-details">
                ${supplier.phone ? `
                    <div class="detail-row">
                        <span class="detail-icon">📞</span>
                        <span>${supplier.phone}</span>
                    </div>
                ` : ''}
                
                ${supplier.email ? `
                    <div class="detail-row">
                        <span class="detail-icon">✉️</span>
                        <span>${supplier.email}</span>
                    </div>
                ` : ''}
                
                ${supplier.address ? `
                    <div class="detail-row">
                        <span class="detail-icon">📍</span>
                        <span>${supplier.address}</span>
                    </div>
                ` : ''}
                
                ${supplier.payment_terms ? `
                    <div class="detail-row">
                        <span class="detail-icon">💳</span>
                        <span>${supplier.payment_terms}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="supplier-footer">
                <small>Added: ${new Date(supplier.created_at).toLocaleDateString('en-IN')}</small>
            </div>
        </div>
    `).join('');
}

function setupSupplierSearch() {
    const searchInput = document.getElementById('searchSuppliers');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allSuppliers.filter(s => 
            s.supplier_name.toLowerCase().includes(query) ||
            (s.contact_person && s.contact_person.toLowerCase().includes(query)) ||
            (s.email && s.email.toLowerCase().includes(query))
        );
        displaySuppliers(filtered);
    });
}

function showAddSupplierModal() {
    document.getElementById('addSupplierModal').classList.add('active');
}

// Add supplier form handler
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addSupplierForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
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
});