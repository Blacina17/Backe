import type { Pool } from 'mysql2/promise';
type Status = 'pending' | 'approved' | 'rejected';
export declare class AdminUsersService {
    private readonly pool;
    constructor(pool: Pool);
    list(): Promise<{
        id: number;
        name: string;
        email: string;
        registeredAt: string;
        active: boolean;
        reports: number;
    }[]>;
    detail(id: number): Promise<{
        id: number;
        name: string;
        email: string;
        registeredAt: string;
        active: boolean;
        reports: {
            id: string;
            url: string;
            category: string;
            status: Status;
            date: string;
        }[];
    }>;
    setStatus(id: number, active: boolean): Promise<{
        id: number;
        active: boolean;
    }>;
}
export {};
