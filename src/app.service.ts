import { Injectable } from '@nestjs/common';

/**
 * Servicio base de la aplicacion.
 *
 * Nest lo genera por defecto al crear un proyecto. En NetShield no tiene
 * logica de negocio propia: su unico metodo devuelve una cadena fija que
 * sirve como comprobacion rapida de que el servidor responde.
 */
@Injectable()
export class AppService {
  /**
   * Devuelve un saludo fijo.
   *
   * Se usa como respuesta del endpoint `GET /` para verificar que el
   * servidor esta en linea. No consume la base de datos ni depende de
   * ningun otro servicio.
   *
   * @returns La cadena `'Hello World!'`.
   */
  getHello(): string {
    return 'Hello World!';
  }
}