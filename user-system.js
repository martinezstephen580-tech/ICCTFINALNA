// Complete User Authentication and Management System
class UserSystem {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        
        // DOM Elements
        this.userLoginLink = document.getElementById('user-login-link');
        this.userLogoutLink = document.getElementById('user-logout-link');
        this.dashboardLink = document.getElementById('dashboard-link');
        this.dashboardSection = document.getElementById('dashboard');
        this.heroLoginBtn = document.getElementById('hero-login-btn');
        
        // Auth Modal Elements
        this.userAuthModal = document.getElementById('user-auth-modal');
        this.forgotPasswordModal = document.getElementById('forgot-password-modal');
        this.editProfileModal = document.getElementById('edit-profile-modal');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkExistingSession();
        this.updateUI();
    }
    
    setupEventListeners() {
        // Auth modal triggers
        if(this.userLoginLink) {
            this.userLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.openAuthModal('login');
            });
        }
        
        if(this.heroLoginBtn) {
            this.heroLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openAuthModal('login');
            });
        }
        
        if(this.userLogoutLink) {
            this.userLogoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Login Form Submit
        const studentLoginBtn = document.getElementById('student-login-btn');
        if(studentLoginBtn) {
            studentLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register Form Submit
        const studentRegisterBtn = document.getElementById('student-register-btn');
        if(studentRegisterBtn) {
            studentRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
        
        // Tab Switching
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Update active tab button
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update active content
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const content = document.getElementById(`${tabId}-tab`);
                if(content) content.classList.add('active');
            });
        });
    }
    
    async handleLogin() {
        const emailInput = document.getElementById('student-email');
        const passwordInput = document.getElementById('student-password');
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            // Get all users from Firebase
            const users = await window.db.readAll('users');
            
            // Find user by email or studentId
            const user = users.find(u => 
                (u.email === email || u.studentId === email)
            );
            
            if (!user) {
                alert('User not found');
                return;
            }
            
            // Verify password
            if (window.db.verifyPassword(user.password, password)) {
                this.login(user);
                // Clear inputs
                emailInput.value = '';
                passwordInput.value = '';
                // Close modal
                if (this.userAuthModal) this.userAuthModal.style.display = 'none';
            } else {
                alert('Invalid password');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Error during login. Please try again.');
        }
    }
    
    async handleRegister() {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const studentId = document.getElementById('reg-student-id').value.trim();
        const campus = document.getElementById('reg-campus').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        
        // Validation
        if (!name || !email || !studentId || !campus || !password) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (password.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            // Check if user already exists
            const existingUsers = await window.db.readAll('users');
            const emailExists = existingUsers.some(u => u.email === email);
            const studentIdExists = existingUsers.some(u => u.studentId === studentId);
            
            if (emailExists) {
                alert('User with this email already exists');
                return;
            }
            
            if (studentIdExists) {
                alert('User with this student ID already exists');
                return;
            }
            
            const newUser = {
                id: window.db.generateId(),
                name,
                email,
                studentId,
                campus,
                password: window.db.hashPassword(password),
                role: 'student',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await window.db.create('users', newUser);
            alert('Registration successful! Please login.');
            
            // Clear form
            document.getElementById('reg-name').value = '';
            document.getElementById('reg-email').value = '';
            document.getElementById('reg-student-id').value = '';
            document.getElementById('reg-campus').value = '';
            document.getElementById('reg-password').value = '';
            document.getElementById('reg-confirm-password').value = '';
            
            // Switch to login tab
            const loginTabBtn = document.querySelector('.tab-btn[data-tab="login"]');
            if (loginTabBtn) loginTabBtn.click();
            
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message || 'Registration failed. Please try again.');
        }
    }

    login(user) {
        this.currentUser = user;
        this.isLoggedIn = true;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Remove admin access when student logs in
        localStorage.removeItem('isAdmin');
        
        this.updateUI();
        this.showNotification(`Welcome back, ${user.name}!`, 'success');
        
        // Update dashboard data
        this.updateDashboard();
        
        // Reload after a delay to ensure all UI updates
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
    
    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isAdmin');
        
        this.updateUI();
        this.showNotification('Logged out successfully', 'info');
        
        setTimeout(() => {
            window.location.href = '#';
            location.reload();
        }, 500);
    }
    
    checkExistingSession() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isLoggedIn = true;
                
                // Safety check: If student exists, ensure Admin is gone
                if (localStorage.getItem('isAdmin')) {
                    localStorage.removeItem('isAdmin');
                }
                
                // Update dashboard
                this.updateDashboard();
            } catch (e) {
                console.error('Error parsing user data:', e);
                localStorage.removeItem('currentUser');
            }
        }
    }
    
    updateUI() {
        if (this.isLoggedIn) {
            if(this.userLoginLink) this.userLoginLink.style.display = 'none';
            if(this.userLogoutLink) this.userLogoutLink.style.display = 'block';
            if(this.dashboardLink) this.dashboardLink.style.display = 'block';
            if(this.dashboardSection) this.dashboardSection.style.display = 'block';
            if(this.heroLoginBtn) this.heroLoginBtn.style.display = 'none';
            
            // Populate Profile Info
            this.updateProfileInfo();
        } else {
            if(this.userLoginLink) this.userLoginLink.style.display = 'block';
            if(this.userLogoutLink) this.userLogoutLink.style.display = 'none';
            if(this.dashboardLink) this.dashboardLink.style.display = 'none';
            if(this.dashboardSection) this.dashboardSection.style.display = 'none';
            if(this.heroLoginBtn) this.heroLoginBtn.style.display = 'inline-flex';
        }
    }
    
    updateProfileInfo() {
        const profileInfo = document.getElementById('user-profile-info');
        if (profileInfo && this.currentUser) {
            profileInfo.innerHTML = `
                <div class="profile-header">
                    <img src="assets/images/default-avatar.png" alt="Profile" class="profile-avatar" onerror="this.src='https://via.placeholder.com/80'">
                    <div>
                        <h4>${this.currentUser.name}</h4>
                        <span class="profile-role">${this.currentUser.role.toUpperCase()}</span>
                    </div>
                </div>
                <div class="profile-details">
                    <p><i class="fas fa-id-badge"></i> ${this.currentUser.studentId}</p>
                    <p><i class="fas fa-envelope"></i> ${this.currentUser.email}</p>
                    <p><i class="fas fa-university"></i> ${this.currentUser.campus}</p>
                </div>
            `;
        }
    }
    
    async updateDashboard() {
        if (!this.isLoggedIn) return;
        
        try {
            // Get user registrations
            const registrations = await window.db.readAll('registrations', { userId: this.currentUser.id });
            
            // Update registrations display
            this.updateRegistrations(registrations);
            
            // Get attendance history
            const attendance = await window.db.readAll('attendance', { studentId: this.currentUser.studentId });
            this.updateAttendance(attendance);
            
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }
    
    updateRegistrations(registrations) {
        const registrationsList = document.getElementById('my-registrations');
        if (!registrationsList) return;
        
        if (registrations.length === 0) {
            registrationsList.innerHTML = `
                <div class="no-data">
                    <p>No event registrations yet</p>
                    <a href="#events" class="btn-secondary">Browse Events</a>
                </div>
            `;
            return;
        }
        
        let html = '<div class="registrations-grid">';
        
        // Get first 5 registrations
        registrations.slice(0, 5).forEach(reg => {
            html += `
                <div class="registration-item">
                    <h5>Event #${reg.eventId.substring(0, 8)}</h5>
                    <p><i class="fas fa-calendar"></i> ${new Date(reg.registeredAt).toLocaleDateString()}</p>
                    <p><i class="fas fa-university"></i> ${reg.campus}</p>
                    <div class="registration-status">
                        <span class="status-badge ${reg.status}">${reg.status}</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (registrations.length > 5) {
            html += `<p class="show-more">+${registrations.length - 5} more registrations</p>`;
        }
        
        registrationsList.innerHTML = html;
    }
    
    updateAttendance(attendance) {
        const attendanceHistory = document.getElementById('my-attendance');
        if (!attendanceHistory) return;
        
        if (attendance.length === 0) {
            attendanceHistory.innerHTML = `
                <div class="no-data">
                    <p>No attendance records yet</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="attendance-history-list">';
        
        attendance.slice(0, 5).forEach(record => {
            html += `
                <div class="attendance-record">
                    <div>
                        <h5>Event Attendance</h5>
                        <p><i class="fas fa-clock"></i> ${new Date(record.timestamp).toLocaleString()}</p>
                    </div>
                    <span class="status-indicator">Present</span>
                </div>
            `;
        });
        
        html += '</div>';
        
        if (attendance.length > 5) {
            html += `<p class="show-more">+${attendance.length - 5} more records</p>`;
        }
        
        attendanceHistory.innerHTML = html;
    }
    
    openAuthModal(tab = 'login') {
        if (this.userAuthModal) {
            this.userAuthModal.style.display = 'flex';
            const tabBtn = this.userAuthModal.querySelector(`.tab-btn[data-tab="${tab}"]`);
            if (tabBtn) tabBtn.click();
        }
    }
    
    showNotification(message, type = 'info') {
        const colors = { success: '#27ae60', error: '#e74c3c', info: '#3498db' };
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background-color: ${colors[type]}; color: white;
            padding: 1rem 2rem; border-radius: 10px; z-index: 3000;
            animation: slideInRight 0.3s ease;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }
    
    // For other modules to access user
    getCurrentUser() {
        return this.currentUser;
    }
    
    isUserLoggedIn() {
        return this.isLoggedIn;
    }
}

// Initialize
window.userSystem = new UserSystem();