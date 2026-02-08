// Real-time Updates System
class RealTimeUpdates {
    constructor() {
        this.lastUpdateTime = localStorage.getItem('last_event_update') || 0;
        this.updateInterval = null;
        this.init();
    }
    
    init() {
        console.log("RealTimeUpdates initializing...");
        
        // Listen for storage changes (cross-tab updates)
        window.addEventListener('storage', (e) => {
            if (e.key === 'icct_events_updated') {
                console.log('Event update detected from another tab, refreshing...');
                this.refreshAllData();
            }
        });
        
        // Start polling for updates
        this.startPolling();
        
        // Initial check
        setTimeout(() => this.checkForUpdates(), 2000);
        
        console.log("RealTimeUpdates initialized");
    }
    
    startPolling() {
        // Stop any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Start new polling interval (every 15 seconds)
        this.updateInterval = setInterval(() => {
            this.checkForUpdates();
        }, 15000);
    }
    
    async checkForUpdates() {
        try {
            const lastUpdate = localStorage.getItem('last_event_update') || 0;
            const currentTime = Date.now();
            
            // Check if we should refresh (if more than 10 seconds since last update)
            if (currentTime - lastUpdate > 10000) {
                await this.refreshAllData();
                localStorage.setItem('last_event_update', currentTime);
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }
    
    async refreshAllData() {
        console.log('Refreshing all data...');
        
        // Refresh events
        if (window.eventManager) {
            await window.eventManager.refreshEvents();
        }
        
        // Refresh user dashboard if logged in
        if (window.userSystem && window.userSystem.isUserLoggedIn()) {
            await window.userSystem.updateDashboard();
        }
        
        // Refresh cart
        if (window.eventCart) {
            window.eventCart.updateCartDisplay();
        }
        
        // Refresh admin panel if open
        if (window.adminPanel && window.adminPanel.isAdminPage) {
            await window.adminPanel.loadInitialData();
        }
        
        // Update QR count
        if (window.qrGenerator) {
            window.qrGenerator.updateQRCount();
        }
    }
    
    // Manually trigger an update
    triggerUpdate() {
        localStorage.setItem('icct_events_updated', Date.now().toString());
        this.refreshAllData();
    }
    
    // Stop polling (when needed)
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Initialize real-time updates
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeUpdates = new RealTimeUpdates();
});

// Global function to trigger manual update
window.triggerRealTimeUpdate = function() {
    if (window.realTimeUpdates) {
        window.realTimeUpdates.triggerUpdate();
    }
};