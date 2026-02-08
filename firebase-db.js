// firebase-db.js - Simplified Firebase Database Integration
class FirebaseDatabase {
  constructor() {
    console.log("FirebaseDatabase constructor starting...");
    
    // Use the already initialized app from window.firebaseApp
    if (!window.firebaseApp || !window.firebaseDB) {
      console.error("Firebase not initialized. Please check index.html script.");
      // Create a fallback system
      this.createFallback();
      return;
    }
    
    this.db = window.firebaseDB;
    
    this.tables = {
      users: 'users',
      events: 'events',
      attendance: 'attendance',
      registrations: 'registrations',
      qr_codes: 'qr_codes'
    };
    
    console.log("✅ FirebaseDatabase instance created");
    
    // Initialize with sample data if empty
    setTimeout(() => this.initializeSampleData(), 1500);
  }
  
  createFallback() {
    console.warn("⚠️ Using fallback localStorage database");
    this.db = null;
    this.tables = {
      users: 'users',
      events: 'events',
      attendance: 'attendance',
      registrations: 'registrations',
      qr_codes: 'qr_codes'
    };
  }
  
  // ==========================================
  // CRUD OPERATIONS
  // ==========================================
  
  async create(table, data) {
    try {
      if (!this.tables[table]) {
        throw new Error(`Table ${table} does not exist`);
      }
      
      // Generate ID if not provided
      if (!data.id) {
        data.id = this.generateId();
      }
      
      // Add timestamps
      const timestamp = new Date().toISOString();
      data.createdAt = timestamp;
      data.updatedAt = timestamp;
      
      // If Firebase is available, use it
      if (this.db) {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js');
        const docRef = doc(this.db, table, data.id);
        await setDoc(docRef, data);
        console.log(`✅ Created ${table}/${data.id} in Firebase`);
      } else {
        // Fallback to localStorage
        const key = `icct_${table}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(data);
        localStorage.setItem(key, JSON.stringify(existing));
        console.log(`✅ Created ${table}/${data.id} in localStorage`);
      }
      
      return { id: data.id, ...data };
    } catch (error) {
      console.error(`❌ Error creating ${table}:`, error);
      // Fallback: return mock data
      return { id: data.id || this.generateId(), ...data, _error: true };
    }
  }
  
  async read(table, id) {
    try {
      if (this.db) {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js');
        const docRef = doc(this.db, table, id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
      } else {
        // Fallback to localStorage
        const key = `icct_${table}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        return existing.find(item => item.id === id) || null;
      }
      return null;
    } catch (error) {
      console.error(`❌ Error reading ${table}/${id}:`, error);
      return null;
    }
  }
  
  async readAll(table, filters = {}) {
    try {
      let results = [];
      
      if (this.db) {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js');
        const collectionRef = collection(this.db, table);
        let q = collectionRef;
        
        // Apply simple equality filters
        if (Object.keys(filters).length > 0) {
          const filterEntries = Object.entries(filters);
          if (filterEntries.length > 0) {
            const [key, value] = filterEntries[0];
            q = query(collectionRef, where(key, '==', value));
          }
        }
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });
      } else {
        // Fallback to localStorage
        const key = `icct_${table}`;
        results = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Apply filters
        if (Object.keys(filters).length > 0) {
          results = results.filter(item => {
            return Object.entries(filters).every(([key, value]) => item[key] === value);
          });
        }
      }
      
