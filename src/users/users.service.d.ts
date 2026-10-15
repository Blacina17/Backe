import type { Pool } from 'mysql2/promise';
import { UpdateProfileDto } from './dto/update.profile.dto';
export declare class UsersService {
    private readonly pool;
    constructor(pool: Pool);
    profile(userId: number): Promise<{
        name: string;
        email: string;
        country: string | null;
        photoUrl: string | null;
        registeredAt: string;
    }>;
    update(userId: number, dto: UpdateProfileDto): Promise<{
        name: string;
        email: string;
        country: string | null;
        photoUrl: string | null;
        registeredAt: string;
    }>;
    setPhoto(userId: number, file: Express.Multer.File | undefined): Promise<{
        name: string;
        email: string;
        country: string | null;
        photoUrl: string | null;
        registeredAt: string;
    }>;
    changePassword(userId: number, current: string, next: string): Promise<{
        message: string;
    }>;
}
