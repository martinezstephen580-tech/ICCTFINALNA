// real-time-indicator.js
class RealTimeIndicator {
    constructor() {
        this.indicator = document.getElementById('real-time-indicator');
        this.init();
    }
    
    init() {
        if (!this.indicator) return;
        
        // Show indicator when updates happen
        window.addEventListener('storage', () => {
            this.show();
        });
        
        // Listen for custom update events
        document.addEventListener('eventUpdated', () => {
            this.show();
        });
        
        // Show initially if updates are active
        setTimeout(() => {
            if (window.realTimeUpdates) {
                this.show();
            }
        }, 2000);
    }
    
    show() {
        if (!this.indicator) return;
        
        this.indicator.style.display = 'flex';
        this.indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> <span>Updating Events...</span>';
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.indicator.innerHTML = '<i class="fas fa-circle"></i> <span>Live Updates Active</span>';
            this.indicator.style.animation = 'pulse 2s infinite';
        }, 1000);
    }
    
    hide() {
        if (this.indicator) {
            this.indicator.style.display = 'none';
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeIndicator = new RealTimeIndicator();
});