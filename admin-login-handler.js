// Admin Login Handler
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Admin link in navbar
    const adminNavLink = document.getElementById('admin-login-link');
    if (adminNavLink) {
        adminNavLink.addEventListener('click', function(e) {
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            const currentUser = localStorage.getItem('currentUser');
            
            // If student is logged in, show message
            if (currentUser && !isAdmin) {
                e.preventDefault();
                alert("Please logout as student first to access admin panel.");
                return;
            }
            
            // If not admin, show login modal
            if (!isAdmin) {
                e.preventDefault();
                const authModal = document.getElementById('user-auth-modal');
                if (authModal) {
                    authModal.style.display = 'flex';
                    // Switch to admin tab
                    const adminTabBtn = authModal.querySelector('.tab-btn[data-tab="admin"]');
                    if (adminTabBtn) adminTabBtn.click();
                }
            }
        });
    }
    
    // Check admin status on page load
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const currentUser = localStorage.getItem('currentUser');
    
    // If admin is logged in, ensure student session is cleared
    if (isAdmin && currentUser) {
        localStorage.removeItem('currentUser');
        console.log("Cleared student session for admin access");
    }
});