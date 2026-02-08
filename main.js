// main.js - Complete Event Management System with Real-time Updates (1100+ lines)
class EventManager {
    constructor() {
        console.log("EventManager initializing...");
        
        // DOM Elements
        this.eventsContainer = document.getElementById('events-container');
        this.totalEventsEl = document.getElementById('total-events');
        this.totalParticipantsEl = document.getElementById('total-participants');
        this.qrGeneratedEl = document.getElementById('qr-generated');
        
        // Event filters and controls
        this.searchInput = document.getElementById('event-search');
        this.searchBtn = document.getElementById('search-btn');
        this.advancedSearchBtn = document.getElementById('advanced-search-btn');
        this.searchCampus = document.getElementById('search-campus');
        this.searchCategory = document.getElementById('search-category');
        this.searchDate = document.getElementById('search-date');
        this.sortEvents = document.getElementById('sort-events');
        this.viewControls = document.querySelectorAll('.view-btn');
        
        // Campuses
        this.campusesGrid = document.querySelector('.campuses-grid');
        
        // State
        this.events = [];
        this.filteredEvents = [];
        this.currentPageEvents = [];
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.currentSearch = '';
        this.currentFilters = {};
        this.currentSort = 'date';
        this.currentView = 'grid';
        
        // Initialize
        this.init();
    }
    
    async init() {
        console.log("EventManager initializing...");
        
        // Wait for database to be ready
        if (!window.db || typeof window.db.readAll !== 'function') {
            console.log("Database not ready, retrying...");
            setTimeout(() => this.init(), 500);
            return;
        }
        
        // Load initial data
        await this.loadEvents();
        await this.loadCampuses();
        this.renderEvents();
        this.updateStats();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up periodic refresh for real-time updates
        this.setupRealTimeUpdates();
        
        console.log("EventManager initialized successfully");
    }
    
    setupEventListeners() {
        // Search button
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        // Enter key in search input
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        }
        
        // Advanced search
        if (this.advancedSearchBtn) {
            this.advancedSearchBtn.addEventListener('click', () => this.toggleAdvancedFilters());
        }
        
        // Filter changes
        if (this.searchCampus) {
            this.searchCampus.addEventListener('change', () => this.applyFilters());
        }
        if (this.searchCategory) {
            this.searchCategory.addEventListener('change', () => this.applyFilters());
        }
        if (this.searchDate) {
            this.searchDate.addEventListener('change', () => this.applyFilters());
        }
        if (this.sortEvents) {
            this.sortEvents.addEventListener('change', () => this.applySorting());
        }
        
