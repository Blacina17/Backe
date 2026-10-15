import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

@Injectable()
export class AdminNotificationsService {
  constructor(
    @Inject('DB_POOL')
    private readonly pool: Pool,
  ) {}

  async list(adminId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         n.id_notificacion AS id,
         n.id_reporte AS reportId,
         s.url AS url,
         en.nombre_estado AS state,
         DATE_FORMAT(n.fecha_envio, '%Y-%m-%d') AS date
       FROM notificacion n
       INNER JOIN reporte r ON n.id_reporte = r.id_reporte
       INNER JOIN sitio s ON r.id_sitio = s.id_sitio
       INNER JOIN estado_notificacion en ON n.id_estado_notificacion = en.id_estado_notificacion
       WHERE n.id_administrador = ?
       ORDER BY n.fecha_envio DESC, n.id_notificacion DESC
       LIMIT 100`,
      [adminId],
    );

    return rows.map((row) => ({
      id: Number(row.id),
      reportId: Number(row.reportId),   // <-- NUEVO
      message: `Nuevo reporte #${row.reportId} sobre ${row.url}`,
      date: String(row.date),
      read: String(row.state).toLowerCase().startsWith('le'),
    }));
  }

  async markAsRead(id: number, adminId: number) {
    const [states] = await this.pool.query<RowDataPacket[]>(
      "SELECT id_estado_notificacion AS id FROM estado_notificacion WHERE LOWER(nombre_estado) LIKE 'le%' LIMIT 1",
    );

    if (states.length === 0) {
      throw new BadRequestException('El estado "leída" no existe en la base de datos');
    }

    const [result] = await this.pool.query<ResultSetHeader>(
      'UPDATE notificacion SET id_estado_notificacion = ? WHERE id_notificacion = ? AND id_administrador = ?',
      [states[0].id, id, adminId],
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return { id, read: true };
  }
}