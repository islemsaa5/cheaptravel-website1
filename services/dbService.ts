import { createClient } from '@supabase/supabase-js';
import { TravelPackage, Booking, User, Subscriber } from '../types';
import { MOCK_PACKAGES as INITIAL_PACKAGES } from '../constants';
import { DB_CONFIG } from '../config/database';

const LOCAL_KEYS = {
  PACKAGES: 'ct_db_packages',
  BOOKINGS: 'ct_db_bookings',
  SUBSCRIBERS: 'ct_db_subscribers',
  PROFILES: 'ct_db_profiles',
  DELETED_IDS: 'ct_db_deleted_ids',
};

// Initialize Supabase Client
const supabase = createClient(DB_CONFIG.SUPABASE_URL, DB_CONFIG.SUPABASE_ANON_KEY);

// Helper: Convert Snake Case (DB) to Camel Case (App)
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(v => toCamelCase(v));
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

// Helper: Convert Camel Case (App) to Snake Case (DB)
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(v => toSnakeCase(v));
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

// Helper: Merge Strategy (Prefer Cloud if available, else Local)
const mergeData = <T extends { id: string }>(local: T[], cloud: T[]): T[] => {
  const map = new Map<string, T>();
  local.forEach(item => map.set(item.id, item));
  cloud.forEach(item => map.set(item.id, item)); // Cloud overwrites local if exists
  return Array.from(map.values());
};

