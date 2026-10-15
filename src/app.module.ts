import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';

/**
 * Modulo raiz de la aplicacion.
 *
 * Registra los modulos funcionales y expone el controller y service
 * base. La lista de `imports` define que modulos se cargan al arrancar
 * el servidor.
 */
@Module({
  imports: [AuthModule, AdminModule, ReportsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}