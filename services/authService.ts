
import { dbService } from './dbService';
import { User, UserRole } from '../types';

const STORAGE_KEY = 'ct_user';

export const authService = {
    // --- SESSION MANAGEMENT ---
    getCurrentUser: (): User | null => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    },

    persistSession: (user: User) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    },

    clearSession: () => {
        localStorage.removeItem(STORAGE_KEY);
    },

    // --- ACTIONS ---

    login: async (email: string, password: string): Promise<{ user: User | null; error?: string }> => {
        const cleanEmail = email.trim().toLowerCase();

        // 1. ADMIN BACKDOOR (Hardcoded for safety/demo)
        if (cleanEmail === 'cheaptravel' && password === 'cheaptravel123') {
            const admin: User = {
                id: 'ADMIN-MASTER',
                fullName: 'Directeur',
                email: cleanEmail,
                role: 'ADMIN',
                walletBalance: 0,
                agencyName: 'Headquarters'
            };
            authService.persistSession(admin);
            return { user: admin };
        }

        // 2. DEMO CLIENT (Hardcoded for demo)
        if (cleanEmail === 'client@demo.com' && password === 'demo') {
            const demo: User = {
                id: 'CLIENT-DEMO',
                fullName: 'Client VIP',
                email: cleanEmail,
                role: 'CLIENT',
                walletBalance: 0
            };
            authService.persistSession(demo);
            return { user: demo };
        }

        // 3. DATABASE CHECK
        const profile = await dbService.getProfileByEmail(cleanEmail);
        if (!profile) {
            return { user: null, error: "Compte introuvable." };
        }

        // 4. PASSWORD CHECK
        if (profile.password && profile.password !== password) {
            return { user: null, error: "Mot de passe incorrect." };
        }

        // SUCCESS
        authService.persistSession(profile);
        return { user: profile };
    },

    register: async (data: { email: string; password: string; fullName?: string; agencyName?: string; isAgent?: boolean }): Promise<{ user: User | null; error?: string }> => {
        const cleanEmail = data.email.trim().toLowerCase();

        // 1. Check Existence
        const existing = await dbService.getProfileByEmail(cleanEmail);
        if (existing) {
            return { user: null, error: "Cet email est déjà utilisé." };
        }

        // 2. Create Object
        const role: UserRole = data.isAgent ? 'AGENT' : 'CLIENT';
        const idPrefix = data.isAgent ? 'AGENT-' : 'USER-';
        const userId = idPrefix + Math.random().toString(36).substr(2, 9).toUpperCase();

        const newUser: User = {
            id: userId,
            email: cleanEmail,
            fullName: data.fullName || (data.isAgent ? data.agencyName || 'Agence' : 'Voyageur'),
            role: role,
            walletBalance: 0,
            password: data.password, // Important for future logins
            status: data.isAgent ? 'PENDING' : undefined, // Agents need approval
            agencyName: data.agencyName
        };

        // 3. Save to DB
        await dbService.updateProfile(newUser);

        // 4. Persist Session
        authService.persistSession(newUser);
        return { user: newUser };
    }
};
