// Enhanced Admin Panel with Firebase support
class AdminPanel {
    constructor() {
        console.log("AdminPanel constructor called");
        
        // Check admin status - STRICTER CHECK
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const currentUser = localStorage.getItem('currentUser');
        
        // If student is logged in, block admin access
        if (currentUser && !isAdmin) {
            console.warn("Student logged in, admin access blocked");
            this.isAdmin = false;
        } else {
            this.isAdmin = isAdmin;
        }
        
        if (!this.isAdmin) {
            console.warn("User is not admin, admin panel functions will be limited");
        }

        // Analytics Elements
        this.totalStudents = document.getElementById('total-students');
        this.eventsThisMonth = document.getElementById('events-this-month');
        this.todaysAttendance = document.getElementById('todays-attendance');
        this.participationRate = document.getElementById('participation-rate');
        this.analyticsPeriod = document.getElementById('analytics-period');
        
        // User Management Elements
        this.userSearch = document.getElementById('user-search');
        this.exportUsersBtn = document.getElementById('export-users-btn');
        this.usersListAdmin = document.getElementById('users-list-admin');
        
        // Event Management Elements
        this.eventsListAdmin = document.getElementById('events-list-admin');
        this.addEventBtn = document.getElementById('add-event-btn');
        this.clearFormBtn = document.getElementById('clear-form-btn');
        
        // Event Form Inputs
        this.eventTitle = document.getElementById('event-title');
        this.eventCategory = document.getElementById('event-category');
        this.eventCampus = document.getElementById('event-campus');
        this.eventDate = document.getElementById('event-date');
        this.eventTime = document.getElementById('event-time');
        this.eventLocation = document.getElementById('event-location');
        this.eventDescription = document.getElementById('event-description');
        this.eventCapacity = document.getElementById('event-capacity');
        this.eventSpeaker = document.getElementById('event-speaker');
        this.eventImage = document.getElementById('event-image');
        
        // Scanner Elements
        this.adminScanInput = document.getElementById('admin-scan-input');
        this.adminScanBtn = document.getElementById('admin-scan-btn');
        this.adminAttendanceList = document.getElementById('admin-attendance-list');
        
        // State for Editing
        this.editingEventId = null;
        
        // Check if we're on admin page
        this.isAdminPage = window.location.hash === '#admin-panel' || 
                          document.querySelector('.admin-panel') !== null;
        
        if (this.isAdminPage) {
            this.init();
        }
    }
    
