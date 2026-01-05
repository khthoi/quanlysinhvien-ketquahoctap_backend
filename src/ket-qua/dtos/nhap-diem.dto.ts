import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NhapDiemDto {

  @ApiProperty({ description: 'ID lớp học phần', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  lopHocPhanId: number; 

  @ApiProperty({ description: 'ID sinh viên', example: 1001 })
  @IsNotEmpty()
  @IsNumber()
  sinhVienId: number

  @ApiProperty({ description: 'Điểm quá trình', example: 8.5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemQuaTrinh: number;

  @ApiProperty({ description: 'Điểm thành phần', example: 7.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemThanhPhan: number;

  @ApiProperty({ description: 'Điểm thi', example: 9.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(10)
  diemThi: number;
}