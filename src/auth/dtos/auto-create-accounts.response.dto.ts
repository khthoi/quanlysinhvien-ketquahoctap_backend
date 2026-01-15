import { ApiProperty } from '@nestjs/swagger';

class ErrorItemDto {
  @ApiProperty({ example: 123 })
  sinhVienId: number;

  @ApiProperty({ example: 'SV2023001' })
  maSinhVien: string;

  @ApiProperty({ example: 'Email này đã được sử dụng cho tài khoản khác' })
  error: string;
}

export class AutoCreateAccountsResponseDto {
  @ApiProperty({
    example: 'Đã xử lý 450 sinh viên. Thành công: 420, Thất bại: 30',
  })
  message: string;

  @ApiProperty({ example: 450 })
  totalSinhVien: number;

  @ApiProperty({ example: 420 })
  success: number;

  @ApiProperty({ example: 30 })
  failed: number;

  @ApiProperty({
    type: [ErrorItemDto],
    example: [
      {
        sinhVienId: 123,
        maSinhVien: 'SV2023001',
        error: 'Email này đã được sử dụng cho tài khoản khác',
      },
      {
        sinhVienId: 456,
        maSinhVien: 'SV2023002',
        error: 'Sinh viên này đã có tài khoản',
      },
    ],
  })
  errors: ErrorItemDto[];
}