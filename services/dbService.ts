
import { TravelPackage, Booking, User, Subscriber } from '../types';
import { MOCK_PACKAGES as INITIAL_PACKAGES } from '../constants';
import { DB_CONFIG } from '../config/database';

const LOCAL_KEYS = {
  PACKAGES: 'ct_db_packages',
  BOOKINGS: 'ct_db_bookings',
  SUBSCRIBERS: 'ct_db_subscribers',
  PROFILES: 'ct_db_profiles',
};

const getHeaders = (isAdmin: boolean = false) => ({
  'Content-Type': 'application/json',
  'apikey': DB_CONFIG.SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${isAdmin ? DB_CONFIG.SUPABASE_SERVICE_ROLE : DB_CONFIG.SUPABASE_ANON_KEY}`,
  'Prefer': 'return=representation'
});

const supabaseFetch = async (table: string, method: string = 'GET', body?: any, query: string = '') => {
  if (!DB_CONFIG.IS_PRODUCTION || DB_CONFIG.SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
    return null; 
  }

  const url = `${DB_CONFIG.SUPABASE_URL}/rest/v1/${table}${query}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: getHeaders(method !== 'GET'),
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Supabase Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn(`Supabase Cloud Sync failed on table [${table}]. Running in Local Fallback mode.`, error);
    return null;
  }
};

export const dbService = {
  // 1. GESTION DES OFFRES
  getPackages: async (): Promise<TravelPackage[]> => {
    const cloudData = await supabaseFetch(DB_CONFIG.TABLES.PACKAGES, 'GET', undefined, '?select=*&order=created_at.desc');
    if (cloudData) {
      localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(cloudData));
      return cloudData;
    }
    const local = localStorage.getItem(LOCAL_KEYS.PACKAGES);
    if (!local) {
      localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
      return INITIAL_PACKAGES;
    }
    return JSON.parse(local);
  },

  savePackage: async (pkg: TravelPackage): Promise<TravelPackage[]> => {
    await supabaseFetch(DB_CONFIG.TABLES.PACKAGES, 'POST', pkg, '?on_conflict=id');
    return await dbService.getPackages();
  },

  deletePackage: async (id: string): Promise<TravelPackage[]> => {
    await supabaseFetch(DB_CONFIG.TABLES.PACKAGES, 'DELETE', undefined, `?id=eq.${id}`);
    return await dbService.getPackages();
  },

  // 2. GESTION DES RÉSERVATIONS
  getBookings: async (): Promise<Booking[]> => {
    const cloudData = await supabaseFetch(DB_CONFIG.TABLES.BOOKINGS, 'GET', undefined, '?select=*&order=created_at.desc');
    if (cloudData) {
      localStorage.setItem(LOCAL_KEYS.BOOKINGS, JSON.stringify(cloudData));
      return cloudData;
    }
    const local = localStorage.getItem(LOCAL_KEYS.BOOKINGS);
    return local ? JSON.parse(local) : [];
  },

  saveBooking: async (booking: Booking): Promise<Booking[]> => {
    await supabaseFetch(DB_CONFIG.TABLES.BOOKINGS, 'POST', booking);
    if (booking.packageId) {
      const pkgs = await dbService.getPackages();
      const pkg = pkgs.find(p => p.id === booking.packageId);
      if (pkg) {
        pkg.stock = Math.max(0, pkg.stock - (booking.travelers?.length || 1));
        await dbService.savePackage(pkg);
      }
    }
    return await dbService.getBookings();
  },

  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking[]> => {
    await supabaseFetch(DB_CONFIG.TABLES.BOOKINGS, 'PATCH', { status }, `?id=eq.${id}`);
    return await dbService.getBookings();
  },

  deleteBooking: async (id: string): Promise<Booking[]> => {
    await supabaseFetch(DB_CONFIG.TABLES.BOOKINGS, 'DELETE', undefined, `?id=eq.${id}`);
    return await dbService.getBookings();
  },

  // 3. MARKETING
  getSubscribers: async (): Promise<Subscriber[]> => {
    const cloudData = await supabaseFetch(DB_CONFIG.TABLES.SUBSCRIBERS, 'GET', undefined, '?select=*&order=subscribedAt.desc');
    if (cloudData) {
      localStorage.setItem(LOCAL_KEYS.SUBSCRIBERS, JSON.stringify(cloudData));
      return cloudData;
    }
    const local = localStorage.getItem(LOCAL_KEYS.SUBSCRIBERS);
    return local ? JSON.parse(local) : [];
  },

  addSubscriber: async (email: string): Promise<Subscriber[]> => {
    const subscribers = await dbService.getSubscribers();
    if (subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
        return subscribers;
    }
    const newSub: Subscriber = {
      id: 'SUB-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      email,
      subscribedAt: new Date().toISOString()
    };
    await supabaseFetch(DB_CONFIG.TABLES.SUBSCRIBERS, 'POST', newSub);
    const updated = [...subscribers, newSub];
    localStorage.setItem(LOCAL_KEYS.SUBSCRIBERS, JSON.stringify(updated));
    return updated;
  },

  // 4. PROFILS ET AUTHENTIFICATION
  getProfile: async (userId: string): Promise<User | null> => {
    const cloudData = await supabaseFetch(DB_CONFIG.TABLES.PROFILES, 'GET', undefined, `?id=eq.${userId}`);
    if (cloudData && cloudData.length > 0) return cloudData[0];
    return null;
  },

  // Nouvelle méthode pour chercher par email (Login réel)
  getProfileByEmail: async (email: string): Promise<User | null> => {
    const cloudData = await supabaseFetch(DB_CONFIG.TABLES.PROFILES, 'GET', undefined, `?email=eq.${email.toLowerCase()}`);
    if (cloudData && cloudData.length > 0) return cloudData[0];
    return null;
  },

  updateProfile: async (user: User): Promise<User> => {
    const response = await supabaseFetch(DB_CONFIG.TABLES.PROFILES, 'POST', user, '?on_conflict=id');
    return response && response.length > 0 ? response[0] : user;
  },

  resetToFactory: async (): Promise<TravelPackage[]> => {
    localStorage.removeItem(LOCAL_KEYS.PACKAGES);
    localStorage.removeItem(LOCAL_KEYS.BOOKINGS);
    localStorage.removeItem(LOCAL_KEYS.SUBSCRIBERS);
    localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
    return INITIAL_PACKAGES;
  },

  getDbStatus: () => {
    const isConfigured = !DB_CONFIG.SUPABASE_URL.includes('YOUR_PROJECT_ID');
    return {
      connected: isConfigured,
      type: isConfigured ? '🟢 CLOUD SUPABASE (4 TABLES)' : 'Local Persistence (Simulation)',
      endpoint: DB_CONFIG.SUPABASE_URL
    };
  }
};
