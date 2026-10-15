export type ReportStatus = 'pending' | 'approved' | 'rejected';
export declare function toStatus(name: string): ReportStatus;
export declare const SQL_APPROVED = "(LOWER(e.nombre_estado) LIKE 'aprob%' OR LOWER(e.nombre_estado) = 'resuelto')";
export declare const SQL_REJECTED = "(LOWER(e.nombre_estado) LIKE 'desaprob%' OR LOWER(e.nombre_estado) LIKE 'rechaz%')";
export declare const SQL_PENDING = "(NOT (LOWER(e.nombre_estado) LIKE 'aprob%' OR LOWER(e.nombre_estado) = 'resuelto') AND NOT (LOWER(e.nombre_estado) LIKE 'desaprob%' OR LOWER(e.nombre_estado) LIKE 'rechaz%'))";
export type UserReportStatus = 'En revisión' | 'Aprobado' | 'Desaprobado';
export declare function toUserStatus(name: string): UserReportStatus;
