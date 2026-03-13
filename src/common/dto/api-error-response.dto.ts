import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  path: string;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  error: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];
}
