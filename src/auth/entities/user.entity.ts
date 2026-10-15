/**
 * Entidad de usuario.
 *
 * Representa una fila de la tabla `usuario` ya mapeada a un objeto de
 * dominio. Los campos se declaran como opcionales porque TypeScript no
 * puede garantizar que esten presentes hasta que `toEntity` los asigne
 * desde la fila de MySQL. El repositorio es responsable de construir
 * instancias validas.
 */
export class User {
  /** Identificador unico del usuario (PK de `usuario.id_usuario`). */
  id: number | undefined;

  /** Nombre completo del usuario. */
  name: string | undefined;

  /** Correo electronico, unico en el sistema. */
  email: string | undefined;

  /**
   * Hash de la contrasena. Nunca se guarda ni se transporta en claro.
   * El algoritmo depende de `password.ts` (bcrypt o SHA-256).
   */
  passwordHash: string | undefined;

  /** Identificador del rol (`usuario.id_rol`, FK a `rol.id_rol`). */
  roleId: number | undefined;

  /** Fecha en que el usuario se registro. */
  createdAt: Date | undefined;

  /**
   * Indica si la cuenta esta activa. Las cuentas desactivadas no pueden
   * iniciar sesion aunque sus credenciales sean correctas.
   */
  active: boolean | undefined;
}