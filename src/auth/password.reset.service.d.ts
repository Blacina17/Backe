import type { Pool } from 'mysql2/promise';
import { MailService } from './mail.service';
export declare class PasswordResetService {
    private readonly pool;
    private readonly mail;
    private readonly logger;
    constructor(pool: Pool, mail: MailService);
    request(email: string): Promise<{
        message: string;
    }>;
    reset(email: string, code: string, newPassword: string): Promise<{
        message: string;
    }>;
}
