import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateHocKyDto {
  @ApiPropertyOptional({
    description: 'Ngày bắt đầu học kỳ (định dạng ISO: YYYY-MM-DD)',
    example: '2025-09-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  ngayBatDau?: string;

  @ApiPropertyOptional({
    description: 'Ngày kết thúc học kỳ (định dạng ISO: YYYY-MM-DD)',
    example: '2026-01-20',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  ngayKetThuc?: string;
}