        // View controls
        this.viewControls.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.closest('button').dataset.view;
                this.switchView(view);
            });
        });
        
        // Modal close functionality
        this.setupModalListeners();
    }
    
    setupModalListeners() {
        // Close modals when clicking outside
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        });
        
        // Close buttons
        const closeButtons = document.querySelectorAll('.close-modal');
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        
        // Tab functionality
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                
                // Update active tab button
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Update active content
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const content = document.getElementById(`${tabId}-tab`);
                if (content) content.classList.add('active');
            });
        });
    }
    
    async loadEvents() {
        try {
            console.log("Loading events from database...");
            
            // Get events from Firebase
            const events = await window.db.readAll('events');
            
            // Filter only upcoming events
            const today = new Date().toISOString().split('T')[0];
            const upcomingEvents = events.filter(event => {
                return event.date >= today || !event.date;
            });
            
            // Sort by date (upcoming first)
            this.events = upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
            this.filteredEvents = [...this.events];
            
            console.log(`Loaded ${this.events.length} upcoming events`);
            
            // Update pagination
            this.updatePagination();
            
        } catch (error) {
            console.error('Error loading events:', error);
            this.events = [];
            this.filteredEvents = [];
        }
    }
    
    async loadCampuses() {
        if (!this.campusesGrid) return;
        
        try {
            // Use campuses from events-data.js or load from database
            const campuses = window.campusesData || [
                {
                    id: 1,
                    name: "Cainta Campus",
                    location: "Cainta, Rizal",
                    programs: "All Programs",
                    contact: "(02) 1234-5678",
                    email: "cainta@icct.edu.ph"
                },
                {
                    id: 2,
                    name: "Antipolo Campus",
                    location: "Antipolo, Rizal",
                    programs: "Nursing, Education, Criminology",
                    contact: "(02) 3456-7890",
                    email: "antipolo@icct.edu.ph"
                },
                {
                    id: 3,
                    name: "San Mateo Campus",
                    location: "San Mateo, Rizal",
                    programs: "Maritime, Tourism, HRM",
                    contact: "(02) 4567-8901",
                    email: "sanmateo@icct.edu.ph"
                }
            ];
            
            this.renderCampuses(campuses);
            
        } catch (error) {
            console.error('Error loading campuses:', error);
        }
    }
    
    renderCampuses(campuses) {
        if (!this.campusesGrid) return;
        
        let html = '';
        campuses.forEach(campus => {
            html += `
                <div class="campus-card fade-in">
                    <div class="campus-header">
                        <h3>${campus.name}</h3>
                        <span class="campus-id">Campus #${campus.id}</span>
                    </div>
                    <div class="campus-content">
                        <p><i class="fas fa-map-marker-alt"></i> ${campus.location}</p>
                        <p><i class="fas fa-graduation-cap"></i> ${campus.programs}</p>
                        <p><i class="fas fa-phone"></i> ${campus.contact}</p>
                        <p><i class="fas fa-envelope"></i> ${campus.email}</p>
                    </div>
                    <div class="campus-actions">
                        <button class="btn-primary view-campus-events" data-campus="${campus.name}">
                            <i class="fas fa-calendar"></i> View Events
                        </button>
                        <button class="btn-secondary view-location">
                            <i class="fas fa-directions"></i> Get Directions
                        </button>
                    </div>
                </div>
            `;
        });
        
        this.campusesGrid.innerHTML = html;
        
        // Add campus event listeners
        this.addCampusEventListeners();
    }
    
    addCampusEventListeners() {
        // View campus events
        document.querySelectorAll('.view-campus-events').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const campus = e.target.closest('button').dataset.campus;
                this.filterByCampus(campus);
            });
        });
        
        // Get directions (placeholder)
        document.querySelectorAll('.view-location').forEach(btn => {
            btn.addEventListener('click', () => {
                alert('Directions feature would open maps integration');
            });
        });
    }
    
    renderEvents() {
        if (!this.eventsContainer) return;
        
        if (this.filteredEvents.length === 0) {
            this.eventsContainer.innerHTML = `
                <div class="no-events" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-calendar-times fa-3x" style="color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No upcoming events found</h3>
                    <p>Check back later for new events</p>
                    ${window.userSystem?.isUserLoggedIn() ? '' : '<p><a href="#user-login" class="btn-primary">Login to see more</a></p>'}
                </div>
            `;
            return;
        }
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        this.currentPageEvents = this.filteredEvents.slice(startIndex, endIndex);
        
        let html = '';
        this.currentPageEvents.forEach(event => {
            const percentage = event.capacity > 0 ? Math.round(((event.registered || 0) / event.capacity) * 100) : 0;
            const isFull = (event.registered || 0) >= event.capacity;
            const spotsLeft = event.capacity - (event.registered || 0);
            
            html += `
                <div class="event-card fade-in">
                    <div class="event-image">
                        <img src="${event.image || 'assets/images/events/default.jpg'}" 
                             alt="${event.title}" 
                             onerror="this.src='assets/images/events/default.jpg'">
                        <div class="event-category ${event.category}">${event.category}</div>
                        ${isFull ? '<div class="event-full-badge">FULL</div>' : ''}
                    </div>
                    <div class="event-content">
                        <div class="event-header">
                            <h3 class="event-title">${event.title}</h3>
                            <span class="event-campus">${event.campus}</span>
                        </div>
                        <div class="event-meta">
                            <span><i class="fas fa-calendar"></i> ${this.formatDate(event.date) || 'Date TBA'}</span>
                            <span><i class="fas fa-clock"></i> ${event.time || 'Time TBA'}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${event.location || 'Location TBA'}</span>
                        </div>
                        <p class="event-description">${this.truncateText(event.description || 'No description available', 120)}</p>
                        <div class="event-stats">
                            <div class="capacity-bar">
                                <div class="capacity-fill" style="width: ${percentage}%"></div>
                            </div>
                            <div class="capacity-info">
                                <span class="capacity-text">${event.registered || 0}/${event.capacity} (${percentage}%)</span>
                                ${!isFull ? `<span class="spots-left">${spotsLeft} spots left</span>` : ''}
                            </div>
                        </div>
                        <div class="event-actions">
                            <button class="btn-primary view-event" data-id="${event.id}">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            ${!isFull ? `
                                <button class="btn-secondary add-to-cart" data-id="${event.id}">
                                    <i class="fas fa-cart-plus"></i> Add to Cart
                                </button>
                            ` : `
                                <button class="btn-danger" disabled>
                                    <i class="fas fa-times"></i> Event Full
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        });
        
        this.eventsContainer.innerHTML = html;
        
        // Add event listeners
        this.addEventListeners();
    }
    
    addEventListeners() {
        // View event details
        document.querySelectorAll('.view-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.closest('button').dataset.id;
                this.showEventDetails(eventId);
            });
        });
        
        // Add to cart
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.target.closest('button').dataset.id;
                if (window.eventCart) {
                    window.eventCart.addToCart(eventId);
                }
            });
        });
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }
    
    performSearch() {
        this.currentSearch = this.searchInput ? this.searchInput.value.trim() : '';
        this.applyFilters();
    }
    
    async applyFilters() {
        try {
            // Build filters object
            this.currentFilters = {};
            
            if (this.searchCampus && this.searchCampus.value !== 'all') {
                this.currentFilters.campus = this.searchCampus.value;
            }
            
            if (this.searchCategory && this.searchCategory.value !== 'all') {
                this.currentFilters.category = this.searchCategory.value;
            }
            
            if (this.searchDate && this.searchDate.value) {
                this.currentFilters.date = this.searchDate.value;
            }
            
            // Start with all events
            let filtered = [...this.events];
            
            // Apply search term
            if (this.currentSearch) {
                filtered = filtered.filter(event => {
                    const searchableText = [
                        event.title || '',
                        event.description || '',
                        event.location || '',
                        event.speaker || '',
                        event.campus || ''
                    ].join(' ').toLowerCase();
                    
                    return searchableText.includes(this.currentSearch.toLowerCase());
                });
            }
            
            // Apply filters
            if (this.currentFilters.campus) {
                filtered = filtered.filter(event => event.campus === this.currentFilters.campus);
            }
            
            if (this.currentFilters.category) {
                filtered = filtered.filter(event => event.category === this.currentFilters.category);
            }
            
            if (this.currentFilters.date) {
                filtered = filtered.filter(event => event.date === this.currentFilters.date);
            }
            
            // Apply sorting
            filtered = this.sortEventsList(filtered, this.currentSort);
            
            this.filteredEvents = filtered;
            this.currentPage = 1; // Reset to first page
            this.renderEvents();
            this.updatePagination();
            
        } catch (error) {
            console.error('Error applying filters:', error);
        }
    }
    
    applySorting() {
        this.currentSort = this.sortEvents ? this.sortEvents.value : 'date';
        this.applyFilters();
    }
    
    sortEventsList(events, sortBy) {
        return [...events].sort((a, b) => {
            switch(sortBy) {
                case 'date':
                    return new Date(a.date) - new Date(b.date);
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'popularity':
                    const aPercent = ((a.registered || 0) / a.capacity) * 100;
                    const bPercent = ((b.registered || 0) / b.capacity) * 100;
                    return bPercent - aPercent;
                case 'name':
                    return (a.title || '').localeCompare(b.title || '');
                default:
                    return 0;
            }
        });
    }
    
    filterByCampus(campusName) {
        if (this.searchCampus) {
            this.searchCampus.value = campusName;
        }
        this.applyFilters();
        
        // Scroll to events section
        const eventsSection = document.getElementById('events');
        if (eventsSection) {
            eventsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    toggleAdvancedFilters() {
        const filters = document.querySelector('.search-filters');
        if (filters) {
            filters.classList.toggle('expanded');
            
            if (filters.classList.contains('expanded')) {
                this.advancedSearchBtn.innerHTML = '<i class="fas fa-times"></i> Hide Filters';
            } else {
                this.advancedSearchBtn.innerHTML = '<i class="fas fa-filter"></i> Advanced Filters';
            }
        }
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Update active button
        this.viewControls.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // Update events container class
        const eventsContainer = document.getElementById('events-container');
        if (eventsContainer) {
            eventsContainer.className = view === 'grid' ? 'events-grid' : 'events-list';
        }
        
        // Re-render events
        this.renderEvents();
    }
    
    async showEventDetails(eventId) {
        try {
            const event = await window.db.read('events', eventId);
            if (!event) {
                alert('Event not found');
                return;
            }
            
            const modal = document.getElementById('event-modal');
            const modalContent = document.getElementById('modal-content');
            const percentage = Math.round(((event.registered || 0) / event.capacity) * 100);
            const isFull = (event.registered || 0) >= event.capacity;
            const spotsLeft = event.capacity - (event.registered || 0);
            
            modalContent.innerHTML = `
                <div class="event-modal-content">
                    <div class="event-modal-header">
                        <div class="event-modal-image">
                            <img src="${event.image || 'assets/images/events/default.jpg'}" 
                                 alt="${event.title}"
                                 onerror="this.src='assets/images/events/default.jpg'">
                            ${isFull ? '<div class="event-full-overlay">FULLY BOOKED</div>' : ''}
                        </div>
                        <div class="event-modal-title">
                            <h2>${event.title}</h2>
                            <div class="event-modal-categories">
                                <span class="category-badge">${event.category}</span>
                                <span class="campus-badge">${event.campus}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="event-modal-body">
                        <div class="event-modal-details">
                            <div class="detail-section">
                                <h3><i class="fas fa-info-circle"></i> Event Details</h3>
                                <div class="details-grid">
                                    <div class="detail-item">
                                        <i class="fas fa-calendar"></i>
                                        <div>
                                            <strong>Date</strong>
                                            <p>${this.formatDate(event.date) || 'Date TBA'}</p>
                                        </div>
                                    </div>
                                    <div class="detail-item">
                                        <i class="fas fa-clock"></i>
                                        <div>
                                            <strong>Time</strong>
                                            <p>${event.time || 'Time TBA'}</p>
                                        </div>
                                    </div>
                                    <div class="detail-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <div>
                                            <strong>Location</strong>
                                            <p>${event.location || 'Location TBA'}</p>
                                        </div>
                                    </div>
                                    ${event.speaker ? `
                                    <div class="detail-item">
                                        <i class="fas fa-user"></i>
                                        <div>
                                            <strong>Speaker</strong>
                                            <p>${event.speaker}</p>
                                        </div>
                                    </div>` : ''}
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h3><i class="fas fa-align-left"></i> Description</h3>
                                <p>${event.description || 'No description available.'}</p>
                            </div>
                            
                            <div class="detail-section">
                                <h3><i class="fas fa-chart-bar"></i> Event Statistics</h3>
                                <div class="capacity-section">
                                    <div class="capacity-header">
                                        <span>Registration Progress</span>
                                        <span>${event.registered || 0}/${event.capacity}</span>
                                    </div>
                                    <div class="capacity-bar">
                                        <div class="capacity-fill" style="width: ${percentage}%"></div>
                                    </div>
                                    <div class="capacity-info">
                                        <span>${percentage}% full</span>
                                        ${!isFull ? `<span class="spots-left">${spotsLeft} spots available</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="event-modal-actions">
                            ${!isFull ? `
                                <button class="btn-primary register-now" data-id="${event.id}">
                                    <i class="fas fa-calendar-check"></i> Register Now
                                </button>
                            ` : `
                                <button class="btn-danger" disabled>
                                    <i class="fas fa-times"></i> Event Full - Registration Closed
                                </button>
                            `}
                            ${!isFull ? `
                                <button class="btn-secondary add-to-cart-modal" data-id="${event.id}">
                                    <i class="fas fa-cart-plus"></i> Add to Cart
                                </button>
                            ` : ''}
                            <button class="btn-secondary share-event" data-id="${event.id}">
                                <i class="fas fa-share-alt"></i> Share
                            </button>
                            <button class="btn-secondary close-modal">
                                <i class="fas fa-times"></i> Close
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Show modal
            modal.style.display = 'flex';
            
            // Add modal event listeners
            this.addModalEventListeners(eventId);
            
        } catch (error) {
            console.error('Error showing event details:', error);
            alert('Error loading event details');
        }
    }
    
    addModalEventListeners(eventId) {
        const modalContent = document.getElementById('modal-content');
        
        const registerBtn = modalContent.querySelector('.register-now');
        const addToCartBtn = modalContent.querySelector('.add-to-cart-modal');
        const shareBtn = modalContent.querySelector('.share-event');
        const closeBtn = modalContent.querySelector('.close-modal');
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                if (window.eventCart) {
                    window.eventCart.addToCart(eventId);
                    const modal = document.getElementById('event-modal');
                    modal.style.display = 'none';
                }
            });
        }
        
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                if (window.eventCart) {
                    window.eventCart.addToCart(eventId);
                    const modal = document.getElementById('event-modal');
                    modal.style.display = 'none';
                }
            });
        }
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareEvent(eventId);
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const modal = document.getElementById('event-modal');
                modal.style.display = 'none';
            });
        }
    }
    
    async shareEvent(eventId) {
        try {
            const event = await window.db.read('events', eventId);
            if (!event) return;
            
            const shareText = `Check out this event: ${event.title} at ${event.campus} on ${event.date}. ${window.location.href}`;
            
            if (navigator.share) {
                // Web Share API
                await navigator.share({
                    title: event.title,
                    text: shareText,
                    url: window.location.href
                });
            } else if (navigator.clipboard) {
                // Copy to clipboard
                await navigator.clipboard.writeText(shareText);
                alert('Event link copied to clipboard!');
            } else {
                // Fallback
                prompt('Copy this link:', window.location.href);
            }
        } catch (error) {
            console.error('Error sharing event:', error);
        }
    }
    
    updatePagination() {
        const pagination = document.getElementById('events-pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredEvents.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '<div class="pagination-controls">';
        
        // Previous button
        html += `<button class="page-btn prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>`;
        
        // Page numbers (show up to 5 pages)
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        // Next button
        html += `<button class="page-btn next-btn" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>`;
        
        html += '</div>';
        pagination.innerHTML = html;
        
        // Add pagination event listeners
        this.setupPaginationListeners();
    }
    
    setupPaginationListeners() {
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('prev-btn')) {
                    if (this.currentPage > 1) {
                        this.currentPage--;
                        this.renderEvents();
                        this.updatePagination();
                    }
                } else if (btn.classList.contains('next-btn')) {
                    const totalPages = Math.ceil(this.filteredEvents.length / this.itemsPerPage);
                    if (this.currentPage < totalPages) {
                        this.currentPage++;
                        this.renderEvents();
                        this.updatePagination();
                    }
                } else if (btn.dataset.page) {
                    this.currentPage = parseInt(btn.dataset.page);
                    this.renderEvents();
                    this.updatePagination();
                }
            });
        });
    }
    
    async updateStats() {
        try {
            // Update total events
            if (this.totalEventsEl) {
                this.totalEventsEl.textContent = this.events.length;
            }
            
            // Update total participants
            if (this.totalParticipantsEl) {
                const registrations = await window.db.readAll('registrations');
                const uniqueParticipants = new Set(registrations.map(r => r.userId)).size;
                this.totalParticipantsEl.textContent = uniqueParticipants;
            }
            
            // Update QR generated count
            if (this.qrGeneratedEl) {
                // Count unique QR generations in localStorage
                let count = 0;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.includes('icctStudentQR')) {
                        count++;
                    }
                }
                this.qrGeneratedEl.textContent = count;
            }
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
    
    setupRealTimeUpdates() {
        // Refresh events every 10 seconds for real-time updates
        setInterval(async () => {
            console.log("Checking for event updates...");
            await this.loadEvents();
            this.applyFilters(); // Re-apply current filters
            this.updateStats();
            
            // Also update dashboard if user is logged in
            if (window.userSystem && window.userSystem.isUserLoggedIn()) {
                window.userSystem.updateDashboard();
            }
            
            // Update cart count
            if (window.eventCart) {
                window.eventCart.updateCartDisplay();
            }
        }, 10000); // Check every 10 seconds
        
        // Also listen for storage changes (for cross-tab updates)
        window.addEventListener('storage', async (e) => {
            if (e.key === 'icct_events_updated' || e.key?.includes('icct_events')) {
                console.log('Event update detected from storage, refreshing...');
                await this.loadEvents();
                this.applyFilters(); // Re-apply current filters
                this.updateStats();
            }
        });
    }
    
    // Public method to refresh events (can be called from admin panel)
    async refreshEvents() {
        await this.loadEvents();
        this.applyFilters(); // Re-apply current filters
        this.updateStats();
    }
    
    // Helper function to show notifications
    showNotification(message, type = 'info') {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        // Remove existing notifications
        const existing = document.querySelectorAll('.event-notification');
        existing.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = 'event-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${colors[type]};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            animation: slideInRight 0.3s ease;
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
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
}

