import { AdminUsersService } from './admin.users.service';
import { UserStatusDto } from './dto/user.status.dto';
export declare class AdminUsersController {
    private readonly users;
    constructor(users: AdminUsersService);
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
            status: "pending" | "approved" | "rejected";
            date: string;
        }[];
    }>;
    setStatus(id: number, body: UserStatusDto): Promise<{
        id: number;
        active: boolean;
    }>;
}
