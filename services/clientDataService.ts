import { createClient } from '@supabase/supabase-js';
import {
    VisaApplication,
    UserActivity,
    LoyaltyPoints,
    LoyaltyTransaction,
    WalletTransaction,
    Trip
} from '../types';
import { DB_CONFIG } from '../config/database';

const supabase = createClient(DB_CONFIG.SUPABASE_URL, DB_CONFIG.SUPABASE_ANON_KEY);

// ============================================
// HELPER FUNCTIONS
// ============================================

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

// ============================================
// VISA APPLICATIONS
// ============================================

export const getVisaApplications = async (userId: string): Promise<VisaApplication[]> => {
    try {
        const { data, error } = await supabase
            .from('visa_applications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data ? toCamelCase(data) : [];
    } catch (err) {
        console.error('Error fetching visa applications:', err);
        return [];
    }
};

export const createVisaApplication = async (visaApp: Partial<VisaApplication>): Promise<VisaApplication | null> => {
    try {
        const dbData = toSnakeCase(visaApp);
        const { data, error } = await supabase
            .from('visa_applications')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;
        return data ? toCamelCase(data) : null;
    } catch (err) {
        console.error('Error creating visa application:', err);
        return null;
    }
};

export const updateVisaApplication = async (id: string, updates: Partial<VisaApplication>): Promise<boolean> => {
    try {
        const dbData = toSnakeCase(updates);
        const { error } = await supabase
            .from('visa_applications')
            .update(dbData)
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error updating visa application:', err);
        return false;
    }
};

// ============================================
// USER ACTIVITIES
// ============================================

export const getUserActivities = async (userId: string, limit = 10): Promise<UserActivity[]> => {
    try {
        const { data, error } = await supabase
            .from('user_activities')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data ? toCamelCase(data) : [];
    } catch (err) {
        console.error('Error fetching user activities:', err);
        return [];
    }
};

export const logActivity = async (
    userId: string,
    activityType: string,
    description: string,
    metadata?: any
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('user_activities')
            .insert({
                user_id: userId,
                activity_type: activityType,
                activity_description: description,
                metadata: metadata
            });

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error logging activity:', err);
        return false;
    }
};

// ============================================
// LOYALTY POINTS
// ============================================

export const getLoyaltyPoints = async (userId: string): Promise<LoyaltyPoints | null> => {
    try {
        const { data, error } = await supabase
            .from('loyalty_points')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            // If no record exists, create one
            if (error.code === 'PGRST116') {
                return await initializeLoyaltyPoints(userId);
            }
            throw error;
        }
        return data ? toCamelCase(data) : null;
    } catch (err) {
        console.error('Error fetching loyalty points:', err);
        return null;
    }
};

export const initializeLoyaltyPoints = async (userId: string): Promise<LoyaltyPoints | null> => {
    try {
        const { data, error } = await supabase
            .from('loyalty_points')
            .insert({
                user_id: userId,
                points_balance: 0,
                lifetime_points: 0,
                tier: 'BRONZE'
            })
            .select()
            .single();

        if (error) throw error;
        return data ? toCamelCase(data) : null;
    } catch (err) {
        console.error('Error initializing loyalty points:', err);
        return null;
    }
};

export const getLoyaltyTransactions = async (userId: string, limit = 20): Promise<LoyaltyTransaction[]> => {
    try {
        const { data, error } = await supabase
            .from('loyalty_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data ? toCamelCase(data) : [];
    } catch (err) {
        console.error('Error fetching loyalty transactions:', err);
        return [];
    }
};

// ============================================
// WALLET TRANSACTIONS
// ============================================

export const getWalletTransactions = async (userId: string, limit = 20): Promise<WalletTransaction[]> => {
    try {
        const { data, error } = await supabase
            .from('wallet_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data ? toCamelCase(data) : [];
    } catch (err) {
        console.error('Error fetching wallet transactions:', err);
        return [];
    }
};

export const createWalletTransaction = async (transaction: Partial<WalletTransaction>): Promise<boolean> => {
    try {
        const dbData = toSnakeCase(transaction);
        const { error } = await supabase
            .from('wallet_transactions')
            .insert(dbData);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error creating wallet transaction:', err);
        return false;
    }
};

// ============================================
// TRIPS
// ============================================

export const getTrips = async (userId: string): Promise<Trip[]> => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', userId)
            .order('start_date', { ascending: false });

        if (error) throw error;
        return data ? toCamelCase(data) : [];
    } catch (err) {
        console.error('Error fetching trips:', err);
        return [];
    }
};

