import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * Payload para renovar un access token.
 *
 * El refresh token se verifica con la misma firma HMAC que los access
 * tokens, pero solo se acepta si su tipo es `refresh`.
 */
export class RefreshDto {
  /** El refresh token emitido en el login. */
  @ApiProperty({
    description: 'El refreshToken que regreso POST /auth/login',
    example: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIuLi4ifQ.firma',
  })
  @IsString()
  refreshToken: string | undefined;
}