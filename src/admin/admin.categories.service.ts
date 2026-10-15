import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

@Injectable()
export class AdminCategoriesService {
  constructor(
    @Inject('DB_POOL')
    private readonly pool: Pool,
  ) {}

  async list() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id_subcategoria AS id, nombre AS name FROM subcategoria ORDER BY nombre',
    );
    return rows.map((row) => ({ id: Number(row.id), name: String(row.name) }));
  }

  async create(name: string) {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        'INSERT INTO subcategoria (nombre) VALUES (?)',
        [name.trim()],
      );
      return { id: result.insertId, name: name.trim() };
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  async update(id: number, name: string) {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        'UPDATE subcategoria SET nombre = ? WHERE id_subcategoria = ?',
        [name.trim(), id],
      );
      if (result.affectedRows === 0) {
        throw new NotFoundException('Categoría no encontrada');
      }
      return { id, name: name.trim() };
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const [result] = await this.pool.query<ResultSetHeader>(
        'DELETE FROM subcategoria WHERE id_subcategoria = ?',
        [id],
      );
      if (result.affectedRows === 0) {
        throw new NotFoundException('Categoría no encontrada');
      }
      return { id };
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ConflictException('No se puede eliminar: hay reportes que usan esta categoría');
      }
      throw error;
    }
  }
}