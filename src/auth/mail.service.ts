import { Injectable, Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';

/**
 * Envio de correos del flujo de recuperacion de contrasena.
 *
 * Si no hay SMTP_HOST configurado en el .env, el codigo se imprime en
 * la terminal del backend en lugar de enviarse. Eso solo debe usarse
 * en desarrollo: cualquiera con acceso a los logs podria leer el codigo
 * de cualquier usuario.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  /** Transport de nodemailer, o null si no hay SMTP configurado. */
  private readonly transport = process.env.SMTP_HOST
    ? createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      })
    : null;

  /**
   * Envia el codigo de recuperacion al correo indicado.
   * @param to Correo destino.
   * @param code Codigo en claro (XXXX-XXXX).
   */
  async sendResetCode(to: string, code: string): Promise<void> {
    if (!this.transport) {
      this.logger.warn(`[DESARROLLO] Código de recuperación para ${to}: ${code}`);
      return;
    }

    await this.transport.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: 'Código para restablecer tu contraseña de NetShield',
      text:
        `Tu código es: ${code}\n\n` +
        'Vale 15 minutos. Si no lo solicitaste, ignora este mensaje.',
    });
  }
}