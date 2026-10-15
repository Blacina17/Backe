import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from './jwt';

/**
 * Guard que protege rutas con un JWT de acceso.
 *
 * Lee el header `Authorization: Bearer <token>`, verifica la firma y la
 * expiracion con `verify`, y comprueba que el token sea de tipo
 * `access`. Si todo cuadra, deja el payload en `req.user` para que los
 * decoradores y controllers lo lean.
 *
 * Solo acepta tokens de tipo `access`: un refresh token valido tambien
 * recibe 401, porque no sirve para pedir recursos.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * Verifica el token de la peticion entrante.
   *
   * @param context - Contexto de ejecucion de Nest con la peticion HTTP.
   * @returns `true` si el token es valido y de tipo `access`.
   * @throws UnauthorizedException si falta el header, el token es
   *   invalido, expiro o no es de tipo `access`.
   */
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string = req.headers.authorization ?? '';

    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Falta el token');
    }

    const payload = verify(header.slice('Bearer '.length));

    if (!payload || payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    req.user = payload;
    return true;
  }
}