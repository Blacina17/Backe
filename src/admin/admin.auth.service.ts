import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { createHash, timingSafeEqual } from 'node:crypto';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from '../auth/dto/login.dto';
import { hashPassword } from '../auth/password';
import { AdminRegisterDto } from './dto/admin.register.dto';
import { hashInviteCode } from './invite.code';

/**
 * Registro de administradores y login del panel.
 *
 * El registro exige un codigo de invitacion vigente o, mientras no
 * exista ningun admin, el codigo de entorno definido en
 * `ADMIN_BOOTSTRAP_CODE`. El login delega en {@link AuthService} con la
 * audiencia `admin` para que se apliquen las mismas reglas de rol y
 * estado de cuenta que en la app.
 */
@Injectable()
export class AdminAuthService {
  constructor(
    @Inject('DB_POOL')
    private readonly pool: Pool,
    private readonly authService: AuthService,
  ) {}

  /**
   * Verifica si el codigo dado es el de arranque y si aun no existe
   * ningun administrador.
   *
   * El codigo se compara con la variable de entorno en tiempo constante
   * para no filtrar informacion por diferencias de tiempo. Solo es
   * valido mientras la tabla de administradores este vacia: una vez
   * creado el primer admin, esta via queda cerrada.
   *
   * @param conn - Conexion dentro de la transaccion de registro.
   * @param code - Codigo tal como lo escribio el usuario.
   * @returns `true` si es el codigo de arranque y no hay admins.
   */
  private async isBootstrapCode(
    conn: PoolConnection,
    code: string,
  ): Promise<boolean> {
    const secret = process.env.ADMIN_BOOTSTRAP_CODE;
    if (!secret) return false;

    const given = createHash('sha256').update(code.trim()).digest();
    const expected = createHash('sha256').update(secret).digest();
    if (!timingSafeEqual(given, expected)) return false;

    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM usuario u
       INNER JOIN rol r ON u.id_rol = r.id_rol WHERE r.nombre_rol = 'admin'`,
    );
    return Number(rows[0].total) === 0;
  }

  /**
   * Crea un administrador a partir de un codigo de invitacion.
   *
   * El proceso es transaccional: se busca y bloquea un codigo vigente,
   * se verifica que el correo no exista, se inserta el usuario con rol
   * "admin" y se marca el codigo como usado. Si algo falla, se revierte
   * todo y el codigo queda disponible.
   *
   * @param data - Datos ya validados del formulario de registro.
   * @returns Un mensaje de exito y los datos basicos del admin creado.
   * @throws UnauthorizedException si el codigo no es valido ni vigente.
   * @throws ConflictException si el correo ya esta registrado.
   * @throws BadRequestException si el rol "admin" no existe en la BD.
   */
  async registerAdmin(data: AdminRegisterDto) {
    const { name, email, password, inviteCode } = data;
    const conn = await this.pool.getConnection();

    try {
      await conn.beginTransaction();

      const [codes] = await conn.query<RowDataPacket[]>(
        `SELECT id_codigo FROM codigo_invitacion
         WHERE codigo_hash = ? AND id_usuario_uso IS NULL AND fecha_expiracion > NOW()
         FOR UPDATE`,
        [hashInviteCode(inviteCode)],
      );
      const codeId: number | null = codes.length
        ? Number(codes[0].id_codigo)
        : null;

      if (codeId === null && !(await this.isBootstrapCode(conn, inviteCode))) {
        throw new UnauthorizedException('Código de invitación inválido o expirado');
      }

      const [existing] = await conn.query<RowDataPacket[]>(
        'SELECT id_usuario FROM usuario WHERE correo = ?',
        [email],
      );
      if (existing.length) {
        throw new ConflictException('El correo ya está registrado');
      }

      const [roles] = await conn.query<RowDataPacket[]>(
        'SELECT id_rol FROM rol WHERE nombre_rol = ?',
        ['admin'],
      );
      if (!roles.length) {
        throw new BadRequestException('No existe el rol de administrador');
      }

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO usuario (nombre, correo, password_hash, id_rol, fecha_registro, activo)
         VALUES (?, ?, ?, ?, NOW(), 1)`,
        [name, email, hashPassword(password), roles[0].id_rol],
      );

      if (codeId !== null) {
        await conn.query(
          'UPDATE codigo_invitacion SET id_usuario_uso = ?, fecha_uso = NOW() WHERE id_codigo = ?',
          [result.insertId, codeId],
        );
      }

      await conn.commit();
      return {
        message: 'Administrador registrado correctamente',
        admin: { id: result.insertId, name, email, role: 'admin' },
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Inicia sesion como administrador.
   *
   * Delega en {@link AuthService.login} con la audiencia `admin`, que
   * rechaza a usuarios sin rol de administrador.
   *
   * @param data - Correo y contrasena del admin.
   * @returns Un access token y un refresh token.
   */
  loginAdmin(data: LoginDto) {
    return this.authService.login(data, 'admin');
  }
}