export const getUpcomingTrips = async (userId: string): Promise<Trip[]> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .eq('user_id', userId)
            .gte('start_date', today)
            .in('status', ['CONFIRMED', 'PENDING'])
            .order('start_date', { ascending: true });

        if (error) throw error;
        return data ? toCamelCase(data) : [];
    } catch (err) {
        console.error('Error fetching upcoming trips:', err);
        return [];
    }
};

export const createTrip = async (trip: Partial<Trip>): Promise<Trip | null> => {
    try {
        const dbData = toSnakeCase(trip);
        const { data, error } = await supabase
            .from('trips')
            .insert(dbData)
            .select()
            .single();

        if (error) throw error;
        return data ? toCamelCase(data) : null;
    } catch (err) {
        console.error('Error creating trip:', err);
        return null;
    }
};

export const updateTrip = async (id: string, updates: Partial<Trip>): Promise<boolean> => {
    try {
        const dbData = toSnakeCase(updates);
        const { error } = await supabase
            .from('trips')
            .update(dbData)
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (err) {
        console.error('Error updating trip:', err);
        return false;
    }
};

// ============================================
// CLIENT CONSOLE DASHBOARD DATA
// ============================================

export const getClientDashboardData = async (userId: string) => {
    try {
        const [visas, trips, activities, loyalty, walletTransactions] = await Promise.all([
            getVisaApplications(userId),
            getTrips(userId),
            getUserActivities(userId, 5),
            getLoyaltyPoints(userId),
            getWalletTransactions(userId, 10)
        ]);

        const upcomingTrips = trips.filter(trip =>
            new Date(trip.startDate) >= new Date() &&
            (trip.status === 'CONFIRMED' || trip.status === 'PENDING')
        );

        const walletBalance = walletTransactions
            .filter(t => t.status === 'COMPLETED')
            .reduce((sum, t) => {
                if (t.transactionType === 'DEPOSIT' || t.transactionType === 'REFUND' || t.transactionType === 'BONUS') {
                    return sum + t.amount;
                } else if (t.transactionType === 'WITHDRAWAL' || t.transactionType === 'PAYMENT') {
                    return sum - t.amount;
                }
                return sum;
            }, 0);

        return {
            visaApplications: visas,
            allTrips: trips,
            upcomingTrips,
            recentActivities: activities,
            loyaltyPoints: loyalty || { pointsBalance: 0, lifetimePoints: 0, tier: 'BRONZE' },
            walletBalance,
            walletTransactions,
            stats: {
                totalTrips: trips.length,
                activeVisas: visas.filter(v => v.status === 'IN_PROGRESS' || v.status === 'PENDING').length,
                loyaltyPoints: loyalty?.pointsBalance || 0
            }
        };
    } catch (err) {
        console.error('Error fetching client dashboard data:', err);
        return null;
    }
};

export const clientDataService = {
    // Visa
    getVisaApplications,
    createVisaApplication,
    updateVisaApplication,

    // Activities
    getUserActivities,
    logActivity,

    // Loyalty
    getLoyaltyPoints,
    initializeLoyaltyPoints,
    getLoyaltyTransactions,

    // Wallet
    getWalletTransactions,
    createWalletTransaction,

    // Trips
    getTrips,
    getUpcomingTrips,
    createTrip,
    updateTrip,

    // Dashboard
    getClientDashboardData
};