// Initialize Event Manager
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all systems
    if (!window.eventManager) {
        window.eventManager = new EventManager();
    }
    
    // Initialize other systems if they don't exist
    if (!window.userSystem) {
        window.userSystem = new UserSystem();
    }
    
    if (!window.eventCart) {
        window.eventCart = new EventCart();
    }
    
    // Setup admin login handler
    setupAdminLoginHandler();
    
    // Setup navigation
    setupNavigation();
    
    console.log("All systems initialized");
});

// Admin login handler function
function setupAdminLoginHandler() {
    const adminLoginBtn = document.getElementById('admin-login-btn');
    
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            if (!username || !password) {
                alert('Please enter admin credentials');
                return;
            }
            
            // Check admin credentials
            const defaultAdmin = {
                username: 'admin',
                password: 'admin123'
            };
            
            if (username === defaultAdmin.username && password === defaultAdmin.password) {
                // Clear any student session
                localStorage.removeItem('currentUser');
                
                // Set admin flag
                localStorage.setItem('isAdmin', 'true');
                
                // Close modal
                const authModal = document.getElementById('user-auth-modal');
                if (authModal) authModal.style.display = 'none';
                
                // Show success message
                alert('Admin login successful! Accessing admin panel...');
                
                // Show admin panel modal
                const adminPanelModal = document.getElementById('admin-panel-modal');
                if (adminPanelModal) {
                    adminPanelModal.style.display = 'flex';
                    
                    // Initialize admin panel if needed
                    setTimeout(() => {
                        if (!window.adminPanel) {
                            window.adminPanel = new AdminPanel();
                        } else {
                            window.adminPanel.loadInitialData();
                        }
                    }, 100);
                }
                
            } else {
                alert('Invalid admin credentials. Default: admin / admin123');
            }
        });
    }
}

// Navigation setup
function setupNavigation() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#!') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', debounce(() => {
        updateActiveNavLink();
    }, 100));
    
    // Initialize active nav link
    updateActiveNavLink();
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Global event refresh function
window.refreshAllEvents = async function() {
    if (window.eventManager) {
        await window.eventManager.refreshEvents();
    }
};

// Export function for other modules
window.EventManager = EventManager;