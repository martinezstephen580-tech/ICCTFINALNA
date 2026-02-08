// Shopping Cart Equivalent for Event Registration with Firebase
class EventCart {
    constructor() {
        this.cartItems = [];
        
        // DOM Elements
        this.cartCount = document.getElementById('cart-count');
        this.eventCart = document.getElementById('event-cart');
        this.checkoutBtn = document.getElementById('checkout-btn');
        this.clearCartBtn = document.getElementById('clear-cart-btn');
        
        // Initialize setup
        this.init();
    }
    
    async init() {
        // Load data first
        this.loadCart();
        // Set up interactions
        this.setupEventListeners();
        // Draw the UI
        this.updateCartDisplay();
        console.log("Event Cart Initialized");
    }
    
    setupEventListeners() {
        // Use optional chaining to prevent errors if buttons are missing on certain pages
        this.clearCartBtn?.addEventListener('click', () => this.clearCart());
        this.checkoutBtn?.addEventListener('click', () => this.checkout());
    }
    
    // Add event to cart
    async addToCart(eventId) {
        // Safety check for userSystem
        if (!window.userSystem || !window.userSystem.isUserLoggedIn()) {
            alert('Please login to add events to your cart');
            window.userSystem?.openAuthModal('login');
            return;
        }

        // Safety check for DB
        if (!window.db) {
            console.error("Database not initialized");
            alert('Database not available. Please try again.');
            return;
        }
        
        try {
            // Get event data
            const event = await window.db.read('events', eventId);
            
            if (!event) {
                alert('Event not found');
                return;
            }
            
            if (this.cartItems.find(item => item.id === eventId)) {
                alert('Event already in cart');
                return;
            }
            
            // Check if event is full
            if (event.registered >= event.capacity) {
                alert('This event is already full');
                return;
            }
            
            // Add to cart
            this.cartItems.push({
                id: eventId,
                title: event.title,
                date: event.date,
                time: event.time,
                location: event.location,
                campus: event.campus,
                capacity: event.capacity,
                registered: event.registered || 0
            });
            
            this.saveCart();
            this.updateCartDisplay();
            this.showNotification(`Added "${event.title}" to cart`, 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Error adding event to cart. Please try again.');
        }
    }

    // This is the function main.js was looking for
    updateCartDisplay() {
        if (this.cartCount) {
            this.cartCount.textContent = this.cartItems.length;
        }
        
        if (this.checkoutBtn) {
            this.checkoutBtn.disabled = this.cartItems.length === 0;
            this.checkoutBtn.innerHTML = `<i class="fas fa-check-circle"></i> Register All (${this.cartItems.length})`;
        }
        
        this.renderCartItems();
    }

    // Required by main.js
    updateCartCount() {
        this.updateCartDisplay();
    }

    renderCartItems() {
        if (!this.eventCart) return;
        
        if (this.cartItems.length === 0) {
            this.eventCart.innerHTML = `
                <div class="empty-cart" style="text-align:center; padding: 20px;">
                    <i class="fas fa-shopping-cart fa-2x"></i>
                    <p>Your cart is empty</p>
                    <p class="note">Add events from the events section</p>
                </div>`;
            return;
        }
        
        let html = '<div class="cart-items-list">';
        this.cartItems.forEach(item => {
            const percentage = Math.round((item.registered / item.capacity) * 100);
            html += `
                <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:10px;">
                    <div class="cart-item-info" style="flex-grow: 1;">
                        <h5 style="margin:0; font-size: 14px;">${item.title}</h5>
                        <small style="color: #666;">${item.date} | ${item.campus}</small>
                        <div style="font-size: 12px; margin-top: 5px;">
                            <span class="capacity-indicator">${item.registered}/${item.capacity} (${percentage}%)</span>
                        </div>
                    </div>
                    <button class="btn-danger remove-from-cart" data-id="${item.id}" style="padding:5px 10px; font-size: 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>`;
        });
        html += '</div>';
        this.eventCart.innerHTML = html;
        
        this.eventCart.querySelectorAll('.remove-from-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                this.removeFromCart(id);
            });
        });
    }

    removeFromCart(eventId) {
        this.cartItems = this.cartItems.filter(item => item.id !== eventId);
        this.saveCart();
        this.updateCartDisplay();
        this.showNotification('Removed from cart', 'info');
    }

    saveCart() {
        const user = window.userSystem?.getCurrentUser();
        const key = user ? `cart_${user.id}` : 'cart_guest';
        localStorage.setItem(key, JSON.stringify(this.cartItems));
    }

    loadCart() {
        const user = window.userSystem?.getCurrentUser();
        const key = user ? `cart_${user.id}` : 'cart_guest';
        const saved = localStorage.getItem(key);
        this.cartItems = saved ? JSON.parse(saved) : [];
    }

    async checkout() {
        if (this.cartItems.length === 0) {
            alert('Your cart is empty');
            return;
        }

        if (!window.userSystem || !window.userSystem.isUserLoggedIn()) {
            alert('Please login to register for events');
            window.userSystem?.openAuthModal('login');
            return;
        }

        const user = window.userSystem.getCurrentUser();
        let successCount = 0;
        let failedCount = 0;

        for (const item of this.cartItems) {
            try {
                // Check if already registered
                const existingRegs = await window.db.readAll('registrations', {
                    userId: user.id,
                    eventId: item.id
                });

                if (existingRegs.length > 0) {
                    this.showNotification(`Already registered for "${item.title}"`, 'warning');
                    continue;
                }

                // Create registration
                const registration = {
                    id: window.db.generateId(),
                    userId: user.id,
                    eventId: item.id,
                    studentId: user.studentId,
                    studentName: user.name,
                    campus: user.campus,
                    registeredAt: new Date().toISOString(),
                    status: 'registered'
                };

                await window.db.create('registrations', registration);

                // Update event registration count
                const event = await window.db.read('events', item.id);
                if (event) {
                    await window.db.update('events', item.id, {
                        registered: (event.registered || 0) + 1
                    });
                }

                successCount++;
                this.showNotification(`Registered for "${item.title}"`, 'success');

            } catch (error) {
                console.error(`Error registering for event ${item.id}:`, error);
                failedCount++;
            }
        }

        // Clear cart after successful registration
        if (successCount > 0) {
            this.clearCart();
            this.showNotification(`Successfully registered for ${successCount} event(s)`, 'success');
            
            // Refresh dashboard
            if (window.userSystem) {
                window.userSystem.updateDashboard();
            }
        }

        if (failedCount > 0) {
            this.showNotification(`Failed to register for ${failedCount} event(s)`, 'error');
        }
    }

    clearCart() {
        if (this.cartItems.length === 0) {
            this.showNotification('Cart is already empty', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear your cart?')) {
            this.cartItems = [];
            this.saveCart();
            this.updateCartDisplay();
            this.showNotification('Cart cleared', 'info');
        }
    }

    showNotification(message, type = 'info') {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };

        // Remove existing notifications
        const existing = document.querySelectorAll('.cart-notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: ${colors[type]};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideInUp 0.3s ease;
            font-family: Arial, sans-serif;
            font-size: 14px;
            max-width: 300px;
        `;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' :
                              type === 'error' ? 'exclamation-circle' :
                              type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;
        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutDown 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
}

// Ensure the class is globally available
window.eventCart = new EventCart();