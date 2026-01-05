import { IsNotEmpty, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PhanLopDto {
  @ApiProperty({ description: 'ID lớp', example: 3 })
  @IsNotEmpty()
  @IsInt()
  lopId: number;
}