export const dbService = {
  // 1. GESTION DES OFFRES
  getPackages: async (): Promise<TravelPackage[]> => {
    let cloudData: TravelPackage[] = [];
    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.PACKAGES)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) cloudData = toCamelCase(data);
    } catch (err) {
      console.warn("Supabase Sync Failed (getPackages). Using Local.", err);
    }

    const localStr = localStorage.getItem(LOCAL_KEYS.PACKAGES);
    const localData: TravelPackage[] = localStr ? JSON.parse(localStr) : [];

    // Check if we have initialized the DB before
    const isInitialized = localStorage.getItem('ct_db_initialized');
    const deletedIdsStr = localStorage.getItem(LOCAL_KEYS.DELETED_IDS); // New
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

    // Initial Seed only if never initialized
    if (!isInitialized && localData.length === 0 && cloudData.length === 0) {
      localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
      localStorage.setItem('ct_db_initialized', 'true');
      return INITIAL_PACKAGES;
    }

    // If initialized but empty, it means user deleted everything. Return empty.
    if (isInitialized && localData.length === 0 && cloudData.length === 0) {
      return [];
    }

    // Merge and Persist
    let merged = mergeData(localData, cloudData);

    // Filter out deleted items (Soft Delete Check + Local Blocklist)
    merged = merged.filter(item => !deletedIds.includes(item.id) && !item.isDeleted);

    localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(merged));
    return merged;
  },

  savePackage: async (pkg: TravelPackage): Promise<TravelPackage[]> => {
    console.log("Saving Package to Database...", pkg);
    try {
      const dbPkg = toSnakeCase(pkg);
      const { error } = await supabase
        .from(DB_CONFIG.TABLES.PACKAGES)
        .upsert(dbPkg, { onConflict: 'id' });

      if (error) throw error;
      console.log("Database Sync: Success");
    } catch (err) {
      console.error("Supabase Save Failed (savePackage). Saving Locally.", err);
    }

    // Local Update
    let currentPackages = await dbService.getPackages(); // This now respects deleted filter but we might need the raw list to update

    // To update correctly, we need to access the underlying storage or just append/replace in the filtered list
    // Actually, getPackages() returns filtered list. If we are saving (even a deleted one), we should probably handle it gracefully.

    // If we are soft-deleting (pkg.isDeleted is true), we want it processed but removed from view.
    const existingIndex = currentPackages.findIndex(p => p.id === pkg.id);
    if (existingIndex >= 0) {
      currentPackages[existingIndex] = pkg;
    } else {
      currentPackages = [pkg, ...currentPackages];
    }

    if (pkg.isDeleted) {
      currentPackages = currentPackages.filter(p => p.id !== pkg.id);
    }

    localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(currentPackages));
    return currentPackages;
  },

  deletePackage: async (id: string): Promise<TravelPackage[]> => {
    // 0. Add to Deleted Blocklist (Legacy/Double Safety)
    const deletedIdsStr = localStorage.getItem(LOCAL_KEYS.DELETED_IDS);
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(LOCAL_KEYS.DELETED_IDS, JSON.stringify(deletedIds));
    }

    // 1. SOFT DELETE STRATEGY: Update the item with isDeleted: true
    // We try to find the item first to preserve its other fields
    const allPkgs = await dbService.getPackages();
    const pkg = allPkgs.find(p => p.id === id);

    if (pkg) {
      const softDeletedPkg = { ...pkg, isDeleted: true };
      await dbService.savePackage(softDeletedPkg); // This pushes to cloud and updates local
    } else {
      // Fallback if not found in list (weird), just ensure local removal
      const localStr = localStorage.getItem(LOCAL_KEYS.PACKAGES);
      const localData: TravelPackage[] = localStr ? JSON.parse(localStr) : [];
      const updated = localData.filter(p => p.id !== id);
      localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(updated));
    }

    const updated = await dbService.getPackages();
    return updated;
  },

  // 2. GESTION DES RÉSERVATIONS
  getBookings: async (): Promise<Booking[]> => {
    let cloudData: Booking[] = [];
    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.BOOKINGS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) cloudData = toCamelCase(data);
    } catch (err) {
      console.warn("Supabase Sync Failed (getBookings). Using Local.", err);
    }

    const localStr = localStorage.getItem(LOCAL_KEYS.BOOKINGS);
    const localData: Booking[] = localStr ? JSON.parse(localStr) : [];

    const deletedIdsStr = localStorage.getItem(LOCAL_KEYS.DELETED_IDS);
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];

    // Merge and Persist
    let merged = mergeData(localData, cloudData);
    merged = merged.filter(item => !deletedIds.includes(item.id));

    localStorage.setItem(LOCAL_KEYS.BOOKINGS, JSON.stringify(merged));
    return merged;
  },

  saveBooking: async (booking: Booking): Promise<Booking[]> => {
    console.log("Processing Secure Booking...", booking);
    try {
      const dbBooking = toSnakeCase(booking);
      // Remove undefined fields to avoid DB errors
      Object.keys(dbBooking).forEach(key => dbBooking[key] === undefined && delete dbBooking[key]);

      const { error } = await supabase.from(DB_CONFIG.TABLES.BOOKINGS).upsert(dbBooking);
      if (error) throw error;
      console.log("Booking Confirmed & Persisted to DB");
    } catch (err) {
      console.error("Supabase Booking Save Failed.", err);
    }

    // Local Update
    const currentBookings = await dbService.getBookings();

    // Avoid duplicates if saving same ID
    const existingIndex = currentBookings.findIndex(b => b.id === booking.id);
    let updatedBookings;
    if (existingIndex >= 0) {
      currentBookings[existingIndex] = booking;
      updatedBookings = currentBookings;
    } else {
      updatedBookings = [booking, ...currentBookings];
    }

    localStorage.setItem(LOCAL_KEYS.BOOKINGS, JSON.stringify(updatedBookings));

    // Handle Stock Update
    if (booking.packageId) {
      const pkgs = await dbService.getPackages();
      const pkg = pkgs.find(p => p.id === booking.packageId);
      if (pkg) {
        pkg.stock = Math.max(0, pkg.stock - (booking.travelers?.length || 1));
        await dbService.savePackage(pkg);
      }
    }

    return updatedBookings;
  },

  updateBookingStatus: async (id: string, status: Booking['status']): Promise<Booking[]> => {
    try {
      await supabase.from(DB_CONFIG.TABLES.BOOKINGS).update({ status }).eq('id', id);
    } catch (err) {
      console.error("Supabase Update Failed.", err);
    }

    const current = await dbService.getBookings();
    const updated = current.map(b => b.id === id ? { ...b, status } : b);
    localStorage.setItem(LOCAL_KEYS.BOOKINGS, JSON.stringify(updated));

    return updated;
  },

  deleteBooking: async (id: string): Promise<Booking[]> => {
    // 0. Add to Deleted Blocklist
    const deletedIdsStr = localStorage.getItem(LOCAL_KEYS.DELETED_IDS);
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(LOCAL_KEYS.DELETED_IDS, JSON.stringify(deletedIds));
    }

    // 1. Optimistic Update
    const localStr = localStorage.getItem(LOCAL_KEYS.BOOKINGS);
    const localData: Booking[] = localStr ? JSON.parse(localStr) : [];
    const updated = localData.filter(b => b.id !== id);
    localStorage.setItem(LOCAL_KEYS.BOOKINGS, JSON.stringify(updated));

    // 2. Cloud Delete
    try {
      if (DB_CONFIG.SUPABASE_URL && !DB_CONFIG.SUPABASE_URL.includes('YOUR_PROJECT')) {
        await supabase.from(DB_CONFIG.TABLES.BOOKINGS).delete().eq('id', id);
      }
    } catch (err) {
      console.error("Supabase Delete Failed.", err);
    }

    return updated;
  },

  // 3. MARKETING
  getSubscribers: async (): Promise<Subscriber[]> => {
    let cloudData: Subscriber[] = [];
    try {
      const { data } = await supabase.from(DB_CONFIG.TABLES.SUBSCRIBERS).select('*').order('subscribedAt', { ascending: false });
      if (data) cloudData = toCamelCase(data);
    } catch (err) { console.warn("Supabase Subscribers Sync Failed.", err); }

    const localStr = localStorage.getItem(LOCAL_KEYS.SUBSCRIBERS);
    const localData = localStr ? JSON.parse(localStr) : [];

    const merged = mergeData(localData, cloudData);
    localStorage.setItem(LOCAL_KEYS.SUBSCRIBERS, JSON.stringify(merged));
    return merged;
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

    try {
      await supabase.from(DB_CONFIG.TABLES.SUBSCRIBERS).insert(toSnakeCase(newSub));
    } catch (err) { console.error("Supabase Subscriber Save Failed.", err); }

    const updated = [...subscribers, newSub];
    localStorage.setItem(LOCAL_KEYS.SUBSCRIBERS, JSON.stringify(updated));
    return updated;
  },

  // 4. PROFILS ET AUTHENTIFICATION
  getAgents: async (): Promise<User[]> => {
    let cloudData: User[] = [];
    try {
      const { data } = await supabase.from(DB_CONFIG.TABLES.PROFILES)
        .select('*')
        .eq('role', 'AGENT')
        .order('created_at', { ascending: false });
      if (data) cloudData = toCamelCase(data);
    } catch (err) { console.warn("Supabase Agents Sync Failed.", err); }

    // Fallback/Merge with local profiles not yet simulated perfectly for lists but we try typical pattern or just return cloud/mock
    // For this prototype, we'll try to fetch all profiles from local storage if we can, or just rely on cloud + basic local check
    // Since we don't have a 'getProfiles' local key effectively used for *all* profiles (just individual keys usually), 
    // we might need to assume cloud is primary or use a specific list key if we had one.
    // Let's assume for now, if offline, we might not see new agents unless we stored them in a list. 
    // BUT we do have 'ct_db_profiles' key usage in LOCAL_KEYS. Let's see if we store a list or map there.

    // Actually, looking at updateProfile, it blindly upserts to Supabase and returns. It doesn't seem to update a big "ALL PROFILES" list in local storage. 
    // It seems 'ct_user' is the only local persistence for the *current* user. 
    // To support listing agents locally, we need to start tracking them in a list.

    return cloudData;
  },

  getProfile: async (userId: string): Promise<User | null> => {
    try {
      const { data } = await supabase.from(DB_CONFIG.TABLES.PROFILES).select('*').eq('id', userId).single();
      return data ? toCamelCase(data) : null;
    } catch (err) { return null; }
  },

  getProfileByEmail: async (email: string): Promise<User | null> => {
    try {
      const { data } = await supabase.from(DB_CONFIG.TABLES.PROFILES).select('*').eq('email', email.toLowerCase()).single();
      return data ? toCamelCase(data) : null;
    } catch (err) { return null; }
  },

  updateProfile: async (user: User): Promise<User> => {
    try {
      const { data } = await supabase.from(DB_CONFIG.TABLES.PROFILES).upsert(toSnakeCase(user), { onConflict: 'id' }).select().single();
      if (data) return toCamelCase(data);
    } catch (err) { console.error("Profile Update Failed", err); }
    return user;
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
      type: isConfigured ? '🟢 CLOUD SUPABASE (OFFICIAL ADAPTER)' : 'Local Persistence (Simulation)',
      endpoint: DB_CONFIG.SUPABASE_URL
    };
  }
};
