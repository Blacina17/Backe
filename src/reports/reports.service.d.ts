import type { Pool } from 'mysql2/promise';
import { CreateReportDto } from './dto/create.report.dto';
import { ReportResponseDto } from './dto/report.response.dto';
export declare function normalizeSite(raw: string): string;
export declare class ReportsService {
    private readonly pool;
    constructor(pool: Pool);
    private resolveCategory;
    private stateId;
    create(userId: number, dto: CreateReportDto): Promise<ReportResponseDto>;
    private load;
    findAll(userId: number): Promise<ReportResponseDto[]>;
    findOne(userId: number, id: number): Promise<ReportResponseDto>;
    private ownedOpen;
    update(userId: number, id: number, description: string): Promise<ReportResponseDto>;
    remove(userId: number, id: number): Promise<void>;
    addEvidence(userId: number, id: number, file: Express.Multer.File | undefined): Promise<ReportResponseDto>;
    listEvidence(userId: number, id: number): Promise<{
        id: number;
        url: string;
    }[]>;
    removeEvidence(userId: number, evidenceId: number): Promise<void>;
}
