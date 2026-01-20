import { createClient } from '@supabase/supabase-js';
import { TravelPackage, Booking, User, Subscriber, WalletRequest } from '../types';
import { MOCK_PACKAGES as INITIAL_PACKAGES, MOCK_BOOKINGS as INITIAL_BOOKINGS } from '../constants';
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
      let camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      // Special mapping for markup_pref
      if (key === 'markup_pref') camelKey = 'markupPreference';
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
      let snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      // Special mapping for markupPreference
      if (key === 'markupPreference') snakeKey = 'markup_pref';
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
    let fetchError = null;

    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.PACKAGES)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) cloudData = toCamelCase(data);
    } catch (err) {
      fetchError = err;
      console.warn("[DB] Supabase Fetch Failed. Falling back to local cache.", err);
    }

    const localStr = localStorage.getItem(LOCAL_KEYS.PACKAGES);
    const localData: TravelPackage[] = localStr ? JSON.parse(localStr) : [];
    const isInitialized = localStorage.getItem('ct_db_initialized');

    // MIGRATION / INITIALIZATION LOGIC
    // If Cloud is empty but we have local/mock data, perform migration to Supabase
    if (!fetchError && cloudData.length === 0) {
      const dataToMigrate = localData.length > 0 ? localData : (!isInitialized ? INITIAL_PACKAGES : []);

      if (dataToMigrate.length > 0) {
        console.log(`[DB] Supabase is empty. Migrating ${dataToMigrate.length} items to Cloud...`);
        try {
          const { error: insertError } = await supabase
            .from(DB_CONFIG.TABLES.PACKAGES)
            .insert(toSnakeCase(dataToMigrate));

          if (!insertError) {
            console.log("[DB] Migration Successful.");
            localStorage.setItem('ct_db_initialized', 'true');
            cloudData = dataToMigrate;
          } else {
            console.error("[DB] Migration Failed.", insertError);
          }
        } catch (migErr) {
          console.error("[DB] Migration Exception.", migErr);
        }
      }
    }

    // SOURCE OF TRUTH: 
    // If we have Cloud data, use it.
    // If Cloud is empty BUT we have Local data, use local (maybe it's not synced yet).
    // If Cloud Fetch failed, use Local.
    let finalData: TravelPackage[] = [];

    if (cloudData.length > 0) {
      finalData = cloudData;
      console.log(`[DB] Using ${cloudData.length} packages from Cloud.`);
    } else if (localData.length > 0) {
      finalData = localData;
      console.log(`[DB] Cloud is empty, using ${localData.length} local packages.`);
    } else if (!isInitialized) {
      finalData = INITIAL_PACKAGES;
      console.log("[DB] No data found. Using Initial Mock Packages.");
    }

    // Filter out items marked as deleted locally as double safety
    const deletedIdsStr = localStorage.getItem(LOCAL_KEYS.DELETED_IDS);
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
    const filtered = finalData.filter(item => !deletedIds.includes(item.id) && !item.isDeleted);

    // Sync Local cache for offline use
    localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(filtered));
    return filtered;
  },

  getB2BPackages: async (): Promise<TravelPackage[]> => {
    // Specifically fetch b2b only packages
    try {
      const { data } = await supabase
        .from(DB_CONFIG.TABLES.PACKAGES)
        .select('*')
        .eq('is_b2b_only', true)
        .eq('is_deleted', false);
      return data ? toCamelCase(data) : [];
    } catch { return []; }
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
    console.log(`[DB] Attempting to delete package: ${id}`);

    // 0. Add to Deleted Blocklist (Legacy/Double Safety)
    const deletedIdsStr = localStorage.getItem(LOCAL_KEYS.DELETED_IDS);
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(LOCAL_KEYS.DELETED_IDS, JSON.stringify(deletedIds));
    }

    // 1. Force Local Removal First (Immediate UI Feedback)
    const localStr = localStorage.getItem(LOCAL_KEYS.PACKAGES);
    let localData: TravelPackage[] = localStr ? JSON.parse(localStr) : [];
    localData = localData.filter(p => p.id !== id);
    localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(localData));

    // 2. HARD DELETE STRATEGY in Cloud
    try {
      const { error } = await supabase
        .from(DB_CONFIG.TABLES.PACKAGES)
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log("[DB] Cloud Sync: Package deleted forever from database");
    } catch (err) {
      console.error("[DB] Supabase Hard Delete Failed.", err);
      alert("Note: Suppression locale réussie, mais échec de suppression définitive sur le cloud. Vérifiez votre connexion.");
    }

    return localData;
  },

  // 2. GESTION DES RÉSERVATIONS
  getBookings: async (): Promise<Booking[]> => {
    let cloudData: Booking[] = [];
    let fetchError = null;

    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.BOOKINGS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) cloudData = toCamelCase(data);
    } catch (err) {
      fetchError = err;
      console.warn("[DB] Supabase Bookings Sync Failed.", err);
    }

    const localStr = localStorage.getItem(LOCAL_KEYS.BOOKINGS);
    const localData: Booking[] = localStr ? JSON.parse(localStr) : [];
    const isInitialized = localStorage.getItem('ct_db_initialized');

    // Migrate if Cloud is empty
    if (!fetchError && cloudData.length === 0) {
      const dataToMigrate = localData.length > 0 ? localData : (!isInitialized ? INITIAL_BOOKINGS : []);

      if (dataToMigrate.length > 0) {
        console.log(`[DB] Supabase is empty. Migrating ${dataToMigrate.length} bookings to Cloud...`);
        try {
          await supabase.from(DB_CONFIG.TABLES.BOOKINGS).insert(toSnakeCase(dataToMigrate));
          cloudData = dataToMigrate;
        } catch (migErr) { console.error("[DB] Bookings Migration Failed.", migErr); }
      }
    }

    // SOURCE OF TRUTH: Same logic as packages
    let finalData: Booking[] = [];
    if (cloudData.length > 0) {
      finalData = cloudData;
    } else if (localData.length > 0) {
      finalData = localData;
    } else if (!isInitialized) {
      // Fallback to initial mock bookings if first run
      finalData = typeof INITIAL_BOOKINGS !== 'undefined' ? INITIAL_BOOKINGS : [];
    }

    const deletedIdsStr = localStorage.getItem(LOCAL_KEYS.DELETED_IDS);
    const deletedIds: string[] = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
    const filtered = finalData.filter(item => !deletedIds.includes(item.id));

    localStorage.setItem(LOCAL_KEYS.BOOKINGS, JSON.stringify(filtered));
    return filtered;
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
    console.log(`[DB] Deleting booking: ${id}`);

    // 1. Local Cache Update
    const localStr = localStorage.getItem(LOCAL_KEYS.BOOKINGS);
    let localData: Booking[] = localStr ? JSON.parse(localStr) : [];
    localData = localData.filter(b => b.id !== id);
    localStorage.setItem(LOCAL_KEYS.BOOKINGS, JSON.stringify(localData));

    // 2. Cloud Hard Delete
    try {
      const { error } = await supabase.from(DB_CONFIG.TABLES.BOOKINGS).delete().eq('id', id);
      if (error) throw error;
      console.log("[DB] Booking deleted from Cloud");
    } catch (err) {
      console.error("[DB] Supabase Booking Delete Failed.", err);
    }

    return localData;
  },

  // 3. MARKETING
  getSubscribers: async (): Promise<Subscriber[]> => {
    let cloudData: Subscriber[] = [];
    let fetchError = null;

    try {
      const { data, error } = await supabase.from(DB_CONFIG.TABLES.SUBSCRIBERS).select('*').order('subscribed_at', { ascending: false });
      if (error) throw error;
      if (data) cloudData = toCamelCase(data);
    } catch (err) {
      fetchError = err;
      console.warn("[DB] Supabase Subscribers Sync Failed.", err);
    }

    const localStr = localStorage.getItem(LOCAL_KEYS.SUBSCRIBERS);
    const localData: Subscriber[] = localStr ? JSON.parse(localStr) : [];

    // Migrate if Cloud is empty
    if (!fetchError && cloudData.length === 0 && localData.length > 0) {
      console.log(`[DB] Migrating ${localData.length} subscribers to Cloud...`);
      try {
        await supabase.from(DB_CONFIG.TABLES.SUBSCRIBERS).insert(toSnakeCase(localData));
        cloudData = localData;
      } catch (migErr) { console.error("[DB] Subscribers Migration Failed.", migErr); }
    }

    const finalData = fetchError ? localData : cloudData;
    localStorage.setItem(LOCAL_KEYS.SUBSCRIBERS, JSON.stringify(finalData));
    return finalData;
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

  deleteSubscriber: async (id: string): Promise<Subscriber[]> => {
    console.log(`[DB] Deleting subscriber: ${id}`);

    // 1. Cloud Hard Delete
    try {
      const { error } = await supabase.from(DB_CONFIG.TABLES.SUBSCRIBERS).delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase Subscriber Delete Failed.", err);
    }

    // 2. Local Update
    const localStr = localStorage.getItem(LOCAL_KEYS.SUBSCRIBERS);
    const localData: Subscriber[] = localStr ? JSON.parse(localStr) : [];
    const updated = localData.filter(s => s.id !== id);
    localStorage.setItem(LOCAL_KEYS.SUBSCRIBERS, JSON.stringify(updated));
    return updated;
  },

  // 4. PROFILS ET AUTHENTIFICATION
  getAgents: async (): Promise<User[]> => {
    try {
      // Join profiles and agencies to get complete agent data
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.PROFILES)
        .select(`
          *,
          agencies:agencies(*)
        `)
        .eq('role', 'AGENT')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        return data.map(item => {
          const agency = item.agencies;
          const user = toCamelCase(item);
          if (agency) {
            const agencyData = toCamelCase(agency);
            return {
              ...user,
              ...agencyData,
              id: user.id // id is common
            };
          }
          return user;
        });
      }
    } catch (err) {
      console.error("Fetch Agents Failed", err);
    }
    return [];
  },



  getProfileByEmail: async (email: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.PROFILES)
        .select(`
          *,
          agencies:agencies(*)
        `)
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const user = toCamelCase(data);
      if (data.agencies) {
        // Handle both single object and array from Supabase join
        const rawAgency = Array.isArray(data.agencies) ? data.agencies[0] : data.agencies;
        if (rawAgency) {
          const agencyData = toCamelCase(rawAgency);
          return { ...user, ...agencyData, id: user.id };
        }
      }
      return user;
    } catch (err) {
      console.error("Get Profile By Email Failed", err);
      return null;
    }
  },

  updateProfile: async (user: User): Promise<User> => {
    try {
      // 1. Update Core Profile
      const profileData = toSnakeCase({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        password: user.password
      });

      const { error: profError } = await supabase
        .from(DB_CONFIG.TABLES.PROFILES)
        .upsert(profileData);

      if (profError) throw profError;

      // 2. If Agent, update Agency Details
      if (user.role === 'AGENT') {
        const agencyData = toSnakeCase({
          id: user.id,
          agencyName: user.agencyName,
          agencyAddress: user.agencyAddress,
          agencyPhone: user.agencyPhone,
          walletBalance: user.walletBalance,
          markupPreference: user.markupPreference,
          status: user.status
        });

        const { error: agencyError } = await supabase
          .from(DB_CONFIG.TABLES.AGENCIES)
          .upsert(agencyData);

        if (agencyError) throw agencyError;
      }
    } catch (err) {
      console.error("Profile/Agency Update Failed", err);
    }
    return user;
  },

  getProfile: async (id: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from(DB_CONFIG.TABLES.PROFILES)
        .select(`
          *,
          agencies:agencies(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const user = toCamelCase(data);
      if (data.agencies) {
        const agencyData = toCamelCase(data.agencies);
        return { ...user, ...agencyData, id: user.id };
      }
      return user;
    } catch (err) {
      console.error("Fetch Profile Failed", err);
      return null;
    }
  },

  resetToFactory: async (): Promise<TravelPackage[]> => {
    localStorage.removeItem(LOCAL_KEYS.PACKAGES);
    localStorage.removeItem(LOCAL_KEYS.BOOKINGS);
    localStorage.removeItem(LOCAL_KEYS.SUBSCRIBERS);
    localStorage.setItem(LOCAL_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
    localStorage.setItem(LOCAL_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    return INITIAL_PACKAGES;
  },

  // 5. WALLET & B2B FINANCE (NOUVEAU)
  getWalletRequests: async (agencyId?: string): Promise<WalletRequest[]> => {
    try {
      let query = supabase.from(DB_CONFIG.TABLES.WALLET_REQUESTS).select('*').order('created_at', { ascending: false });
      if (agencyId) query = query.eq('agency_id', agencyId);

      const { data, error } = await query;
      if (error) throw error;
      return data ? toCamelCase(data) : [];
    } catch (err) {
      console.error("Fetch Wallet Requests Failed", err);
      return [];
    }
  },

  createWalletRequest: async (req: Partial<WalletRequest>): Promise<void> => {
    const dbReq = toSnakeCase({
      ...req,
      id: 'WRQ-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    const { error } = await supabase.from(DB_CONFIG.TABLES.WALLET_REQUESTS).insert(dbReq);
    if (error) {
      console.error("Wallet Request DB Error:", error);
      throw new Error(error.message);
    }
  },

  updateWalletRequestStatus: async (requestId: string, status: 'APPROVED' | 'REJECTED', agencyId: string, amount: number): Promise<void> => {
    try {
      // 1. Update Request
      const { error: reqError } = await supabase
        .from(DB_CONFIG.TABLES.WALLET_REQUESTS)
        .update({ status })
        .eq('id', requestId);

      if (reqError) throw reqError;

      // 2. If approved, top up agent wallet
      if (status === 'APPROVED') {
        const { data: profile, error: profError } = await supabase
          .from(DB_CONFIG.TABLES.AGENCIES)
          .select('wallet_balance')
          .eq('id', agencyId)
          .single();

        if (profError) throw profError;

        if (profile) {
          const newBalance = (profile.wallet_balance || 0) + amount;
          const { error: updateError } = await supabase
            .from(DB_CONFIG.TABLES.AGENCIES)
            .update({ wallet_balance: newBalance })
            .eq('id', agencyId);

          if (updateError) throw updateError;
        }
      }
    } catch (err: any) {
      console.error("Update Wallet Failed", err);
      throw new Error(err.message || "Erreur lors de la mise à jour du portefeuille");
    }
  },

  deleteProfile: async (id: string): Promise<User[]> => {
    console.log(`[DB] Deleting profile: ${id}`);
    try {
      const { error } = await supabase.from(DB_CONFIG.TABLES.PROFILES).delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Profile Delete Failed", err);
    }
    return dbService.getAgents();
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
