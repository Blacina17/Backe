import { Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { createPool } from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';

export const DB_POOL = 'DB_POOL';

// Conexión a la base de datos de NetShield.
const DATABASE_URL = 'mysql://root:kim0608x@localhost:3306/reportes_fraude';

/**
 * Pool de conexiones a MySQL.
 *
 * Expone un unico objeto `Pool` bajo el token `DB_POOL`, que el resto
 * de los servicios inyectan con `@Inject(DB_POOL)`. Al destruirse el
 * modulo, cierra el pool para liberar las conexiones.
 */
@Module({
  providers: [
    {
      provide: DB_POOL,
      useFactory: () => {
        console.log('Connecting to ' + DATABASE_URL);
        return createPool({ uri: DATABASE_URL });
      },
    },
  ],
  exports: [DB_POOL],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  /**
   * Cierra el pool de conexiones cuando el modulo se destruye.
   *
   * Nest llama a este hook al apagar la aplicacion. Es lo que permite
   * que el proceso termine limpiamente sin dejar conexiones abiertas.
   */
  onModuleDestroy() {
    return this.pool.end();
  }
}