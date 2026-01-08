// Alerts functionality
async function loadAlerts() {
    try {
        const result = await apiCall('/alerts');
        allAlerts = result.alerts;
        displayAlerts(allAlerts);
    } catch (error) {
        console.error('Alerts load error:', error);
    }
}

function displayAlerts(alerts) {
    const container = document.getElementById('alertsContainer');
    
    if (!alerts || alerts.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px;">
                <div style="font-size:64px;margin-bottom:16px;">✅</div>
                <h3 style="color:#6b7280;margin-bottom:8px;">No Active Alerts</h3>
                <p style="color:#9ca3af;">Your inventory is in good shape!</p>
                <button class="btn-primary" onclick="analyzeInventory()" style="margin-top:20px;">
                    🔍 Run Analysis
                </button>
            </div>
        `;
        return;
    }
    
    // Sort by severity
    const severityOrder = {critical: 0, warning: 1, info: 2};
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    container.innerHTML = alerts.map(alert => {
        const severityColors = {
            critical: {bg: '#fee2e2', border: '#ef4444', icon: '🚨'},
            warning: {bg: '#fef3c7', border: '#f59e0b', icon: '⚠️'},
            info: {bg: '#dbeafe', border: '#4f46e5', icon: 'ℹ️'}
        };
        
        const colors = severityColors[alert.severity];
        
        return `
            <div class="alert-card alert-${alert.severity}">
                <div style="display:flex;justify-content:space-between;align-items:start;">
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                            <span style="font-size:24px;">${colors.icon}</span>
                            <div>
                                <div style="font-weight:600;font-size:18px;margin-bottom:4px;">
                                    ${alert.product_name}
                                </div>
                                <div style="font-size:12px;color:#6b7280;">
                                    ${alert.category} • ${new Date(alert.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        
                        <div style="background:${colors.bg};padding:12px;border-radius:6px;margin-bottom:12px;">
                            <strong>${alert.message}</strong>
                        </div>
                        
                        ${alert.recommendation ? `
                            <div style="padding:12px;background:#f3f4f6;border-radius:6px;border-left:3px solid ${colors.border};">
                                💡 <strong>Recommendation:</strong> ${alert.recommendation}
                            </div>
                        ` : ''}
                        
                        <div style="margin-top:12px;font-size:12px;color:#6b7280;">
                            Current Stock: <strong>${alert.current_quantity || 0} units</strong>
                        </div>
                    </div>
                    
                    <button class="action-btn" onclick="resolveAlert(${alert.alert_id})" 
                            style="background:#10b981;color:white;margin-left:16px;">
                        ✓ Resolve
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    // Update alert count in sidebar
    document.getElementById('alertCount').textContent = alerts.length;
}

async function resolveAlert(alertId) {
    if (!confirm('Mark this alert as resolved?')) {
        return;
    }
    
    showLoading('Resolving alert...');
    
    try {
        await apiCall(`/alerts/${alertId}/resolve`, 'POST');
        showNotification('Alert resolved!', 'success');
        loadAlerts();
        loadDashboard();
    } catch (error) {
        console.error(error);
    } finally {
        hideLoading();
    }
}