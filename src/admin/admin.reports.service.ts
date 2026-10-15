import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { toStatus } from './report.status';

@Injectable()
export class AdminReportsService {
  constructor(
    @Inject('DB_POOL')
    private readonly pool: Pool,
  ) {}

  async list() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         r.id_reporte AS id,
         s.url AS url,
         c.nombre AS category,
         u.nombre AS user,
         e.nombre_estado AS status,
         DATE_FORMAT(r.fecha_reporte, '%Y-%m-%d') AS date
       FROM reporte r
       INNER JOIN sitio s ON r.id_sitio = s.id_sitio
       INNER JOIN subcategoria c ON r.id_subcategoria = c.id_subcategoria
       INNER JOIN usuario u ON r.id_usuario = u.id_usuario
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       ORDER BY r.fecha_reporte DESC, r.id_reporte DESC
       LIMIT 1000`,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      url: String(row.url),
      category: String(row.category),
      user: String(row.user),
      status: toStatus(String(row.status)),
      date: String(row.date),
    }));
  }

  async detail(id: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         r.id_reporte AS id,
         r.id_sitio AS siteId,
         s.url AS url,
         c.nombre AS category,
         u.nombre AS user,
         e.nombre_estado AS status,
         r.descripcion AS description,
         r.observaciones AS observations,
         DATE_FORMAT(r.fecha_reporte, '%Y-%m-%d') AS date
       FROM reporte r
       INNER JOIN sitio s ON r.id_sitio = s.id_sitio
       INNER JOIN subcategoria c ON r.id_subcategoria = c.id_subcategoria
       INNER JOIN usuario u ON r.id_usuario = u.id_usuario
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       WHERE r.id_reporte = ?`,
      [id],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Reporte no encontrado');
    }

    const report = rows[0];

    const [evidence] = await this.pool.query<RowDataPacket[]>(
      'SELECT id_evidencia AS id, ruta_imagen AS path FROM evidencia WHERE id_reporte = ? ORDER BY id_evidencia',
      [id],
    );

    const [related] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         r.id_reporte AS id,
         u.nombre AS user,
         e.nombre_estado AS status,
         DATE_FORMAT(r.fecha_reporte, '%Y-%m-%d') AS date
       FROM reporte r
       INNER JOIN usuario u ON r.id_usuario = u.id_usuario
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       WHERE r.id_sitio = ? AND r.id_reporte <> ?
       ORDER BY r.fecha_reporte DESC`,
      [report.siteId, id],
    );

    return {
      id: Number(report.id),
      url: String(report.url),
      category: String(report.category),
      user: String(report.user),
      status: toStatus(String(report.status)),
      description: String(report.description),
      observations: String(report.observations ?? ''),
      date: String(report.date),
      evidence: evidence.map((row) => ({
        id: Number(row.id),
        url: '/' + String(row.path).replace(/\\/g, '/').replace(/^\/+/, ''),
      })),
      related: related.map((row) => ({
        id: Number(row.id),
        user: String(row.user),
        status: toStatus(String(row.status)),
        date: String(row.date),
      })),
    };
  }

  async setStatus(
    id: number,
    adminId: number,
    status: 'approved' | 'rejected',
    observations?: string,
  ) {
    const note = observations?.trim() ?? '';

    if (status === 'rejected' && !note) {
      throw new BadRequestException('Escribe una observación para rechazar el reporte');
    }

    const estadoMap: Record<string, string> = {
      approved: 'resuelto',
      rejected: 'rechazado',
    };

    const [states] = await this.pool.query<RowDataPacket[]>(
      'SELECT id_estado_reporte AS id FROM estado_reporte WHERE LOWER(nombre_estado) = ? LIMIT 1',
      [estadoMap[status]],
    );

    if (states.length === 0) {
      throw new BadRequestException('El estado solicitado no existe en la base de datos');
    }

    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE reporte
       SET id_estado_reporte = ?, id_admin_revisor = ?, fecha_revision = NOW(), observaciones = ?
       WHERE id_reporte = ?`,
      [states[0].id, adminId, note || null, id],
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Reporte no encontrado');
    }

    return { id, status };
  }
}