import type { Pool } from 'mysql2/promise';
export declare class AdminStatisticsService {
    private readonly pool;
    constructor(pool: Pool);
    private filters;
    byCategory(from?: string, to?: string, country?: string): Promise<{
        name: string;
        total: number;
    }[]>;
    byStatus(from?: string, to?: string, country?: string): Promise<{
        key: string;
        name: string;
        total: number;
    }[]>;
    trends(from?: string, to?: string, country?: string): Promise<{
        month: string;
        total: number;
    }[]>;
    bySite(from?: string, to?: string, category?: string, country?: string): Promise<{
        url: string;
        total: number;
        users: number;
        categories: string;
        lastReport: string;
    }[]>;
    byCountry(from?: string, to?: string, category?: string, country?: string): Promise<{
        country: string;
        total: number;
    }[]>;
    countries(): Promise<string[]>;
    overview(from?: string, to?: string, category?: string, country?: string): Promise<{
        total: number;
        byCategory: {
            name: string;
            total: number;
        }[];
        byStatus: {
            key: string;
            name: string;
            total: number;
        }[];
        byMonth: {
            month: string;
            total: number;
        }[];
        bySite: {
            url: string;
            total: number;
            users: number;
            categories: string;
            lastReport: string;
        }[];
        byCountry: {
            country: string;
            total: number;
        }[];
        countries: string[];
    }>;
}