      console.log(`✅ readAll(${table}) returned ${results.length} items`);
      return results;
    } catch (error) {
      console.error(`❌ Error reading all ${table}:`, error);
      return [];
    }
  }
  
  async update(table, id, updates) {
    try {
      updates.updatedAt = new Date().toISOString();
      
      if (this.db) {
        const { doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js');
        const docRef = doc(this.db, table, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          console.warn(`${table.slice(0, -1)} with id ${id} not found`);
          return { id, ...updates, _error: true };
        }
        
        await updateDoc(docRef, updates);
        console.log(`✅ Updated ${table}/${id} in Firebase`);
      } else {
        // Fallback to localStorage
        const key = `icct_${table}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const index = existing.findIndex(item => item.id === id);
        
        if (index === -1) {
          console.warn(`${table.slice(0, -1)} with id ${id} not found`);
          return { id, ...updates, _error: true };
        }
        
        existing[index] = { ...existing[index], ...updates };
        localStorage.setItem(key, JSON.stringify(existing));
        console.log(`✅ Updated ${table}/${id} in localStorage`);
      }
      
      return { id, ...updates };
    } catch (error) {
      console.error(`❌ Error updating ${table}:`, error);
      return { id, ...updates, _error: true };
    }
  }
  
  async delete(table, id) {
    try {
      if (this.db) {
        const { doc, getDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js');
        const docRef = doc(this.db, table, id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          console.warn(`${table.slice(0, -1)} with id ${id} not found`);
          return false;
        }
        
        await deleteDoc(docRef);
        console.log(`✅ Deleted ${table}/${id} from Firebase`);
      } else {
        // Fallback to localStorage
        const key = `icct_${table}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = existing.filter(item => item.id !== id);
        
        if (existing.length === filtered.length) {
          console.warn(`${table.slice(0, -1)} with id ${id} not found`);
          return false;
        }
        
        localStorage.setItem(key, JSON.stringify(filtered));
        console.log(`✅ Deleted ${table}/${id} from localStorage`);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error deleting ${table}:`, error);
      return false;
    }
  }
  
  // ==========================================
  // HELPER METHODS
  // ==========================================
  
  async count(table, filters = {}) {
    try {
      const results = await this.readAll(table, filters);
      return results.length;
    } catch (error) {
      console.error(`❌ Error counting ${table}:`, error);
      return 0;
    }
  }
  
  async query(table, conditions) {
    try {
      const results = await this.readAll(table);
      
      return results.filter(item => {
        return Object.entries(conditions).every(([key, condition]) => {
          if (typeof condition === 'object') {
            // Handle comparison operators
            if (condition.$eq !== undefined) return item[key] === condition.$eq;
            if (condition.$ne !== undefined) return item[key] !== condition.$ne;
            if (condition.$gt !== undefined) return item[key] > condition.$gt;
            if (condition.$lt !== undefined) return item[key] < condition.$lt;
            if (condition.$gte !== undefined) return item[key] >= condition.$gte;
            if (condition.$lte !== undefined) return item[key] <= condition.$lte;
            if (condition.$in !== undefined) return condition.$in.includes(item[key]);
            if (condition.$like !== undefined) {
              return item[key] && item[key].toString().toLowerCase().includes(condition.$like.toLowerCase());
            }
          }
          // Simple equality check
          return item[key] === condition;
        });
      });
    } catch (error) {
      console.error(`❌ Error querying ${table}:`, error);
      return [];
    }
  }
  
  async search(table, searchTerm, fields = []) {
    try {
      const results = await this.readAll(table);
      
      if (!searchTerm || !fields.length) return results;
      
      return results.filter(item => {
        return fields.some(field => {
          const value = item[field];
          if (!value) return false;
          return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    } catch (error) {
      console.error(`❌ Error searching ${table}:`, error);
      return [];
    }
  }
  
  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  hashPassword(password) {
    // Simple hash for demo purposes
    return btoa(password + 'icct_salt');
  }
  
  verifyPassword(hashedPassword, password) {
    return hashedPassword === this.hashPassword(password);
  }
  
  // ==========================================
  // SAMPLE DATA INITIALIZATION
  // ==========================================
  
  async initializeSampleData() {
    try {
      console.log("🔍 Checking for sample data...");
      
      // Check if events exist
      const eventsCount = await this.count('events');
      console.log(`Found ${eventsCount} existing events`);
      
      if (eventsCount === 0) {
        console.log('📝 Initializing sample events data...');
        
        const eventsData = window.eventsData || [
          {
            id: 'event001',
            title: 'Campus Orientation 2024',
            description: 'Welcome orientation for new students',
            category: 'Academic',
            campus: 'Cainta Campus',
            date: '2024-08-15',
            time: '9:00 AM',
            location: 'Main Auditorium',
            capacity: 200,
            registered: 45,
            speaker: 'Dr. Maria Santos',
            image: 'assets/images/events/orientation.jpg',
            status: 'upcoming'
          },
          {
            id: 'event002',
            title: 'Web Development Workshop',
            description: 'Learn modern web development technologies',
            category: 'Workshop',
            campus: 'Antipolo Campus',
            date: '2024-08-20',
            time: '1:00 PM',
            location: 'Computer Lab 3',
            capacity: 40,
            registered: 38,
            speaker: 'Prof. John Dela Cruz',
            image: 'assets/images/events/workshop.jpg',
            status: 'upcoming'
          }
        ];
        
        for (const event of eventsData) {
          await this.create('events', {
            ...event,
            registered: event.registered || 0
          });
        }
        
        console.log('✅ Sample events data loaded');
      }
      
      // Check if users exist
      const usersCount = await this.count('users');
      console.log(`Found ${usersCount} existing users`);
      
      if (usersCount === 0) {
        console.log('👥 Initializing sample users data...');
        
        const sampleUsers = [
          {
            id: 'user001',
            name: 'Juan Dela Cruz',
            email: 'juan.delacruz@icct.edu.ph',
            studentId: '2023-00123',
            campus: 'Cainta Campus',
            password: this.hashPassword('password123'),
            role: 'student'
          },
          {
            id: 'user002',
            name: 'Maria Santos',
            email: 'maria.santos@icct.edu.ph',
            studentId: '2023-00234',
            campus: 'Cainta Campus',
            password: this.hashPassword('password123'),
            role: 'student'
          },
          {
            id: 'admin001',
            name: 'System Admin',
            email: 'admin@icct.edu.ph',
            studentId: 'ADMIN001',
            campus: 'Main Campus',
            password: this.hashPassword('admin123'),
            role: 'admin'
          }
        ];
        
        for (const user of sampleUsers) {
          await this.create('users', user);
        }
        
        console.log('✅ Sample users data loaded');
      }
    } catch (error) {
      console.warn('⚠️ Sample data initialization skipped:', error);
    }
  }
}

// ==========================================
// GLOBAL INITIALIZATION WITH SAFETY
// ==========================================

// Create a safe placeholder immediately
window.db = {
  readAll: async (table) => {
    console.warn(`⚠️ window.db.readAll(${table}) called before initialization - returning empty array`);
    return Promise.resolve([]);
  },
  read: async () => Promise.resolve(null),
  create: async (table, data) => Promise.resolve({ 
    id: data.id || 'temp_' + Date.now(), 
    ...data, 
    _temp: true 
  }),
  update: async () => Promise.resolve({}),
  delete: async () => Promise.resolve(true),
  count: async () => Promise.resolve(0),
  query: async () => Promise.resolve([]),
  search: async () => Promise.resolve([]),
  generateId: () => 'temp_' + Date.now(),
  hashPassword: (pwd) => btoa(pwd + 'icct_salt'),
  verifyPassword: () => false,
  tables: {
    users: 'users',
    events: 'events',
    attendance: 'attendance',
    registrations: 'registrations',
    qr_codes: 'qr_codes'
  }
};

// Initialize the real database when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  console.log("📄 DOM loaded, initializing FirebaseDatabase...");
  
  // Wait for Firebase to be initialized
  const initDatabase = () => {
    try {
      // Create the real database instance
      const realDb = new FirebaseDatabase();
      
      // Replace placeholder methods with real ones
      const methods = [
        'create', 'read', 'readAll', 'update', 'delete', 
        'count', 'query', 'search', 'generateId', 'hashPassword', 'verifyPassword'
      ];
      
      methods.forEach(method => {
        if (typeof realDb[method] === 'function') {
          window.db[method] = realDb[method].bind(realDb);
        }
      });
      
      // Copy tables reference
      window.db.tables = realDb.tables;
      
      console.log("✅ FirebaseDatabase fully initialized and attached to window.db");
      
      // Test connection after a delay
      setTimeout(async () => {
        try {
          const users = await window.db.readAll('users');
          console.log(`🔍 Test connection: Found ${users.length} users`);
        } catch (error) {
          console.warn("⚠️ Initial test connection failed:", error.message);
        }
      }, 1500);
      
    } catch (error) {
      console.error("❌ Critical error initializing FirebaseDatabase:", error);
      console.log("⚠️ Using safe placeholder database methods");
    }
  };
  
  // Start initialization
  setTimeout(initDatabase, 1000);
});