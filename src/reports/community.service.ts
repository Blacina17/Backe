import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { SQL_APPROVED, SQL_REJECTED } from '../admin/report.status';
import { normalizeSite } from './reports.service';

type Risk = 'high' | 'medium' | 'safe';

@Injectable()
export class CommunityService {
  constructor(
    @Inject('DB_POOL')
    private readonly pool: Pool,
  ) {}

  /** Con reportes aprobados: alto. Solo en revisión: medio. Sin reportes: seguro. */
  private risk(total: number, approved: number): Risk {
    return approved > 0 ? 'high' : total > 0 ? 'medium' : 'safe';
  }

  async search(rawUrl: string) {
    const site = normalizeSite(rawUrl);
    const host = site.split('/')[0];

    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN ${SQL_APPROVED} THEN 1 ELSE 0 END), 0) AS approved,
              MAX(r.fecha_reporte) AS lastReport
       FROM reporte r
       INNER JOIN sitio s ON r.id_sitio = s.id_sitio
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       WHERE (s.url = ? OR s.url LIKE ?) AND NOT ${SQL_REJECTED}`,
      [host, `${host}/%`],
    );

    const total = Number(rows[0].total);
    const approved = Number(rows[0].approved);
    return {
      url: site,
      risk: this.risk(total, approved),
      reports: total,
      approved,
      lastReport: rows[0].lastReport ? new Date(rows[0].lastReport).toISOString() : null,
    };
  }

  async alerts(category?: string) {
    const params: string[] = [];
    let extra = '';
    if (category) {
      extra = ' AND c.nombre = ?';
      params.push(category);
    }

    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.id_sitio AS id, s.url AS url, COUNT(*) AS total,
              SUM(CASE WHEN ${SQL_APPROVED} THEN 1 ELSE 0 END) AS approved,
              MAX(r.fecha_reporte) AS lastReport,
              (SELECT c2.nombre FROM reporte r2
                 INNER JOIN subcategoria c2 ON r2.id_subcategoria = c2.id_subcategoria
                 WHERE r2.id_sitio = s.id_sitio
                 ORDER BY r2.fecha_reporte DESC, r2.id_reporte DESC LIMIT 1) AS category,
              (SELECT r3.descripcion FROM reporte r3
                 INNER JOIN estado_reporte e ON r3.id_estado_reporte = e.id_estado_reporte
                 WHERE r3.id_sitio = s.id_sitio AND ${SQL_APPROVED}
                 ORDER BY r3.fecha_reporte DESC, r3.id_reporte DESC LIMIT 1) AS description
       FROM reporte r
       INNER JOIN sitio s ON r.id_sitio = s.id_sitio
       INNER JOIN subcategoria c ON r.id_subcategoria = c.id_subcategoria
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       WHERE NOT ${SQL_REJECTED}${extra}
       GROUP BY s.id_sitio, s.url
       ORDER BY lastReport DESC
       LIMIT 50`,
      params,
    );

    return rows.map((row) => {
      const approved = Number(row.approved);
      return {
        id: Number(row.id),
        url: String(row.url),
        category: String(row.category),
        risk: this.risk(Number(row.total), approved),
        verified: approved > 0,
        // La descripción de un reporte sin revisar no se publica.
        description:
          approved > 0 && row.description
            ? String(row.description).slice(0, 300)
            : 'Reportado por la comunidad, en revisión.',
        lastReport: new Date(row.lastReport).toISOString(),
      };
    });
  }

  async statistics(category?: string, country?: string) {
    const conditions = [SQL_APPROVED];
    const params: string[] = [];
    if (category) {
      conditions.push('c.nombre = ?');
      params.push(category);
    }
    if (country) {
      conditions.push('u.pais = ?');
      params.push(country);
    }
    const where = conditions.join(' AND ');
    const joins = `FROM reporte r
       INNER JOIN subcategoria c ON r.id_subcategoria = c.id_subcategoria
       INNER JOIN usuario u ON r.id_usuario = u.id_usuario
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte`;

    const [summary] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT r.id_sitio) AS sites,
              COALESCE(SUM(r.fecha_reporte >= DATE_SUB(NOW(), INTERVAL 7 DAY)), 0) AS week
       FROM reporte r
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       WHERE NOT ${SQL_REJECTED}`,
    );

    const [byCategory] = await this.pool.query<RowDataPacket[]>(
      `SELECT c.nombre AS category, COUNT(*) AS total ${joins}
       WHERE ${where} GROUP BY c.id_subcategoria, c.nombre ORDER BY total DESC LIMIT 20`,
      params,
    );

    const [byMonth] = await this.pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(r.fecha_reporte, '%Y-%m') AS month, c.nombre AS category, COUNT(*) AS total ${joins}
       WHERE ${where} AND r.fecha_reporte >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month, c.id_subcategoria, c.nombre ORDER BY month`,
      params,
    );

    const [countries] = await this.pool.query<RowDataPacket[]>(
      `SELECT DISTINCT u.pais AS country FROM reporte r
       INNER JOIN usuario u ON r.id_usuario = u.id_usuario
       WHERE u.pais IS NOT NULL ORDER BY u.pais`,
    );

    const [byCountry] = await this.pool.query<RowDataPacket[]>(
      `SELECT COALESCE(u.pais, 'Sin pais') AS country, COUNT(*) AS total
       FROM reporte r
       INNER JOIN usuario u ON r.id_usuario = u.id_usuario
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       INNER JOIN subcategoria c ON r.id_subcategoria = c.id_subcategoria
       WHERE NOT ${SQL_REJECTED}${category ? ' AND c.nombre = ?' : ''}${country ? ' AND u.pais = ?' : ''}
       GROUP BY u.pais
       ORDER BY total DESC`,
      params,
    );

    return {
      summary: { sites: Number(summary[0].sites), reportsThisWeek: Number(summary[0].week) },
      byCategory: byCategory.map((row) => ({ category: String(row.category), total: Number(row.total) })),
      byMonth: byMonth.map((row) => ({
        month: String(row.month),
        category: String(row.category),
        total: Number(row.total),
      })),
      countries: countries.map((row) => String(row.country)),
      byCountry: byCountry.map((row) => ({ country: String(row.country), total: Number(row.total) })),
    };
  }

    /**
   * Devuelve el detalle completo de un sitio reportado.
   *
   * Incluye la lista de evidencias (de todos los reportes no rechazados)
   * y los reportes asociados con su estado.
   *
   * @param siteId - Identificador del sitio.
   * @returns El detalle del sitio o `null` si no existe o no tiene reportes.
   */
  async siteDetail(siteId: number) {
    // Info del sitio + categoria + riesgo + ultimo reporte
    const [siteRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.id_sitio AS id, s.url AS url, COUNT(*) AS total,
              SUM(CASE WHEN ${SQL_APPROVED} THEN 1 ELSE 0 END) AS approved,
              MAX(r.fecha_reporte) AS lastReport,
              (SELECT c2.nombre FROM reporte r2
                 INNER JOIN subcategoria c2 ON r2.id_subcategoria = c2.id_subcategoria
                 WHERE r2.id_sitio = s.id_sitio
                 ORDER BY r2.fecha_reporte DESC, r2.id_reporte DESC LIMIT 1) AS category,
              (SELECT r3.descripcion FROM reporte r3
                 INNER JOIN estado_reporte e ON r3.id_estado_reporte = e.id_estado_reporte
                 WHERE r3.id_sitio = s.id_sitio AND ${SQL_APPROVED}
                 ORDER BY r3.fecha_reporte DESC, r3.id_reporte DESC LIMIT 1) AS description
       FROM reporte r
       INNER JOIN sitio s ON r.id_sitio = s.id_sitio
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       WHERE s.id_sitio = ? AND NOT ${SQL_REJECTED}
       GROUP BY s.id_sitio, s.url`,
      [siteId],
    );

    if (!siteRows.length) return null;

    const site = siteRows[0];
    const approved = Number(site.approved);

    // Evidencias de todos los reportes no rechazados
    const [evidence] = await this.pool.query<RowDataPacket[]>(
      `SELECT ev.id_evidencia AS id, ev.ruta_imagen AS url
       FROM evidencia ev
       INNER JOIN reporte r ON ev.id_reporte = r.id_reporte
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       WHERE r.id_sitio = ? AND NOT ${SQL_REJECTED}
       ORDER BY r.fecha_reporte DESC, ev.id_evidencia ASC`,
      [siteId],
    );

    // Reportes del sitio
    const [reports] = await this.pool.query<RowDataPacket[]>(
      `SELECT r.id_reporte AS id, u.nombre AS user,
              CASE
                WHEN ${SQL_APPROVED} THEN 'approved'
                ELSE 'pending'
              END AS status,
              DATE_FORMAT(r.fecha_reporte, '%Y-%m-%d') AS date
       FROM reporte r
       INNER JOIN usuario u ON r.id_usuario = u.id_usuario
       INNER JOIN estado_reporte e ON r.id_estado_reporte = e.id_estado_reporte
       WHERE r.id_sitio = ? AND NOT ${SQL_REJECTED}
       ORDER BY r.fecha_reporte DESC, r.id_reporte DESC`,
      [siteId],
    );

    return {
      id: Number(site.id),
      url: String(site.url),
      category: String(site.category),
      risk: this.risk(Number(site.total), approved),
      verified: approved > 0,
      description:
        approved > 0 && site.description
          ? String(site.description).slice(0, 300)
          : 'Reportado por la comunidad, en revisión.',
      lastReport: new Date(site.lastReport).toISOString(),
      evidence: evidence.map((row) => ({
        id: Number(row.id),
        url: String(row.url),
      })),
      reports: reports.map((row) => ({
        id: Number(row.id),
        user: String(row.user),
        status: String(row.status),
        date: String(row.date),
      })),
    };
  }
}