import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Datos para crear un codigo de invitacion.
 *
 * `days` es opcional; si no se envia, el servicio usa 7 dias por
 * defecto. El codigo se genera aleatoriamente y se guarda hasheado.
 */
export class CreateInvitationDto {
  /** Dias de vigencia del codigo. */
  @ApiPropertyOptional({
    description: 'Dias de vigencia del codigo. Por defecto 7',
    example: 7,
    minimum: 1,
    maximum: 30,
    default: 7,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  days?: number;
}