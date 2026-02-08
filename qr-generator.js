// Reliable QR Generator System - Updated with specific fields only
class QRGenerator {
    constructor() {
        // 1. Get DOM Elements
        this.container = document.getElementById('qrcode');
        this.generateBtn = document.getElementById('generate-qr');
        this.downloadBtn = document.getElementById('download-qr');
        this.deleteBtn = document.getElementById('delete-qr');
        this.shareBtn = document.getElementById('share-qr');
        
        // Inputs
        this.nameInput = document.getElementById('student-name');
        this.idInput = document.getElementById('student-id');
        this.campusInput = document.getElementById('student-campus');
        this.emailInput = document.getElementById('qr-email-input');
        
        // Display Text Elements
        this.displayName = document.getElementById('qr-student-name');
        this.displayId = document.getElementById('qr-student-id');
        this.displayCampus = document.getElementById('qr-campus');
        this.displayEmail = document.getElementById('qr-email');
        this.displayTime = document.getElementById('qr-generated-time');
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log("QR System Initializing...");
        
        // 2. Check if Library is Loaded
        if (typeof QRCode === 'undefined') {
            console.error("CRITICAL ERROR: QRCode library is missing.");
            if (this.container) {
                this.container.innerHTML = '<p style="color:red; font-weight:bold;">Error: Internet required to load QR Library.</p>';
            }
            return;
        }

        // 3. Load Saved Data (if any)
        this.loadSavedQR();
        
        // 4. Attach Click Listeners
        if (this.generateBtn) {
            this.generateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.generate();
            });
        }
        
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadQR();
            });
        }
        
        if (this.deleteBtn) {
            this.deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.deleteQR();
            });
        }
        
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.shareQR();
            });
        }
    }
    
    generate() {
        // 1. Validate Inputs
        const name = this.nameInput ? this.nameInput.value.trim() : '';
        const id = this.idInput ? this.idInput.value.trim() : '';
        const campus = this.campusInput ? this.campusInput.value : '';
        const email = this.emailInput ? this.emailInput.value.trim() : '';
        
        if (!name || !id || !campus) {
            alert('Please fill in Name, Student ID, and Campus to generate a QR code.');
            return;
        }
        
        // 2. Create Data Object with ONLY the specified fields
        const studentData = {
            studentId: id,
            name: name,
            campus: campus,
            email: email || '',
            generatedAt: new Date().toLocaleString(),
            version: "2.0"
        };
        
        // 3. Clear previous QR
        if (this.container) this.container.innerHTML = '';
        
        try {
            // 4. Generate the QR Code Image
            new QRCode(this.container, {
                text: JSON.stringify(studentData),
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // 5. Update Text Display below QR
            if(this.displayName) this.displayName.textContent = name;
            if(this.displayId) this.displayId.innerHTML = `<i class="fas fa-id-badge"></i> ID: ${id}`;
            if(this.displayCampus) this.displayCampus.innerHTML = `<i class="fas fa-school"></i> Campus: ${campus}`;
            
            // Show/hide email display based on whether email was provided
            if(this.displayEmail) {
                if(email) {
                    this.displayEmail.innerHTML = `<i class="fas fa-envelope"></i> Email: ${email}`;
                    this.displayEmail.style.display = 'block';
                } else {
                    this.displayEmail.style.display = 'none';
                }
            }
            
            if(this.displayTime) {
                this.displayTime.innerHTML = `<i class="fas fa-clock"></i> Generated: ${new Date().toLocaleString()}`;
            }
            
            // 6. Save to LocalStorage
            localStorage.setItem('icctStudentQR', JSON.stringify(studentData));
            
            // 7. Enable Buttons
            if(this.downloadBtn) this.downloadBtn.disabled = false;
            if(this.deleteBtn) this.deleteBtn.disabled = false;
            if(this.shareBtn) this.shareBtn.disabled = false;
            
            // 8. Update QR generated count
            this.updateQRCount();
            
            // 9. Success Message
            this.showNotification('QR Code generated successfully!', 'success');
            
        } catch (e) {
            console.error("Generation Error:", e);
            alert("Error generating QR. Please check the console for details.");
        }
    }
    
    loadSavedQR() {
        const saved = localStorage.getItem('icctStudentQR');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                
                // Fill inputs
                if(this.nameInput) this.nameInput.value = data.name;
                if(this.idInput) this.idInput.value = data.studentId;
                if(this.campusInput) this.campusInput.value = data.campus;
                if(this.emailInput && data.email) this.emailInput.value = data.email;
                
                // Trigger Generation automatically
                setTimeout(() => this.generate(), 500);
            } catch(e) {
                console.error("Error loading saved data", e);
                localStorage.removeItem('icctStudentQR');
            }
        }
    }

    downloadQR() {
        const canvas = this.container.querySelector('canvas');
        const img = this.container.querySelector('img');
        
        if (canvas || img) {
            const link = document.createElement('a');
            if (canvas) {
                link.href = canvas.toDataURL('image/png');
            } else {
                link.href = img.src;
            }
            link.download = `ICCT_QR_${this.idInput.value || 'student'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification('QR Code downloaded successfully!', 'success');
        } else {
            alert('Please generate a QR code first.');
        }
    }
    
    shareQR() {
        const canvas = this.container.querySelector('canvas');
        const img = this.container.querySelector('img');
        
        if (canvas || img) {
            if (navigator.share) {
                // For mobile devices with Web Share API
                canvas.toBlob((blob) => {
                    const file = new File([blob], `ICCT_QR_${this.idInput.value}.png`, { type: 'image/png' });
                    navigator.share({
                        files: [file],
                        title: 'My ICCT Student QR Code',
                        text: 'Here is my ICCT Student QR Code for event attendance.'
                    }).catch(console.error);
                });
            } else if (navigator.clipboard) {
                // Copy to clipboard
                canvas.toBlob((blob) => {
                    const item = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([item]).then(() => {
                        this.showNotification('QR Code copied to clipboard!', 'success');
                    }).catch(console.error);
                });
            } else {
                // Fallback to download
                this.downloadQR();
            }
        } else {
            alert('Please generate a QR code first.');
        }
    }

    deleteQR() {
        if(confirm("Are you sure you want to delete this QR code?")) {
            localStorage.removeItem('icctStudentQR');
            if (this.container) this.container.innerHTML = '';
            if(this.displayName) this.displayName.textContent = '-';
            if(this.displayId) this.displayId.innerHTML = '<i class="fas fa-id-badge"></i> ID: -';
            if(this.displayCampus) this.displayCampus.innerHTML = '<i class="fas fa-school"></i> Campus: -';
            if(this.displayEmail) this.displayEmail.style.display = 'none';
            if(this.displayTime) this.displayTime.innerHTML = '<i class="fas fa-clock"></i> Generated: -';
            
            // Disable buttons
            if(this.downloadBtn) this.downloadBtn.disabled = true;
            if(this.deleteBtn) this.deleteBtn.disabled = true;
            if(this.shareBtn) this.shareBtn.disabled = true;
            
            // Clear inputs
            if(this.nameInput) this.nameInput.value = '';
            if(this.idInput) this.idInput.value = '';
            if(this.campusInput) this.campusInput.value = '';
            if(this.emailInput) this.emailInput.value = '';
            
            this.showNotification('QR Code deleted successfully!', 'info');
        }
    }
    
    updateQRCount() {
        const qrGeneratedEl = document.getElementById('qr-generated');
        if (qrGeneratedEl) {
            // Count unique QR generations in localStorage
            let count = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.includes('icctStudentQR')) {
                    count++;
                }
            }
            qrGeneratedEl.textContent = count;
        }
    }
    
    showNotification(message, type = 'info') {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            info: '#3498db'
        };
        
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${colors[type] || colors.info};
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }
    
    // Get the current QR data for other components
    getQRData() {
        const saved = localStorage.getItem('icctStudentQR');
        return saved ? JSON.parse(saved) : null;
    }
    
    // Validate QR data format
    isValidQRData(data) {
        return data && 
               typeof data === 'object' &&
               data.studentId &&
               data.name &&
               data.campus &&
               data.hasOwnProperty('email');
    }
}

// Initialize Safety Check
document.addEventListener('DOMContentLoaded', () => {
    if (!window.qrGenerator) {
        window.qrGenerator = new QRGenerator();
    }
});