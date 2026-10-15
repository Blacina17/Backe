import { Inject, Injectable } from '@nestjs/common';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { generateInviteCode, hashInviteCode } from './invite.code';

@Injectable()
export class AdminInvitationsService {
  constructor(
    @Inject('DB_POOL')
    private readonly pool: Pool,
  ) {}

  /** Crea un código nuevo. El código en claro solo se devuelve aquí, una vez. */
  async create(adminId: number, days = 7) {
    const code = generateInviteCode();

    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO codigo_invitacion (codigo_hash, id_admin_creador, fecha_expiracion)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [hashInviteCode(code), adminId, days],
    );

    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(fecha_expiracion, '%Y-%m-%d') AS expiresAt
       FROM codigo_invitacion WHERE id_codigo = ?`,
      [result.insertId],
    );

    return { code, expiresAt: String(rows[0].expiresAt) };
  }

  /** Lista los códigos con su estado. Nunca incluye el código en claro. */
  async list() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         ci.id_codigo AS id,
         CASE
           WHEN ci.id_usuario_uso IS NOT NULL THEN 'used'
           WHEN ci.fecha_expiracion <= NOW() THEN 'expired'
           ELSE 'active'
         END AS status,
         creador.nombre AS createdBy,
         usado.nombre AS usedBy,
         DATE_FORMAT(ci.fecha_creacion, '%Y-%m-%d') AS createdAt,
         DATE_FORMAT(ci.fecha_expiracion, '%Y-%m-%d') AS expiresAt
       FROM codigo_invitacion ci
       LEFT JOIN usuario creador ON ci.id_admin_creador = creador.id_usuario
       LEFT JOIN usuario usado ON ci.id_usuario_uso = usado.id_usuario
       ORDER BY ci.fecha_creacion DESC, ci.id_codigo DESC
       LIMIT 100`,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      status: String(row.status),
      createdBy: row.createdBy ? String(row.createdBy) : null,
      usedBy: row.usedBy ? String(row.usedBy) : null,
      createdAt: String(row.createdAt),
      expiresAt: String(row.expiresAt),
    }));
  }
}