import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../database/database.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { PasswordResetController } from './password.reset.controller';
import { PasswordResetService } from './password.reset.service';
import { UsersRepository } from './users.repository';

/**
 * Modulo de autenticacion y recuperacion de contrasena de la app.
 *
 * Registra tanto el login/registro normal (AuthController) como el
 * flujo de "olvide mi contrasena" (PasswordResetController), que
 * depende de MailService para enviar el codigo por correo.
 *
 * El panel de administracion usa su propio modulo (admin/admin.module.ts),
 * que importa AuthModule para reutilizar AuthService en el login de admins.
 */
@Module({
  imports: [DatabaseModule, ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])],
  controllers: [AuthController, PasswordResetController],
  providers: [AuthService, UsersRepository, AuthGuard, PasswordResetService, MailService],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}