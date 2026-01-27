// ==================== RBAC AUTH SYSTEM ====================

export type Role = 'superuser' | 'commander' | 'analyst' | 'viewer';
export type AgencyId = 'admin' | 'police' | 'ib' | 'act' | 'fire' | 'bomb_squad' | 'women_cell';

export interface User {
    id: string;
    username: string;
    name: string;
    role: Role;
    agency: AgencyId;
    agencyName: string;
    clearance: 'L1' | 'L2' | 'L3' | 'L4';
    permissions: string[];
}

export interface Credentials {
    username: string;
    password: string;
    user: User;
}

// Role-based permissions
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
    superuser: [
        'view:all', 'edit:all', 'delete:all', 'admin:users', 'admin:system',
        'share:intel', 'view:classified', 'export:data', 'manage:agencies'
    ],
    commander: [
        'view:all', 'edit:own', 'share:intel', 'view:classified',
        'dispatch:units', 'escalate:alerts', 'export:data'
    ],
    analyst: [
        'view:all', 'edit:own', 'share:intel', 'view:sensitive', 'export:reports'
    ],
    viewer: [
        'view:unclassified', 'view:own_agency'
    ],
};

// Predefined credentials for different law enforcement agencies
export const CREDENTIALS: Credentials[] = [
    // Superuser
    {
        username: 'admin',
        password: 'admin123',
        user: {
            id: 'SUPER-001',
            username: 'admin',
            name: 'System Administrator',
            role: 'superuser',
            agency: 'admin',
            agencyName: 'SHIELD Command',
            clearance: 'L4',
            permissions: ROLE_PERMISSIONS.superuser,
        },
    },
    // Jaipur Police
    {
        username: 'pol_cmd',
        password: 'police@123',
        user: {
            id: 'JP-CMD-001',
            username: 'pol_cmd',
            name: 'ACP Rajesh Sharma',
            role: 'commander',
            agency: 'police',
            agencyName: 'Jaipur Police',
            clearance: 'L3',
            permissions: ROLE_PERMISSIONS.commander,
        },
    },
    {
        username: 'pol_analyst',
        password: 'police@123',
        user: {
            id: 'JP-ANL-002',
            username: 'pol_analyst',
            name: 'SI Priya Verma',
            role: 'analyst',
            agency: 'police',
            agencyName: 'Jaipur Police',
            clearance: 'L2',
            permissions: ROLE_PERMISSIONS.analyst,
        },
    },
    // Intelligence Bureau
    {
        username: 'ib_cmd',
        password: 'ib@secure456',
        user: {
            id: 'IB-CMD-001',
            username: 'ib_cmd',
            name: 'Joint Director Anil Kapoor',
            role: 'commander',
            agency: 'ib',
            agencyName: 'Intelligence Bureau',
            clearance: 'L4',
            permissions: ROLE_PERMISSIONS.commander,
        },
    },
    {
        username: 'ib_analyst',
        password: 'ib@secure456',
        user: {
            id: 'IB-ANL-002',
            username: 'ib_analyst',
            name: 'Deputy Director Neha Singh',
            role: 'analyst',
            agency: 'ib',
            agencyName: 'Intelligence Bureau',
            clearance: 'L3',
            permissions: ROLE_PERMISSIONS.analyst,
        },
    },
    // Anti-Terror Cell
    {
        username: 'act_cmd',
        password: 'act@terror789',
        user: {
            id: 'ACT-CMD-001',
            username: 'act_cmd',
            name: 'DIG Vikram Rathore',
            role: 'commander',
            agency: 'act',
            agencyName: 'Anti-Terror Cell',
            clearance: 'L4',
            permissions: ROLE_PERMISSIONS.commander,
        },
    },
    // Fire Department
    {
        username: 'fire_cmd',
        password: 'fire@dept321',
        user: {
            id: 'FIRE-CMD-001',
            username: 'fire_cmd',
            name: 'Chief Fire Officer Suresh Kumar',
            role: 'commander',
            agency: 'fire',
            agencyName: 'Fire Department',
            clearance: 'L2',
            permissions: ROLE_PERMISSIONS.commander,
        },
    },
    // Bomb Squad
    {
        username: 'bomb_cmd',
        password: 'bomb@squad999',
        user: {
            id: 'BOMB-CMD-001',
            username: 'bomb_cmd',
            name: 'Major Arjun Mehta',
            role: 'commander',
            agency: 'bomb_squad',
            agencyName: 'Bomb Disposal Squad',
            clearance: 'L3',
            permissions: ROLE_PERMISSIONS.commander,
        },
    },
    // Women Police Cell
    {
        username: 'wpc_cmd',
        password: 'wpc@safe567',
        user: {
            id: 'WPC-CMD-001',
            username: 'wpc_cmd',
            name: 'DCP Kavita Joshi',
            role: 'commander',
            agency: 'women_cell',
            agencyName: 'Women Police Cell',
            clearance: 'L3',
            permissions: ROLE_PERMISSIONS.commander,
        },
    },
    // Viewer accounts
    {
        username: 'viewer',
        password: 'view@only',
        user: {
            id: 'VIEW-001',
            username: 'viewer',
            name: 'Public Liaison Officer',
            role: 'viewer',
            agency: 'police',
            agencyName: 'Jaipur Police',
            clearance: 'L1',
            permissions: ROLE_PERMISSIONS.viewer,
        },
    },
];

// Auth helper functions
export function authenticate(username: string, password: string): User | null {
    const cred = CREDENTIALS.find(
        (c) => c.username.toLowerCase() === username.toLowerCase() && c.password === password
    );
    return cred ? cred.user : null;
}

export function hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    if (user.permissions.includes('view:all') || user.permissions.includes('edit:all')) {
        return true;
    }
    return user.permissions.includes(permission);
}

export function getRoleBadgeColor(role: Role): string {
    switch (role) {
        case 'superuser': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'commander': return 'bg-red-100 text-red-700 border-red-200';
        case 'analyst': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'viewer': return 'bg-slate-100 text-slate-600 border-slate-200';
        default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
}

export function getAgencyColor(agency: AgencyId): string {
    const colors: Record<AgencyId, string> = {
        admin: '#8b5cf6',
        police: '#3b82f6',
        ib: '#6366f1',
        act: '#dc2626',
        fire: '#f97316',
        bomb_squad: '#b91c1c',
        women_cell: '#ec4899',
    };
    return colors[agency] || '#64748b';
}

// Storage keys
const AUTH_STORAGE_KEY = 'shield_auth_user';

export function saveUserToStorage(user: User): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
}

export function getUserFromStorage(): User | null {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored) as User;
            } catch {
                return null;
            }
        }
    }
    return null;
}

export function clearUserFromStorage(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
    }
}