    async init() {
        console.log("AdminPanel initializing...");
        
        // Check admin status again - STRICTER CHECK
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const currentUser = localStorage.getItem('currentUser');
        
        // If student is logged in, block admin access
        if (currentUser && !isAdmin) {
            this.showNotification("Please logout as student first to access admin panel.", "error");
            this.disableAdminFunctions();
            return;
        }
        
        if (!isAdmin) {
            this.showNotification("Admin access required. Please login as admin.", "error");
            this.disableAdminFunctions();
            return;
        }

        // Initialize Listeners
        if (this.analyticsPeriod) {
            this.analyticsPeriod.addEventListener('change', () => this.updateAnalytics());
        }
        
        if (this.userSearch) {
            this.userSearch.addEventListener('input', () => this.searchUsers());
        }
        
        if (this.exportUsersBtn) {
            this.exportUsersBtn.addEventListener('click', () => this.exportUsers());
        }
        
        // Event CRUD Listeners
        if (this.addEventBtn) {
            this.addEventBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEventSubmit();
            });
        }
        
        if (this.clearFormBtn) {
            this.clearFormBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetEventForm();
            });
        }
        
        // Scanner Listener
        if (this.adminScanBtn) {
            this.adminScanBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.adminScanAttendance();
            });
        }

        // Enter key for scanner
        if (this.adminScanInput) {
            this.adminScanInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.adminScanAttendance();
                }
            });
        }

        // Load initial data
        await this.loadInitialData();
        
        // Set up real-time refresh
        this.setupRealTimeRefresh();
        
        console.log("AdminPanel initialized successfully");
    }
    
    async loadInitialData() {
        try {
            // Load events
            if (this.eventsListAdmin) {
                await this.loadEvents();
            }
            
            // Load users
            if (this.usersListAdmin) {
                await this.loadUsers();
            }
            
            // Load analytics
            if (this.totalStudents) {
                await this.updateAnalytics();
            }
            
            // Load attendance
            if (this.adminAttendanceList) {
                await this.renderAdminAttendanceList();
            }
        } catch (error) {
            console.error("Error loading initial admin data:", error);
        }
    }
    
    setupRealTimeRefresh() {
        // Refresh data every 15 seconds
        setInterval(async () => {
            if (this.isAdmin) {
                await this.loadInitialData();
            }
        }, 15000);
    }
    
    disableAdminFunctions() {
        // Disable all buttons and inputs
        const adminElements = [
            this.addEventBtn, this.clearFormBtn, this.exportUsersBtn,
            this.adminScanBtn, this.userSearch, this.adminScanInput
        ];
        
        adminElements.forEach(element => {
            if (element) {
                element.disabled = true;
                element.style.opacity = "0.5";
                element.style.cursor = "not-allowed";
            }
        });
        
        // Show access denied message
        const containers = [this.eventsListAdmin, this.usersListAdmin, this.adminAttendanceList];
        containers.forEach(container => {
            if (container) {
                container.innerHTML = '<div class="alert alert-danger"><i class="fas fa-lock"></i> Admin access required. Please login as admin.</div>';
            }
        });
    }
    
    // ==========================================
    // 1. EVENT CRUD OPERATIONS
    // ==========================================
    
    async loadEvents() {
        if (!this.eventsListAdmin) return;
        
        try {
            console.log("Loading events for admin panel...");
            const events = await window.db.readAll('events');
            
            // Sort by date (newest first)
            events.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            this.renderEventsList(events);
        } catch (error) {
            console.error('Error loading events:', error);
            this.eventsListAdmin.innerHTML = '<p class="no-data">Error loading events. Please check console.</p>';
        }
    }
    
    renderEventsList(events) {
        if (!this.eventsListAdmin) return;
        
        this.eventsListAdmin.innerHTML = '';
        
        if (!events || events.length === 0) {
            this.eventsListAdmin.innerHTML = '<p class="no-data">No events found. Create your first event!</p>';
            return;
        }

        events.forEach(event => {
            const item = document.createElement('div');
            item.className = 'admin-event-item';
            
            // Calculate fill percentage
            const registered = event.registered || 0;
            const percentage = Math.round((registered / event.capacity) * 100);
            
            item.innerHTML = `
                <div class="event-info">
                    <h4>${event.title}</h4>
                    <div class="event-meta">
                        <span class="category-badge">${event.category}</span>
                        <span class="campus-badge">${event.campus}</span>
                    </div>
                    <p class="date-info"><i class="fas fa-clock"></i> ${event.date} at ${event.time}</p>
                    <div class="event-stats">
                        <span><i class="fas fa-users"></i> ${registered}/${event.capacity} (${percentage}%)</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${event.location}</span>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="btn-secondary btn-small edit-event" data-id="${event.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-danger btn-small delete-event" data-id="${event.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            this.eventsListAdmin.appendChild(item);
        });

        // Add Listeners for Edit/Delete buttons
        document.querySelectorAll('.edit-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.currentTarget.getAttribute('data-id');
                this.prepareEditEvent(eventId);
            });
        });

        document.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = e.currentTarget.getAttribute('data-id');
                this.deleteEvent(eventId);
            });
        });
    }
    
    async handleEventSubmit() {
        // Validation
        if (!this.eventTitle || !this.eventTitle.value) {
            this.showNotification('Please enter event title', 'error');
            return;
        }
        
        if (!this.eventDate || !this.eventDate.value) {
            this.showNotification('Please select event date', 'error');
            return;
        }
        
        if (!this.eventCapacity || !this.eventCapacity.value) {
            this.showNotification('Please enter event capacity', 'error');
            return;
        }

        const eventData = {
            title: this.eventTitle.value,
            category: this.eventCategory.value,
            campus: this.eventCampus.value,
            date: this.eventDate.value,
            time: this.eventTime.value,
            location: this.eventLocation.value,
            description: this.eventDescription.value,
            capacity: parseInt(this.eventCapacity.value),
            speaker: this.eventSpeaker.value,
            image: this.eventImage.value || 'assets/images/events/default.jpg',
            registered: 0,
            status: 'upcoming',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            if (this.editingEventId) {
                // UPDATE OPERATION
                const existingEvent = await window.db.read('events', this.editingEventId);
                if (existingEvent) {
                    eventData.registered = existingEvent.registered || 0;
                    eventData.status = existingEvent.status || 'upcoming';
                    eventData.createdAt = existingEvent.createdAt || new Date().toISOString();
                }
                await window.db.update('events', this.editingEventId, eventData);
                this.showNotification('Event updated successfully', 'success');
            } else {
                // CREATE OPERATION
                eventData.id = window.db.generateId();
                await window.db.create('events', eventData);
                this.showNotification('New event created successfully', 'success');
            }

            this.resetEventForm();
            await this.loadEvents();
            await this.updateAnalytics();
            
            // ===== CRITICAL: Trigger real-time updates =====
            // Refresh main event view for ALL users
            if (window.eventManager) {
                await window.eventManager.refreshEvents();
            }
            
            // Trigger storage event for cross-tab updates
            localStorage.setItem('icct_events_updated', Date.now().toString());
            
            // Show immediate feedback
            this.showNotification('Event saved! Changes are now visible to all users.', 'success');

        } catch (error) {
            console.error('Error saving event:', error);
            this.showNotification('Error saving event: ' + error.message, 'error');
        }
    }
    
    async prepareEditEvent(id) {
        try {
            const event = await window.db.read('events', id);
            if (!event) {
                this.showNotification('Event not found', 'error');
                return;
            }

            this.editingEventId = id;
            
            // Populate fields
            this.eventTitle.value = event.title || '';
            this.eventCategory.value = event.category || 'Academic';
            this.eventCampus.value = event.campus || 'Cainta Campus';
            this.eventDate.value = event.date || '';
            this.eventTime.value = event.time || '';
            this.eventLocation.value = event.location || '';
            this.eventDescription.value = event.description || '';
            this.eventCapacity.value = event.capacity || 50;
            this.eventSpeaker.value = event.speaker || '';
            this.eventImage.value = event.image || 'assets/images/events/default.jpg';

            // Change Button Text
            if (this.addEventBtn) {
                this.addEventBtn.innerHTML = '<i class="fas fa-save"></i> Update Event';
                this.addEventBtn.classList.remove('btn-primary');
                this.addEventBtn.classList.add('btn-success');
            }
            
            // Scroll to form
            if (this.addEventBtn) {
                this.addEventBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            this.showNotification('Editing event: ' + event.title, 'info');
        } catch (error) {
            console.error('Error preparing edit:', error);
            this.showNotification('Error loading event data', 'error');
        }
    }
    
    async deleteEvent(id) {
        if (!confirm('Are you sure you want to delete this event? This will also cancel all student registrations for it.')) {
            return;
        }

        try {
            // 1. Delete the event
            await window.db.delete('events', id);

            // 2. Delete associated registrations
            const registrations = await window.db.readAll('registrations', { eventId: id });
            for (const reg of registrations) {
                await window.db.delete('registrations', reg.id);
            }

            this.showNotification('Event deleted successfully', 'success');
            await this.loadEvents();
            await this.updateAnalytics();
            
            // Trigger real-time updates
            if (window.eventManager) {
                await window.eventManager.refreshEvents();
            }
            
            localStorage.setItem('icct_events_updated', Date.now().toString());

        } catch (error) {
            console.error('Error deleting event:', error);
            this.showNotification('Failed to delete event', 'error');
        }
    }
    
    resetEventForm() {
        this.editingEventId = null;
        
        // Clear inputs
        if (this.eventTitle) this.eventTitle.value = '';
        if (this.eventDate) this.eventDate.value = '';
        if (this.eventTime) this.eventTime.value = '10:00';
        if (this.eventLocation) this.eventLocation.value = '';
        if (this.eventDescription) this.eventDescription.value = '';
        if (this.eventCapacity) this.eventCapacity.value = '50';
        if (this.eventSpeaker) this.eventSpeaker.value = '';
        if (this.eventImage) this.eventImage.value = 'assets/images/events/default.jpg';
        if (this.eventCategory) this.eventCategory.value = 'Academic';
        if (this.eventCampus) this.eventCampus.value = 'Cainta Campus';
        
        // Reset Button
        if (this.addEventBtn) {
            this.addEventBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Event';
            this.addEventBtn.classList.add('btn-primary');
            this.addEventBtn.classList.remove('btn-success');
        }
    }
    
    // ==========================================
    // 2. ANALYTICS & STATS
    // ==========================================
    async updateAnalytics() {
        if(!this.totalStudents) return;

        try {
            // Total students
            const totalUsers = await window.db.count('users', { role: 'student' });
            this.totalStudents.textContent = totalUsers;
            
            // Events this month
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const events = await window.db.readAll('events');
            const monthlyEvents = events.filter(event => {
                if (!event.date) return false;
                const eventDate = new Date(event.date);
                return eventDate.getMonth() === currentMonth && 
                       eventDate.getFullYear() === currentYear;
            });
            this.eventsThisMonth.textContent = monthlyEvents.length;
            
            // Today's attendance
            const today = new Date().toISOString().split('T')[0];
            const attendance = await window.db.readAll('attendance');
            const todaysAttendance = attendance.filter(record => {
                return record.timestamp && record.timestamp.includes(today);
            });
            this.todaysAttendance.textContent = todaysAttendance.length;
            
            // Participation rate
            const totalRegistrations = await window.db.count('registrations');
            const activeStudents = new Set(attendance.map(a => a.studentId)).size;
            const rate = totalUsers > 0 ? Math.round((activeStudents / totalUsers) * 100) : 0;
            this.participationRate.textContent = `${rate}%`;
        } catch (error) {
            console.error('Error updating analytics:', error);
            this.showNotification('Error updating analytics', 'error');
        }
    }
    
    // ==========================================
    // 3. USER MANAGEMENT
    // ==========================================
    async loadUsers() {
        if (!this.usersListAdmin) return;
        
        try {
            const users = await window.db.readAll('users');
            this.renderUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.usersListAdmin.innerHTML = '<p class="no-data">Error loading users</p>';
        }
    }
    
    async searchUsers() {
        const searchTerm = this.userSearch.value.trim().toLowerCase();
        
        try {
            const users = await window.db.readAll('users');
            
            if (!searchTerm) {
                this.renderUsers(users);
                return;
            }
            
            const filteredUsers = users.filter(user => {
                return (user.name && user.name.toLowerCase().includes(searchTerm)) ||
                       (user.email && user.email.toLowerCase().includes(searchTerm)) ||
                       (user.studentId && user.studentId.toLowerCase().includes(searchTerm)) ||
                       (user.campus && user.campus.toLowerCase().includes(searchTerm));
            });
            
            this.renderUsers(filteredUsers);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    }
    
    renderUsers(users) {
        if (!this.usersListAdmin) return;
        
        this.usersListAdmin.innerHTML = '';
        
        if (!users || users.length === 0) {
            this.usersListAdmin.innerHTML = '<p class="no-data">No users found</p>';
            return;
        }
        
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            
            userElement.innerHTML = `
                <div class="user-info">
                    <h4>${user.name || 'Unknown User'}</h4>
                    <div class="user-meta">
                        <span>${user.email || 'No email'}</span>
                        <span>${user.studentId || 'No ID'}</span>
                        <span class="campus-badge">${user.campus || 'Unknown'}</span>
                        <span class="user-role ${user.role || 'student'}">${user.role || 'student'}</span>
                    </div>
                </div>
                <div class="user-actions">
                    ${user.role !== 'admin' ? `
                        <button class="btn-secondary btn-small make-admin" data-id="${user.id}">
                            Promote to Admin
                        </button>
                    ` : ''}
                    ${user.role !== 'admin' ? `
                        <button class="btn-danger btn-small delete-user" data-id="${user.id}">
                            Delete
                        </button>
                    ` : ''}
                </div>
            `;
            
            this.usersListAdmin.appendChild(userElement);
        });
        
        // Add User Action Listeners
        document.querySelectorAll('.make-admin').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-id');
                this.makeAdmin(userId);
            });
        });
        
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.currentTarget.getAttribute('data-id');
                this.deleteUser(userId);
            });
        });
    }
    
    async makeAdmin(userId) {
        if (!confirm('Are you sure you want to make this user an admin?')) return;
        
        try {
            await window.db.update('users', userId, { role: 'admin' });
            this.showNotification('User promoted to admin', 'success');
            await this.loadUsers();
        } catch (error) {
            console.error('Error promoting user:', error);
            this.showNotification('Failed to promote user', 'error');
        }
    }
    
    async deleteUser(userId) {
        if (!confirm('Delete this user? This removes all their data.')) return;
        
        try {
            // Delete user
            await window.db.delete('users', userId);
            
            // Delete user's registrations
            const registrations = await window.db.readAll('registrations', { userId: userId });
            for (const reg of registrations) {
                // Update event registration count
                try {
                    const event = await window.db.read('events', reg.eventId);
                    if (event && event.registered > 0) {
                        await window.db.update('events', event.id, { registered: event.registered - 1 });
                    }
                } catch (e) {
                    console.error('Error updating event count:', e);
                }
                await window.db.delete('registrations', reg.id);
            }
            
            this.showNotification('User deleted', 'success');
            await this.loadUsers();
            await this.updateAnalytics();
            
            // Trigger real-time updates
            if (window.eventManager) {
                await window.eventManager.refreshEvents();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Failed to delete user', 'error');
        }
    }
    
    async exportUsers() {
        try {
            const users = await window.db.readAll('users');
            if (!users || users.length === 0) {
                this.showNotification('No users to export', 'error');
                return;
            }
            
            const headers = ['Name', 'Email', 'Student ID', 'Campus', 'Role', 'Created At'];
            const csvRows = [headers.join(',')];
            
            users.forEach(user => {
                const row = [
                    `"${user.name || ''}"`,
                    `"${user.email || ''}"`,
                    `"${user.studentId || ''}"`,
                    `"${user.campus || ''}"`,
                    `"${user.role || ''}"`,
                    `"${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}"`
                ];
                csvRows.push(row.join(','));
            });
            
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ICCT_Users_Export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showNotification('Users exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting users:', error);
            this.showNotification('Error exporting users', 'error');
        }
    }
    
    // ==========================================
    // 4. ADMIN SCANNER
    // ==========================================
    async adminScanAttendance() {
        if (!this.adminScanInput) return;
        
        const scanData = this.adminScanInput.value.trim();
        if (!scanData) {
            this.showNotification('Please enter QR data or ID', 'error');
            return;
        }

        try {
            // Try to parse as QR data
            let studentData;
            try {
                studentData = JSON.parse(scanData);
            } catch (e) {
                // If not JSON, treat as student ID
                const users = await window.db.readAll('users');
                const user = users.find(u => u.studentId === scanData);
                if (user) {
                    studentData = {
                        studentId: user.studentId,
                        name: user.name,
                        campus: user.campus
                    };
                } else {
                    studentData = {
                        studentId: scanData,
                        name: 'Unknown Student',
                        campus: 'Unknown Campus'
                    };
                }
            }

            const record = {
                id: window.db.generateId(),
                studentId: studentData.studentId,
                studentName: studentData.name,
                campus: studentData.campus,
                timestamp: new Date().toISOString(),
                status: 'Present',
                scanMethod: 'Admin Manual Scan'
            };

            await window.db.create('attendance', record);
            
            // Update attendance list
            await this.renderAdminAttendanceList();
            await this.updateAnalytics();
            
            this.showNotification(`Attendance recorded for ${studentData.name}`, 'success');
            this.adminScanInput.value = '';
            this.adminScanInput.focus();
            
        } catch (error) {
            console.error('Error recording attendance:', error);
            this.showNotification('Error recording attendance', 'error');
        }
    }
    
    async renderAdminAttendanceList() {
        if (!this.adminAttendanceList) return;
        
        try {
            const attendance = await window.db.readAll('attendance');
            // Sort by timestamp descending
            attendance.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            this.adminAttendanceList.innerHTML = '';
            
            if (!attendance || attendance.length === 0) {
                this.adminAttendanceList.innerHTML = '<p class="no-data">No attendance records yet</p>';
                return;
            }
            
            // Show last 10 records
            attendance.slice(0, 10).forEach(record => {
                const item = document.createElement('div');
                item.className = 'attendance-item fade-in';
                const timestamp = record.timestamp ? new Date(record.timestamp).toLocaleString() : 'Unknown time';
                item.innerHTML = `
                    <div>
                        <strong>${record.studentName || 'Unknown Student'}</strong>
                        <br><small>${record.studentId || 'No ID'}</small>
                        <br><small>${timestamp}</small>
                    </div>
                    <span class="status-indicator ${record.status?.toLowerCase() || 'present'}">
                        ${record.status || 'Present'}
                    </span>
                `;
                this.adminAttendanceList.appendChild(item);
            });
        } catch (error) {
            console.error('Error rendering attendance list:', error);
            this.adminAttendanceList.innerHTML = '<p class="no-data">Error loading attendance</p>';
        }
    }
    
    // Helper: Notifications
    showNotification(message, type = 'info') {
        const colors = { 
            success: '#27ae60', 
            error: '#e74c3c', 
            warning: '#f39c12', 
            info: '#3498db' 
        };
        
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.admin-notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = 'admin-notification';
        notification.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background-color: ${colors[type]}; color: white;
            padding: 1rem 2rem; border-radius: 8px; z-index: 9999;
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

// Initialize admin panel when admin panel is shown
function setupAdminPanel() {
    console.log("Setting up admin panel...");
    
    // Check if user is admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const currentUser = localStorage.getItem('currentUser');
    
    // If student is logged in, block admin access
    if (currentUser && !isAdmin) {
        console.log("Student logged in, hiding admin panel");
        // Hide admin panel if exists
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
        return;
    }
    
    if (!isAdmin) {
        console.log("User is not admin, hiding admin panel");
        // Hide admin panel if exists
        const adminPanel = document.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
        return;
    }
    
    // Wait for database to be ready
    if (!window.db || typeof window.db.readAll !== 'function') {
        console.log("Database not ready, retrying in 500ms...");
        setTimeout(setupAdminPanel, 500);
        return;
    }
    
    // Initialize admin panel if not already initialized
    if (!window.adminPanel) {
        window.adminPanel = new AdminPanel();
        console.log("Admin panel initialized");
    } else {
        console.log("Admin panel already initialized");
    }
}

// Listen for admin panel activation
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, checking for admin panel...");
    
    // Check if we're on an admin page
    const adminLink = document.getElementById('admin-login-link');
    if (adminLink) {
        adminLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check admin status
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            const currentUser = localStorage.getItem('currentUser');
            
            // If student is logged in, show message
            if (currentUser && !isAdmin) {
                alert("Please logout as student first to access admin panel.");
                return;
            }
            
            if (!isAdmin) {
                alert("Admin access required. Please login as admin first.");
                // Show admin login modal
                const userAuthModal = document.getElementById('user-auth-modal');
                if (userAuthModal) {
                    userAuthModal.style.display = 'flex';
                    // Switch to admin tab
                    const adminTabBtn = userAuthModal.querySelector('.tab-btn[data-tab="admin"]');
                    if (adminTabBtn) adminTabBtn.click();
                }
                return;
            }
            
            // Show admin panel modal
            const adminPanelModal = document.getElementById('admin-panel-modal');
            if (adminPanelModal) {
                adminPanelModal.style.display = 'flex';
                
                // Initialize admin panel if needed
                setTimeout(() => {
                    if (!window.adminPanel) {
                        window.adminPanel = new AdminPanel();
                    } else {
                        // Refresh data
                        window.adminPanel.loadInitialData();
                    }
                }, 100);
            } else {
                console.error("Admin panel modal not found");
                alert("Admin panel not found.");
            }
        });
    }
    
    // Initialize admin panel if already on admin page
    if (window.location.hash === '#admin-panel' || document.querySelector('.admin-panel')) {
        setTimeout(setupAdminPanel, 1000);
    
    }
    document.addEventListener('DOMContentLoaded', function() {
    // Your event loading code here
    loadEvents();
});

// OR if using async
window.addEventListener('load', function() {
    // Ensure everything is loaded first
});
});

// Add CSS for animations
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    @keyframes slideInUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideOutDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100%); opacity: 0; }
    }
    
    .admin-panel {
        display: none;
    }
    
    .admin-panel.active {
        display: block;
    }
    
    .admin-event-item, .user-item, .attendance-item {
        background: white;
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .category-badge, .campus-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
        margin-right: 0.5rem;
    }
    
    .category-badge {
        background: #e3f2fd;
        color: #1976d2;
    }
    
    .campus-badge {
        background: #f3e5f5;
        color: #7b1fa2;
    }
    
    .user-role {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
    }
    
    .user-role.admin {
        background: #ffebee;
        color: #c62828;
    }
    
    .user-role.student {
        background: #e8f5e9;
        color: #2e7d32;
    }
    
    .status-indicator {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: bold;
    }
    
    .status-indicator.present {
        background: #e8f5e9;
        color: #2e7d32;
    }
    
    .status-indicator.absent {
        background: #ffebee;
        color: #c62828;
    }
    
    .no-data {
        text-align: center;
        padding: 2rem;
        color: #666;
        font-style: italic;
    }
    
    .fade-in {
        animation: fadeIn 0.5s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(adminStyles);