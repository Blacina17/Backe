import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';

type Status = 'pending' | 'approved' | 'rejected';

function toStatus(name: string): Status {
  const value = name.toLowerCase();
  if (value.startsWith('aprob')) return 'approved';
  if (value.startsWith('rechaz')) return 'rejected';
  return 'pending';
}

@Injectable()
export class AdminDashboardService {
  constructor(
    @Inject('DB_POOL')
    private readonly pool: Pool,
  ) {}

  async getDashboard(adminId: number) {
    const [totalsRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN LOWER(e.nombre_estado) LIKE 'pend%' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN LOWER(e.nombre_estado) LIKE 'aprob%' THEN 1 ELSE 0 END) AS approved,
         SUM(CASE WHEN LOWER(e.nombre_estado) LIKE 'rechaz%' THEN 1 ELSE 0 END) AS rejected
       FROM reporte r
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte`,
    );

    const [usersRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM usuario u
       INNER JOIN rol ro ON u.id_rol = ro.id_rol
       WHERE ro.nombre_rol <> 'admin'`,
    );

    const [unreadRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM notificacion n
       INNER JOIN estado_notificacion en
         ON n.id_estado_notificacion = en.id_estado_notificacion
       WHERE n.id_administrador = ?
       AND LOWER(en.nombre_estado) NOT IN ('leida', 'leída', 'leido', 'leído')`,
      [adminId],
    );

    const [monthRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(fecha_reporte, '%Y-%m') AS month, COUNT(*) AS total
       FROM reporte
       GROUP BY DATE_FORMAT(fecha_reporte, '%Y-%m')
       ORDER BY month DESC
       LIMIT 12`,
    );

    const [categoryRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT c.nombre AS name, COUNT(r.id_reporte) AS total
       FROM subcategoria c
       LEFT JOIN reporte r ON r.id_subcategoria = c.id_subcategoria
       GROUP BY c.id_subcategoria, c.nombre
       ORDER BY total DESC, c.nombre`,
    );

    const [recentRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         r.id_reporte AS id,
         s.url AS url,
         c.nombre AS category,
         e.nombre_estado AS status,
         DATE_FORMAT(r.fecha_reporte, '%Y-%m-%d') AS date
       FROM reporte r
       INNER JOIN sitio s ON r.id_sitio = s.id_sitio
       INNER JOIN subcategoria c ON r.id_subcategoria = c.id_subcategoria
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       ORDER BY r.fecha_reporte DESC
       LIMIT 5`,
    );

    const [adminRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT nombre, correo FROM usuario WHERE id_usuario = ?`,
      [adminId],
    );

    const totals = totalsRows[0];

    return {
         admin: {
        name: String(adminRows[0]?.nombre ?? 'Administrador'),
        email: String(adminRows[0]?.correo ?? ''),
      },
      
      totals: {
        reports: Number(totals.total ?? 0),
        pending: Number(totals.pending ?? 0),
        approved: Number(totals.approved ?? 0),
        rejected: Number(totals.rejected ?? 0),
        users: Number(usersRows[0].total ?? 0),
      },
      unreadNotifications: Number(unreadRows[0].total ?? 0),
      byMonth: monthRows
        .map((row) => ({ month: String(row.month), total: Number(row.total) }))
        .reverse(),
      byCategory: categoryRows.map((row) => ({
        name: String(row.name),
        total: Number(row.total),
      })),
      recent: recentRows.map((row) => ({
        id: String(row.id),
        url: String(row.url),
        category: String(row.category),
        status: toStatus(String(row.status)),
        date: String(row.date),
      })),
    };
  }
}